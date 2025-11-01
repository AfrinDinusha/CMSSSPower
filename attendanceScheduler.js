const catalyst = require('zcatalyst-sdk-node');
const axios = require('axios');
const xml2js = require('xml2js');

/**
 * 
 * @param {import("./types/job").JobRequest} jobRequest 
 * @param {import("./types/job").Context} context 
 */
module.exports = async (jobRequest, context) => {
    try {
        const catalystApp = catalyst.initialize(context);
        const dataStore = catalystApp.datastore();
        const table = dataStore.table('BHR');

        // Use only the IN_DEVICE for both IN and OUT records
        const serials = [
          { serial: 'CEXJ224863689', direction: 'in' },
          { serial: '	CEXJ233861775', direction: 'out' }
        ];
        const userName = 'BHR';
        const userPassword = 'Buildhr@2024';

        // Dynamic date range (last 36 hours)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - 36);

        const fromDateTime = fromDate.toISOString().slice(0, 19).replace('T', ' ');
        const toDateTime = toDate.toISOString().slice(0, 19).replace('T', ' ');

        let totalInsertedCount = 0;
        for (const { serial, direction } of serials) {
          const soapBody = `
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <GetTransactionsLog xmlns="http://tempuri.org/">
                        <FromDateTime>${fromDateTime}</FromDateTime>
                        <ToDateTime>${toDateTime}</ToDateTime>
                        <SerialNumber>${serial}</SerialNumber>
                        <UserName>${userName}</UserName>
                        <UserPassword>${userPassword}</UserPassword>
                        <strDataList>123</strDataList>
                    </GetTransactionsLog>
                </soap:Body>
            </soap:Envelope>
          `;

          // Send SOAP request
          const response = await axios.post(
            'http://183.83.184.82/iclock/webapiservice.asmx',
            soapBody,
            {
              headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/GetTransactionsLog'
              }
            }
          );

          // Parse XML response
          const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
          const result = await parser.parseStringPromise(response.data);

          // Get the actual attendance data
          const transactionsString = result['soap:Envelope']['soap:Body']['GetTransactionsLogResponse']['strDataList'];

          if (!transactionsString) {
            console.log(`No attendance data found for device ${serial}`);
            continue;
          }

          // Split the log string into lines, skipping empty lines
          const lines = transactionsString.split('\n').map(line => line.trim()).filter(line => line);

          let insertedCount = 0;
          console.log(`Processing ${lines.length} lines for device ${serial} (${direction})`);
          for (const line of lines) {
            const parts = line.split(/\s+/); // split by any whitespace
            let EmployeeID, EventTime, logDirection;
            if (parts.length >= 4) {
              // EmployeeID Date Time Direction
              EmployeeID = parts[0];
              EventTime = parts[1] + ' ' + parts[2];
              logDirection = parts[3].toLowerCase();
              console.log(`Found record with direction: ${logDirection} for employee ${EmployeeID}`);
            } else if (parts.length === 3) {
              // EmployeeID Date Time (no direction in log)
              EmployeeID = parts[0];
              EventTime = parts[1] + ' ' + parts[2];
              logDirection = direction;
              console.log(`Using assigned direction: ${logDirection} for employee ${EmployeeID}`);
            } else {
              console.warn(`Skipping line (not enough parts): '${line}'`);
              continue;
            }

            // Validate EventTime format: YYYY-MM-DD HH:mm:ss
            const isValidDateTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(EventTime);
            if (!isValidDateTime) {
              console.warn(`Skipping invalid EventTime: ${EventTime} for EmployeeID: ${EmployeeID} (full line: '${line}')`);
              continue;
            }

            // Duplicate check
            const query = `SELECT CREATEDTIME FROM BHR WHERE EmployeeID = '${EmployeeID}' AND EventTime = '${EventTime}' AND Direction = '${logDirection}' AND DeviceSerial = '${serial}'`;
            const existing = await catalystApp.zcql().executeZCQLQuery(query);

            if (existing.length === 0) {
              await table.insertRow({ EmployeeID, EventTime, Direction: logDirection, DeviceSerial: serial });
              insertedCount++;
            }
          }
          totalInsertedCount += insertedCount;
          console.log(`Device ${serial} (${direction}): ${insertedCount} records inserted`);
        }
        console.log(`Job: Data fetched and stored successfully, total transaction_count: ${totalInsertedCount}`);
        context.closeWithSuccess();
    } catch (error) {
        console.error('Job: Error fetching eSSL data:', error.message);
        if(error.response) {
            console.error("Response Data:", error.response.data);
        }
        context.closeWithFailure();
    }
};
