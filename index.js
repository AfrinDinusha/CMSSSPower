'use strict';

const express = require('express');
const catalystSDK = require('zcatalyst-sdk-node');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
    const catalyst = catalystSDK.initialize(req);
    res.locals.catalyst = catalyst;
    next();
});

// Test endpoint to check if function is working
app.get('/test', (req, res) => {
    res.status(200).send({
        status: 'success',
        message: 'CriticalIncident function is working!',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint to check table schema
app.get('/test-schema', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const datastore = catalyst.datastore();
        
        try {
            const table = datastore.table('CriticalIncident');
            const zcql = catalyst.zcql();
            
            // Try to get table structure
            const result = await zcql.executeZCQLQuery('SELECT * FROM CriticalIncident LIMIT 1');
            
            res.status(200).send({
                status: 'success',
                message: 'Table exists and is accessible',
                columns: result.length > 0 ? Object.keys(result[0].CriticalIncident) : [],
                timestamp: new Date().toISOString()
            });
        } catch (tableError) {
            res.status(500).send({
                status: 'failure',
                message: 'Table access error: ' + tableError.message,
                timestamp: new Date().toISOString()
            });
        }
    } catch (err) {
        res.status(500).send({
            status: 'failure',
            message: 'Schema test error: ' + err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET: List Critical Incidents (paginated)
app.get('/incidents', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const page = parseInt(req.query.page) || 1;
        const perPage = Math.min(parseInt(req.query.perPage) || 50, 300);
        const zcql = catalyst.zcql();
        
        console.log('Fetching incidents with page:', page, 'perPage:', perPage);
        
        // Check if table exists first
        try {
            const tableCheck = await zcql.executeZCQLQuery(`SELECT ROWID FROM CriticalIncident LIMIT 1`);
            console.log('Table check successful');
        } catch (tableErr) {
            console.error('Table check failed:', tableErr.message);
            return res.status(500).send({ 
                status: 'failure', 
                message: 'CriticalIncident table does not exist. Please create the table first.' 
            });
        }
        
        // Get total count
        const countResult = await zcql.executeZCQLQuery(`SELECT COUNT(ROWID) as count FROM CriticalIncident`);
        const total = countResult[0] ? parseInt(countResult[0].CriticalIncident.count) : 0;
        console.log('Total incidents count:', total);
        
        // Get paginated results
        const result = await zcql.executeZCQLQuery(
            `SELECT ROWID, Date1, ContractEmplyee, Details, Status, CREATEDTIME, MODIFIEDTIME 
             FROM CriticalIncident 
             ORDER BY ROWID DESC 
             LIMIT ${(page - 1) * perPage},${perPage}`
        );
        
        console.log('Query result rows:', result.length);
        
        const incidents = result.map(row => ({
            id: row.CriticalIncident.ROWID,
            Date1: row.CriticalIncident.Date1,
            ContractEmplyee: row.CriticalIncident.ContractEmplyee,
            Details: row.CriticalIncident.Details,
            Status: row.CriticalIncident.Status,
            createdTime: row.CriticalIncident.CREATEDTIME,
            modifiedTime: row.CriticalIncident.MODIFIEDTIME
        }));
        
        res.status(200).send({
            status: 'success',
            data: { 
                incidents, 
                total, 
                hasMore: page * perPage < total,
                page,
                perPage
            }
        });
    } catch (err) {
        console.error('GET /incidents error:', err, err.stack);
        res.status(500).send({ 
            status: 'failure', 
            message: err.message || "Unable to fetch critical incidents." 
        });
    }
});

// GET: Single Critical Incident
app.get('/incidents/:id', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const { id } = req.params;
        const zcql = catalyst.zcql();
        
        const result = await zcql.executeZCQLQuery(
            `SELECT ROWID, Date1, ContractEmplyee, Details, Status, CREATEDTIME, MODIFIEDTIME 
             FROM CriticalIncident WHERE ROWID = ${id}`
        );
        
        if (result.length === 0) {
            return res.status(404).send({ 
                status: 'failure', 
                message: 'Critical incident not found.' 
            });
        }
        
        const incident = {
            id: result[0].CriticalIncident.ROWID,
            Date1: result[0].CriticalIncident.Date1,
            ContractEmplyee: result[0].CriticalIncident.ContractEmplyee,
            Details: result[0].CriticalIncident.Details,
            Status: result[0].CriticalIncident.Status,
            createdTime: result[0].CriticalIncident.CREATEDTIME,
            modifiedTime: result[0].CriticalIncident.MODIFIEDTIME
        };
        
        res.status(200).send({ 
            status: 'success', 
            data: { incident } 
        });
    } catch (err) {
        console.error('GET /incidents/:id error:', err);
        res.status(500).send({ 
            status: 'failure', 
            message: 'Failed to fetch critical incident.' 
        });
    }
});

// POST: Add Critical Incident
app.post('/incidents', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        
        // Check if table exists
        const datastore = catalyst.datastore();
        let table;
        try {
            table = datastore.table('CriticalIncident');
        } catch (tableError) {
            console.error('Table access error:', tableError);
            return res.status(500).send({ 
                status: 'failure', 
                message: 'CriticalIncident table not found. Please create the table first.' 
            });
        }
        
        const { 
            Date1, 
            ContractEmplyee, 
            Details, 
            Status 
        } = req.body;
        
        // Validation
        if (!ContractEmplyee) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Contract Employee is required.' 
            });
        }
        
        if (!Details) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Details are required.' 
            });
        }
        
        if (!Status) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Status is required.' 
            });
        }
        
        // Prepare row data with proper column names
        const rowData = {
            Date1: Date1 || null,
            ContractEmplyee: ContractEmplyee || null,
            Details: Details || null,
            Status: Status || null
        };
        
        console.log('Inserting row data:', rowData);
        const insertedRow = await table.insertRow(rowData);
        console.log('Row inserted successfully:', insertedRow.ROWID);
        
        res.status(200).send({
            status: 'success',
            data: { 
                incident: { 
                    id: insertedRow.ROWID, 
                    ...rowData 
                } 
            }
        });
    } catch (err) {
        console.error('POST /incidents error:', err, err.stack);
        
        // Handle column name errors
        if (err.message && err.message.includes('Invalid input value for column name')) {
            console.error('Column name error details:', err);
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Database column name error. Please check the table schema.' 
            });
        }
        
        res.status(500).send({ 
            status: 'failure', 
            message: err.message || 'Failed to add critical incident.' 
        });
    }
});

// PUT: Update Critical Incident
app.put('/incidents/:id', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const { id } = req.params;
        const datastore = catalyst.datastore();
        const table = datastore.table('CriticalIncident');
        
        const { 
            Date1, 
            ContractEmplyee, 
            Details, 
            Status 
        } = req.body;
        
        // Validation
        if (!ContractEmplyee) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Contract Employee is required.' 
            });
        }
        
        if (!Details) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Details are required.' 
            });
        }
        
        if (!Status) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Status is required.' 
            });
        }
        
        // Check if incident exists
        const zcql = catalyst.zcql();
        const existingResult = await zcql.executeZCQLQuery(
            `SELECT ROWID FROM CriticalIncident WHERE ROWID = ${id}`
        );
        
        if (existingResult.length === 0) {
            return res.status(404).send({ 
                status: 'failure', 
                message: 'Critical incident not found.' 
            });
        }
        
        // Prepare row data with proper column names
        const rowData = {
            ROWID: id,
            Date1: Date1 || null,
            ContractEmplyee: ContractEmplyee || null,
            Details: Details || null,
            Status: Status || null
        };
        
        const updatedRow = await table.updateRow(rowData);
        
        res.status(200).send({
            status: 'success',
            data: { 
                incident: { 
                    id: updatedRow.ROWID, 
                    ...rowData 
                } 
            }
        });
    } catch (err) {
        console.error('PUT /incidents/:id error:', err);
        
        res.status(500).send({ 
            status: 'failure', 
            message: err.message || 'Failed to update critical incident.' 
        });
    }
});

// DELETE: Remove Critical Incident
app.delete('/incidents/:id', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const { id } = req.params;
        const datastore = catalyst.datastore();
        const table = datastore.table('CriticalIncident');
        
        // Check if incident exists
        const zcql = catalyst.zcql();
        const result = await zcql.executeZCQLQuery(
            `SELECT ROWID FROM CriticalIncident WHERE ROWID = ${id}`
        );
        
        if (result.length === 0) {
            return res.status(404).send({ 
                status: 'failure', 
                message: 'Critical incident not found.' 
            });
        }
        
        await table.deleteRow(id);
        
        res.status(200).send({ 
            status: 'success', 
            data: { incident: { id } } 
        });
    } catch (err) {
        console.error('DELETE /incidents/:id error:', err);
        res.status(500).send({ 
            status: 'failure', 
            message: "Unable to delete critical incident." 
        });
    }
});

// POST: Bulk Import Incidents
app.post('/incidents/bulk-import', async (req, res) => {
    try {
        const { catalyst } = res.locals;
        const { incidents } = req.body;
        
        if (!Array.isArray(incidents)) {
            return res.status(400).send({ 
                status: 'failure', 
                message: 'Incidents data must be an array.' 
            });
        }
        
        const datastore = catalyst.datastore();
        const table = datastore.table('CriticalIncident');
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < incidents.length; i++) {
            const incident = incidents[i];
            
            // Validation
            if (!incident.ContractEmplyee) {
                errors.push(`Row ${i + 1}: Contract Employee is required`);
                continue;
            }
            
            if (!incident.Details) {
                errors.push(`Row ${i + 1}: Details are required`);
                continue;
            }
            
            if (!incident.Status) {
                errors.push(`Row ${i + 1}: Status is required`);
                continue;
            }
            
            try {
                const rowData = {
                    Date1: incident.Date1 || null,
                    ContractEmplyee: incident.ContractEmplyee,
                    Details: incident.Details,
                    Status: incident.Status
                };
                
                const insertedRow = await table.insertRow(rowData);
                results.push({
                    id: insertedRow.ROWID,
                    ...rowData
                });
            } catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }
        
        res.status(200).send({
            status: 'success',
            data: { 
                imported: results.length,
                errors: errors.length,
                errorDetails: errors,
                incidents: results
            }
        });
    } catch (err) {
        console.error('POST /incidents/bulk-import error:', err);
        res.status(500).send({ 
            status: 'failure', 
            message: err.message || 'Failed to import incidents.' 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send({ 
        status: 'failure', 
        message: 'Internal server error.' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send({ 
        status: 'failure', 
        message: 'Endpoint not found.' 
    });
});

module.exports = app;