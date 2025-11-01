'use strict';

const catalyst = require('zcatalyst-sdk-node');
const axios = require('axios');
const xml2js = require('xml2js');

async function fetchAndStoreAttendance(catalystApp, fromDateTimeParam, toDateTimeParam) {
    // BuildHr API credentials
    const buildHrCredentials = {
        url: 'http://183.83.184.82/iclock/webapiservice.asmx',
        userName: 'BHR',
        userPassword: 'Buildhr@2024'
    };

    // Use custom date range if provided, otherwise use default logic
    let fromDateTime, toDateTime;
    if (fromDateTimeParam && toDateTimeParam) {
        fromDateTime = fromDateTimeParam;
        toDateTime = toDateTimeParam;
    } else {
        fromDateTime = '2025-10-01 00:00';
        toDateTime = '2025-10-17 23:59';
    }

    let totalInsertedCount = 0;
    const table = catalystApp.datastore().table('BHR');

    const serials = [
        { serial: 'QJT3252101073', direction: 'in' }
    ];

    // Use exact date range provided, no month expansion
    const monthRanges = [{
        from: fromDateTime,
        to: toDateTime
    }];

    for (const { serial, direction } of serials) {
        for (const { from, to } of monthRanges) {
            // SOAP request body
            const soapBody = `
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                    <soap:Body>
                        <GetTransactionsLog xmlns="http://tempuri.org/">
                            <FromDateTime>${from}</FromDateTime>
                            <ToDateTime>${to}</ToDateTime>
                            <SerialNumber>${serial}</SerialNumber>
                            <UserName>${buildHrCredentials.userName}</UserName>
                            <UserPassword>${buildHrCredentials.userPassword}</UserPassword>
                            <strDataList>123</strDataList>
                        </GetTransactionsLog>
                    </soap:Body>
                </soap:Envelope>
            `;

            try {
                const response = await axios.post(
                    buildHrCredentials.url,
                    soapBody,
                    {
                        headers: {
                            'Content-Type': 'text/xml; charset=utf-8',
                            'SOAPAction': 'http://tempuri.org/GetTransactionsLog',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/xml, application/xml, */*',
                            'Accept-Encoding': 'gzip, deflate',
                            'Connection': 'keep-alive'
                        },
                        timeout: 30000, // 30 second timeout
                        maxRedirects: 0, // Prevent redirects
                        validateStatus: function (status) {
                            // Accept any status code as long as we get a response
                            return status >= 200 && status < 600;
                        }
                    }
                );

                console.log(`API Response Status: ${response.status}`);
                console.log(`API Response Headers:`, response.headers);
                console.log(`API Response Data Length: ${response.data ? response.data.length : 0}`);

                if (response.status !== 200) {
                    throw new Error(`ESSL server returned status ${response.status}: ${response.statusText}`);
                }

                const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
                const result = await parser.parseStringPromise(response.data);
                const transactionsString = result['soap:Envelope']['soap:Body']['GetTransactionsLogResponse']['strDataList'];

                console.log(`Raw transactions string length: ${transactionsString ? transactionsString.length : 0}`);
                if (transactionsString) {
                    console.log(`First 200 characters of transactions: ${transactionsString.substring(0, 200)}`);
                }

                if (!transactionsString) {
                    console.log(`No attendance data found for device ${serial} for range ${from} to ${to}`);
                    continue;
                }

                const lines = transactionsString.split('\n').map(line => line.trim()).filter(line => line);
                console.log(`Found ${lines.length} transaction lines to process`);
                
                let insertedCount = 0;
                
                // Group transactions by EmployeeID and Date
                const employeeTransactions = {};
                for (const line of lines) {
                    const parts = line.split(/\s+/); // Use regex to split on any whitespace
                    if (parts.length >= 3) {
                        const EmployeeID = parts[0];
                        const EventTime = parts[1] + ' ' + parts[2]; // Combine date and time parts
                        
                        // Validate EventTime format
                        const isValidDateTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(EventTime);
                        if (!isValidDateTime) {
                            console.warn(`Skipping invalid EventTime: ${EventTime}`);
                            continue;
                        }
                        
                        const date = EventTime.split(' ')[0]; // Extract date part
                        const key = `${EmployeeID}_${date}`;
                        
                        if (!employeeTransactions[key]) {
                            employeeTransactions[key] = [];
                        }
                        employeeTransactions[key].push({
                            EmployeeID,
                            EventTime,
                            DeviceSerial: serial
                        });
                    } else {
                        console.warn(`Skipping malformed line: ${line}`);
                    }
                }
                
                // Process each employee's daily transactions
                for (const [key, transactions] of Object.entries(employeeTransactions)) {
                    if (transactions.length === 0) continue;
                    
                    // Sort transactions by time
                    transactions.sort((a, b) => new Date(a.EventTime) - new Date(b.EventTime));
                    
                    const firstTransaction = transactions[0]; // First IN = Check-in
                    const lastTransaction = transactions[transactions.length - 1]; // Last IN = Check-out
                    
                    // Insert first transaction as IN (check-in)
                    const inQuery = `SELECT CREATEDTIME FROM BHR WHERE EmployeeID = '${firstTransaction.EmployeeID}' AND EventTime = '${firstTransaction.EventTime}' AND Direction = 'in' AND DeviceSerial = '${serial}'`;
                    const inExisting = await catalystApp.zcql().executeZCQLQuery(inQuery);
                    if (inExisting.length === 0) {
                        await table.insertRow({
                            EmployeeID: firstTransaction.EmployeeID,
                            EventTime: firstTransaction.EventTime,
                            Direction: 'in',
                            DeviceSerial: serial
                        });
                        insertedCount++;
                        console.log(`[IN] Inserted check-in: EmployeeID=${firstTransaction.EmployeeID}, EventTime=${firstTransaction.EventTime}`);
                    }
                    
                    // Insert last transaction as OUT (check-out) only if it's different from first transaction
                    if (firstTransaction.EventTime !== lastTransaction.EventTime) {
                        const outQuery = `SELECT CREATEDTIME FROM BHR WHERE EmployeeID = '${lastTransaction.EmployeeID}' AND EventTime = '${lastTransaction.EventTime}' AND Direction = 'out' AND DeviceSerial = '${serial}'`;
                        const outExisting = await catalystApp.zcql().executeZCQLQuery(outQuery);
                        if (outExisting.length === 0) {
                            await table.insertRow({
                                EmployeeID: lastTransaction.EmployeeID,
                                EventTime: lastTransaction.EventTime,
                                Direction: 'out',
                                DeviceSerial: serial
                            });
                            insertedCount++;
                            console.log(`[OUT] Inserted check-out: EmployeeID=${lastTransaction.EmployeeID}, EventTime=${lastTransaction.EventTime}`);
                        }
                    }
                }
                console.log(`Device ${serial} (${direction}) for ${from} to ${to}: ${insertedCount} records inserted`);
                totalInsertedCount += insertedCount;
            } catch (error) {
                console.error(`Error fetching data from device ${serial} for range ${from} to ${to}:`, error.message);
                if (error.code === 'ETIMEDOUT') {
                    console.error(`Timeout connecting to device ${serial} at ${buildHrCredentials.url}`);
                } else if (error.response) {
                    console.error("Response Data:", error.response.data);
                }
                // Continue with next device instead of failing completely
                continue;
            }
        }
    }

    return { message: 'BuildHr data fetched and stored successfully', transaction_count: totalInsertedCount };
}

module.exports = async (req, res) => {
    try {
        const catalystApp = catalyst.initialize(req);
        const dataStore = catalystApp.datastore();
        const table = dataStore.table('BHR');
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // Handle POST request for fetching ESSL data
        if (req.method === 'POST') {
            const fromDateTime = url.searchParams.get('fromDateTime');
            const toDateTime = url.searchParams.get('toDateTime');
            const testMode = url.searchParams.get('test') === 'true';
            
            console.log('FetchESSLData POST request:', { fromDateTime, toDateTime, testMode });
            
            // Test mode - just test connectivity without processing data
            if (testMode) {
                try {
                    console.log('=== CATALYST CONNECTIVITY TEST ===');
                    
                    // Test 1: Basic HTTP connectivity
                    console.log('Test 1: Basic HTTP GET to ESSL server...');
                    const startTime = Date.now();
                    try {
                        const testResponse = await axios.get('http://183.83.184.82/iclock/webapiservice.asmx', {
                            timeout: 10000,
                            validateStatus: () => true
                        });
                        const responseTime = Date.now() - startTime;
                        console.log(`✅ HTTP GET successful: Status ${testResponse.status}, Time: ${responseTime}ms`);
                    } catch (getError) {
                        const responseTime = Date.now() - startTime;
                        console.log(`❌ HTTP GET failed: ${getError.message}, Time: ${responseTime}ms`);
                    }
                    
                    // Test 2: Simple SOAP request
                    console.log('Test 2: Simple SOAP request...');
                    const soapTestBody = `
                        <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                            <soap:Body>
                                <GetTransactionsLog xmlns="http://tempuri.org/">
                                    <FromDateTime>2025-10-07 00:00:00</FromDateTime>
                                    <ToDateTime>2025-10-07 23:59:59</ToDateTime>
                                    <SerialNumber>QJT3252101073</SerialNumber>
                                    <UserName>BHR</UserName>
                                    <UserPassword>Buildhr@2024</UserPassword>
                                    <strDataList>123</strDataList>
                                </GetTransactionsLog>
                            </soap:Body>
                        </soap:Envelope>
                    `;
                    
                    const soapStartTime = Date.now();
                    try {
                        const soapResponse = await axios.post(
                            'http://183.83.184.82/iclock/webapiservice.asmx',
                            soapTestBody,
                            {
                                headers: {
                                    'Content-Type': 'text/xml; charset=utf-8',
                                    'SOAPAction': 'http://tempuri.org/GetTransactionsLog'
                                },
                                timeout: 30000,
                                validateStatus: () => true
                            }
                        );
                        const soapResponseTime = Date.now() - soapStartTime;
                        console.log(`✅ SOAP request successful: Status ${soapResponse.status}, Time: ${soapResponseTime}ms`);
                        console.log(`Response data length: ${soapResponse.data ? soapResponse.data.length : 0}`);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            message: 'Catalyst connectivity test completed',
                            results: {
                                httpGetTime: responseTime,
                                soapRequestTime: soapResponseTime,
                                soapResponseStatus: soapResponse.status,
                                soapResponseLength: soapResponse.data ? soapResponse.data.length : 0
                            }
                        }));
                    } catch (soapError) {
                        const soapResponseTime = Date.now() - soapStartTime;
                        console.log(`❌ SOAP request failed: ${soapError.message}, Time: ${soapResponseTime}ms`);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            message: 'Catalyst connectivity test failed',
                            error: soapError.message,
                            results: {
                                httpGetTime: responseTime,
                                soapRequestTime: soapResponseTime,
                                soapError: soapError.code || 'UNKNOWN'
                            }
                        }));
                    }
                    return;
                } catch (testError) {
                    console.error('Connectivity test error:', testError);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Connectivity test failed', message: testError.message }));
                    return;
                }
            }
            
            if (!fromDateTime || !toDateTime) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'fromDateTime and toDateTime are required' }));
                return;
            }
            
            // Set a timeout to prevent execution time exceeded
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Function timeout - processing took too long')), 35000); // 35 second timeout
            });
            
            const fetchPromise = (async () => {
                console.log(`Starting BuildHr data fetch for range: ${fromDateTime} to ${toDateTime}`);
                const result = await fetchAndStoreAttendance(catalystApp, fromDateTime, toDateTime);
                return result;
            })();
            
            try {
                const result = await Promise.race([fetchPromise, timeoutPromise]);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('FetchESSLData timeout or error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: 'Request timeout or processing error', 
                    message: error.message,
                    suggestion: 'Try with a smaller date range or check ESSL server connectivity'
                }));
            }
            return;
        }
        
        // Handle GET request for reading attendance data
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '200', 10);
        
        const zcql = catalystApp.zcql();
        const offset = (page - 1) * pageSize;
        let query = 'SELECT EmployeeID, EventTime, Direction, DeviceSerial, ROWID FROM BHR';
        let countQuery = 'SELECT COUNT(ROWID) as total FROM BHR';
        
        if (startDate && endDate) {
            query += ` WHERE EventTime >= '${startDate} 00:00:00' AND EventTime <= '${endDate} 23:59:59'`;
            countQuery += ` WHERE EventTime >= '${startDate} 00:00:00' AND EventTime <= '${endDate} 23:59:59'`;
        }
        
        query += ` ORDER BY ROWID DESC LIMIT ${pageSize} OFFSET ${offset}`;
        const rawResults = await zcql.executeZCQLQuery(query);
        const rows = rawResults.map(r => r.BHR);
        
        const countResult = await zcql.executeZCQLQuery(countQuery);
        const totalCount = Number(countResult[0].BHR['COUNT(ROWID)'] || 0);
        
        const hasMore = rows.length === pageSize;
        
        // Summary mode: earliest IN and latest OUT per employee per date
        if (url.searchParams.get('summary') === 'true') {
            const IN_DEVICE = 'QJT3252101073';
            let allRows = [];
            let offset = 0;
            const batchSize = 300;
            let more = true;
            
            while (more) {
                let summaryQuery = 'SELECT EmployeeID, EventTime, Direction, DeviceSerial, ROWID FROM BHR';
                if (startDate && endDate) {
                    summaryQuery += ` WHERE EventTime >= '${startDate} 00:00:00' AND EventTime <= '${endDate} 23:59:59'`;
                }
                summaryQuery += ` ORDER BY ROWID DESC LIMIT ${batchSize} OFFSET ${offset}`;
                const batchResults = await zcql.executeZCQLQuery(summaryQuery);
                const batchRows = batchResults.map(r => r.BHR);
                allRows = allRows.concat(batchRows);
                if (batchRows.length < batchSize) {
                    more = false;
                } else {
                    offset += batchSize;
                }
            }
            
            // Group and summarize
            const summary = {};
            allRows.forEach(r => {
                const date = r.EventTime.split(' ')[0];
                const key = `${r.EmployeeID}_${date}`;
                if (!summary[key]) {
                    summary[key] = {
                        EmployeeID: r.EmployeeID,
                        Date: date,
                        FirstIN: '',
                        LastOUT: ''
                    };
                }
                if (r.Direction === 'in') {
                    // Earliest time as FirstIN
                    if (!summary[key].FirstIN || r.EventTime < summary[key].FirstIN) {
                        summary[key].FirstIN = r.EventTime;
                    }
                } else if (r.Direction === 'out') {
                    // Latest time as LastOUT
                    if (!summary[key].LastOUT || r.EventTime > summary[key].LastOUT) {
                        summary[key].LastOUT = r.EventTime;
                    }
                }
            });
            
            const summaryArr = Object.values(summary);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: summaryArr, hasMore: false, totalCount: summaryArr.length }));
            return;
        }
        
        // Send response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: rows, hasMore, totalCount }));
    } catch (error) {
        console.error('Error in FetchESSLData:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
};