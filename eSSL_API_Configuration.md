# eSSL API Configuration

## API Details
- **URL**: `http://202.61.120.94:81/iclock/webapiservice.asmx?op=GetTransactionsLog`
- **Username**: `API`
- **Password**: `Api@2025`
- **Device Serial No**: `QJT3252101073`
- **Note**: Both IN & OUT in same machine

## Implementation Details

### 1. SOAP Request Structure
The API uses SOAP 1.1 protocol with the following structure:

```xml
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <GetTransactionsLog xmlns="http://tempuri.org/">
            <FromDateTime>YYYY-MM-DD HH:MM:SS</FromDateTime>
            <ToDateTime>YYYY-MM-DD HH:MM:SS</ToDateTime>
            <SerialNumber>QJT3252101073</SerialNumber>
            <UserName>API</UserName>
            <UserPassword>Api@2025</UserPassword>
            <strDataList>123</strDataList>
        </GetTransactionsLog>
    </soap:Body>
</soap:Envelope>
```

### 2. HTTP Headers
```
Content-Type: text/xml; charset=utf-8
SOAPAction: http://tempuri.org/GetTransactionsLog
```

### 3. Updated Files
The following files have been updated with the new S&S Power eSSL API configuration:

1. **`functions/attendance_job_function/attendanceScheduler.js`** ✅
   - Updated API URL to `http://202.61.120.94:81/iclock/webapiservice.asmx`
   - Updated credentials: Username `API`, Password `Api@2025`
   - Updated device serial to `QJT3252101073`
   - Modified to use single device for both IN and OUT operations

2. **`functions/attendance_function/FetchESSLData.js`** ✅
   - Updated device serial to `QJT3252101073`
   - Updated API URL to `http://202.61.120.94:81/iclock/webapiservice.asmx`
   - Updated credentials: Username `API`, Password `Api@2025`
   - Modified to use single device for both IN and OUT operations

3. **`functions/GetAttendanceList/GetAttendanceList.js`** ✅
   - Updated device serial to `QJT3252101073`
   - Modified logic to handle single device for both IN and OUT operations

4. **`functions/attendance_muster_function/index.js`** ✅
   - Updated device serial to `QJT3252101073`
   - Modified logic to handle single device for both IN and OUT operations

5. **`functions/Payment_function/index.js`** ✅
   - Updated device serial to `QJT3252101073`
   - Modified logic to handle single device for both IN and OUT operations

6. **`app/src/Attendance.js`** ✅
   - Updated device serial to `QJT3252101073`

### 4. API Response Format
The API returns transaction logs in a specific format that gets parsed and stored in the BHR table with the following fields:
- EmployeeID
- EventTime
- Direction (in/out)
- DeviceSerial
- ROWID

### 5. Usage
The eSSL API integration is used for:
- Automated attendance data fetching (scheduled job)
- Manual attendance data fetching
- Attendance muster generation
- Attendance reports and summaries

### 6. Configuration Summary
- **Endpoint**: `http://202.61.120.94:81/iclock/webapiservice.asmx`
- **Method**: POST (SOAP)
- **Authentication**: Username/Password
- **Device**: Single device for both IN and OUT transactions
- **Data Format**: XML response with transaction logs
