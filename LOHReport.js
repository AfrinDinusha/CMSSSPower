import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './reports.css';
import './employeeManagement.css';
import './Candidateform.css';
import Select from 'react-select';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from './Button';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import { 
  Users, Calendar, FileText, AlertTriangle, FolderOpen, 
  ClipboardList, Building, Handshake, Landmark, Clock, 
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon, AlertOctagon, CreditCard, Shield, FileSignature, Search, Clock3
} from 'lucide-react';
import allModules from './modulesConfig';

function exportToCSV(data, filename) {
  const csvRows = [];
  const headers = ['Employee Code', 'Employee Name', 'Department', 'Contractor', 'Loss of Hours (hrs)'];
  csvRows.push(headers.join(','));
  for (const row of data) {
    csvRows.push([
      row.employeeId,
      row.employeeName,
      row.department,
      row.contractorName,
      row.lossOfHours
    ].join(','));
  }
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function exportToExcel(data, filename) {
  // Simple Excel export using HTML table
  let table = '<table><tr><th>Employee Code</th><th>Employee Name</th><th>Department</th><th>Contractor</th><th>Loss of Hours (hrs)</th></tr>';
  for (const row of data) {
    table += `<tr><td>${row.employeeId}</td><td>${row.employeeName}</td><td>${row.department}</td><td>${row.contractorName || ''}</td><td>${row.lossOfHours}</td></tr>`;
  }
  table += '</table>';
  const blob = new Blob([
    '\ufeff',
    table
  ], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function LOHReport() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sidebar state
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Find the index of the Reports menu and set it as expanded by default
    const reportsIndex = allModules.findIndex(module => module.label === 'Reports');
    return reportsIndex !== -1 ? { [reportsIndex]: true } : {};
  });
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [contractor, setContractor] = useState('All');
  const [department, setDepartment] = useState('All');
  const [employeeId, setEmployeeId] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // Format: YYYY-MM
  });
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown state
  const [contractors, setContractors] = useState(['All']);
  const [departments, setDepartments] = useState(['All']);
  const [employees, setEmployees] = useState(['All']);

  // Set modules to show (full admin sidebar)
  const modulesToShow = allModules;

  // Toggle expandable menus
  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Ensure Reports menu stays expanded when on reports pages
  useEffect(() => {
    const reportsIndex = allModules.findIndex(module => module.label === 'Reports');
    if (reportsIndex !== -1) {
      setExpandedMenus(prev => ({
        ...prev,
        [reportsIndex]: true
      }));
    }
  }, [location.pathname]);


  // Sample activity data with Lucide icons (same as App.js)
  const recentActivities = [
    { icon: <User size={20} />, title: 'New Employee Added', description: 'John Doe joined the development team', time: '2 hours ago' },
    { icon: <BarChart3 size={20} />, title: 'Monthly Report Generated', description: 'Contractor performance report is ready', time: '4 hours ago' },
    { icon: <CheckCircle size={20} />, title: 'Contract Approved', description: 'ABC Construction contract approved', time: '6 hours ago' },
    { icon: <Bell size={20} />, title: 'System Update', description: 'Contractor Management System updated to version 2.1', time: '1 day ago' },
    { icon: <Plus size={20} />, title: 'New Application', description: 'Candidate applied for senior position', time: '2 days ago' }
  ];

  // Fetch LOH data from payroll when month or filters change
  useEffect(() => {
    async function fetchLOHData() {
      setLoading(true);
      setError('');
      try {
        // Fetch payroll data for the selected month
        let url = `/server/payroll_function/payroll?month=${selectedMonth}&_t=${Date.now()}`;
        if (contractor !== 'All') url += `&contractor=${encodeURIComponent(contractor)}`;
        if (department !== 'All') url += `&department=${encodeURIComponent(department)}`;
        if (employeeId !== 'All') url += `&employeeId=${encodeURIComponent(employeeId)}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch payroll data');
        const result = await res.json();
        
        // Filter payroll data for employees with LOH below 8 hours (and > 0)
        const payrollData = result.data || [];
        const lohData = payrollData
          .filter(employee => {
            const loh = parseFloat(employee.loh);
            return !Number.isNaN(loh) && loh > 0 && loh < 8;
          })
          .map(employee => ({
            employeeId: employee.employeeCode,
            employeeName: employee.employeeName,
            department: employee.department,
            contractorName: employee.contractor,
            lossOfHours: (parseFloat(employee.loh) || 0).toFixed(2),
            date: selectedMonth // Use month as date
          }));
        
        setTableData(lohData);
      } catch (err) {
        setError(err.message || 'Error fetching LOH data');
        setTableData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLOHData();
  }, [selectedMonth, contractor, department, employeeId]);

  // Fetch contractors from payroll function
  useEffect(() => {
    fetch('/server/payroll_function/contractors')
      .then(res => res.json())
      .then(data => setContractors(['All', ...(data.data || [])]))
      .catch(() => setContractors(['All']));
  }, []);

  // Allow refresh of contractors/departments when user opens the dropdown
  const refreshContractors = () => {
    fetch('/server/payroll_function/contractors')
      .then(res => res.json())
      .then(data => setContractors(['All', ...(data.data || [])]))
      .catch(() => setContractors(['All']));
  };

  // Fetch departments from payroll function
  useEffect(() => {
    fetch('/server/payroll_function/departments')
      .then(res => res.json())
      .then(data => setDepartments(['All', ...(data.data || [])]))
      .catch(() => setDepartments(['All']));
  }, []);

  const refreshDepartments = () => {
    fetch('/server/payroll_function/departments')
      .then(res => res.json())
      .then(data => setDepartments(['All', ...(data.data || [])]))
      .catch(() => setDepartments(['All']));
  };

  // Fetch employee codes from payroll function, filtered by contractor
  useEffect(() => {
    let url = '/server/payroll_function/employee-codes';
    if (contractor && contractor !== 'All') {
      url += `?contractor=${encodeURIComponent(contractor)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setEmployees(['All', ...(data.data || [])]))
      .catch(() => setEmployees(['All']));
    setEmployeeId('All'); // Reset employeeId when contractor changes
  }, [contractor]);

  // Prepare options for react-select
  const contractorOptions = contractors.map(c => ({ value: c, label: c }));
  const departmentOptions = departments.map(d => ({ value: d, label: d }));
  const employeeOptions = employees.map(e => ({ value: e, label: e }));

  return (
    <>
      {/* Animated Background */}
      <div className="cms-background">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>

      <div className="cms-dashboard-root">
        {/* Enhanced Sidebar */}
        <nav className="cms-sidebar">
          {/* Sidebar Header */}
          <div className="cms-sidebar-header">
            <div className="cms-header-content">
              <div className="cms-logo-section">
                <div className="cms-logo">
                  <img src={cmsLogo} alt="CMS Logo" className="cms-sidebar-logo" />
                </div>
                <div className="cms-menu-toggle" onClick={() => setShowSidebarMenu(!showSidebarMenu)}>
                  <div className="cms-three-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="cms-nav">
            {modulesToShow.map((item, idx) => (
              item.children ? (
                <div key={item.label} className={`cms-nav-expandable ${expandedMenus[idx] ? 'expanded' : ''}`}>
                  <div className="cms-nav-item" onClick={() => toggleMenu(idx)}>
                    <span className="cms-nav-icon">{item.icon}</span>
                    <span className="cms-nav-label">{item.label}</span>
                    <span className="cms-expand-icon">
                      <Plus size={16} className={`expand-icon ${expandedMenus[idx] ? 'rotated' : ''}`} />
                    </span>
                    {/* Debug indicator */}
                    {item.label === 'Reports' && (
                      <span style={{color: 'red', fontSize: '10px', marginLeft: '5px'}}>
                        {expandedMenus[idx] ? 'EXP' : 'COL'}
                      </span>
                    )}
                  </div>
                  <div className="cms-nav-children">
                    {/* Debug info */}
                    {item.label === 'Reports' && (
                      <div style={{color: 'yellow', fontSize: '10px', padding: '5px'}}>
                        Children count: {item.children.length}
                      </div>
                    )}
                    {item.children.map(child => (
                      <Link
                        to={child.path}
                        key={child.label}
                        className="cms-nav-child"
                      >
                        <span className="cms-nav-icon">{child.icon}</span>
                        <span className="cms-nav-label">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className="cms-nav-item"
                  key={item.label}
                >
                  <span className="cms-nav-icon">{item.icon}</span>
                  <span className="cms-nav-label">{item.label}</span>
                </Link>
              )
            ))}
          </div>

          {/* User Info */}
          <div className="cms-user-info">
            <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150" alt="User" className="cms-user-avatar" />
            <div className="cms-user-details">
              <h4>Admin User</h4>
              <p>App Administrator</p>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="cms-main-content">
          {/* Enhanced Header */}
          <header className="cms-header">
            <div className="cms-header-center">
              <h1>Contractor Management System</h1>
            </div>
            <div className="cms-header-right">
              <div className="cms-header-sspower-logo">
                <img src={sspowerLogo} alt="SSPower Logo" className="cms-header-sspower" />
                <div className="cms-header-sspower-text">
                  S&S Power Switchgear Equipment Limited
                </div>
              </div>
              <div className="cms-header-user">
                <div className="cms-notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={24} />
                </div>
                <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150" alt="User" className="cms-user-avatar" />
                <div className="cms-logout-icon">
                  <Button title="" className="cms-logout-btn" />
                </div>
              </div>
            </div>
          </header>

          {/* Notification Popup */}
          {showNotifications && (
            <div className="cms-notification-overlay" onClick={() => setShowNotifications(false)}>
              <div className="cms-notification-popup" onClick={(e) => e.stopPropagation()}>
                <div className="cms-notification-header">
                  <h3>Recent Activity</h3>
                  <button 
                    className="cms-close-btn"
                    onClick={() => setShowNotifications(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="cms-notification-content">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="cms-activity-item">
                      <div className="cms-activity-icon">{activity.icon}</div>
                      <div className="cms-activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <span className="cms-activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          <main className="cms-dashboard-content">
            <div className="employee-card-container">
              <div className="employee-section-title">Loss of Hours (LOH) Report</div>
              <div className="employee-section-subtitle">
                Automatically displays employees with less than 8 hours worked from payroll data with month-wise filtering
              </div>

              {/* Toolbar Buttons */}
              <div className="employee-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', marginBottom: '32px', justifyContent: 'flex-end' }}>
                <button
                  className="toolbar-btn export-btn"
                  onClick={() => exportToExcel(tableData, 'loh_report.xls')}
                  title="Export as Excel"
                  type="button"
                  style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fas fa-file-export" style={{ color: '#232323' }}></i>
                </button>
              </div>

              <div className="monthly-ot-filters">
                <div>
                  <label>Contractor:</label>
                  <Select
                    options={contractorOptions}
                    value={contractorOptions.find(opt => opt.value === contractor)}
                    onChange={opt => setContractor(opt.value)}
                    onMenuOpen={refreshContractors}
                    isSearchable
                    classNamePrefix="react-select"
                    styles={{ container: base => ({ ...base, width: '100%' }) }}
                  />
                </div>
                <div>
                  <label>Month:</label>
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                  />
                </div>
                <div>
                  <label>Department:</label>
                  <Select
                    options={departmentOptions}
                    value={departmentOptions.find(opt => opt.value === department)}
                    onChange={opt => setDepartment(opt.value)}
                    onMenuOpen={refreshDepartments}
                    isSearchable
                    classNamePrefix="react-select"
                    styles={{ container: base => ({ ...base, width: '100%' }) }}
                  />
                </div>
                <div className="employee-id-filter-with-export">
                  <label>Employee Code:</label>
                  <Select
                    options={employeeOptions}
                    value={employeeOptions.find(opt => opt.value === employeeId)}
                    onChange={opt => setEmployeeId(opt.value)}
                    isSearchable
                    placeholder="Search By Employee"
                    classNamePrefix="react-select"
                    styles={{ container: base => ({ ...base, width: '100%' }) }}
                  />
                </div>
              </div>
              
              <div className="monthly-ot-table-container">
                <table className="monthly-ot-table">
                  <thead>
                    <tr>
                      <th>Employee Code ↓</th>
                      <th>Employee Name ↓</th>
                      <th>Department ↓</th>
                      <th>Contractor ↓</th>
                      <th>Loss of Hours (hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>{error}</td></tr>
                    ) : tableData.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>No employees found with less than 8 hours for this month.</td></tr>
                    ) : (
                      tableData.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.employeeId}</td>
                          <td>{row.employeeName}</td>
                          <td>{row.department}</td>
                          <td>{row.contractorName}</td>
                          <td>{row.lossOfHours}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
