import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Attendancemuster.css';
import './employeeManagement.css';
import './Candidateform.css';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import * as XLSX from 'xlsx';
import { 
  Calendar, Users, FileText, AlertTriangle, FolderOpen, 
  ClipboardList, Building, Handshake, Landmark, Clock, 
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon, AlertOctagon, CreditCard, Shield, Download, FileSignature, Search, Clock3
} from 'lucide-react';

function Attendancemuster({ userRole = 'App Administrator', userEmail = null }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractor, setContractor] = useState('All');
  const [department, setDepartment] = useState('All');
  const [contractors, setContractors] = useState(['All']);
  const [departments, setDepartments] = useState(['All']);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  // Define modules for App User
  const modulesForUser = [
    { icon: <Users size={22} />, label: 'Employees', path: '/employees' },
    // Multi-stack parent
    {
      icon: <Calendar size={22} />,
      label: 'Attendance Sync',
      children: [
        { icon: <Calendar size={20} />, label: 'Attendance', path: '/attendance' },
      ]
    },
    // Multi-stack parent
    {
      icon: <FileText size={22} />,
      label: 'Candidate On-Boarding',
      children: [
        { icon: <FileText size={20} />, label: 'Candidate', path: '/candidate' },
        { icon: <AlertTriangle size={20} />, label: 'EHS', path: '/EHS' },
      ]
    },
    // Multi-stack parent for EHS Management
    {
      icon: <Shield size={22} />,
      label: 'EHS Management',
      children: [
        { icon: <Shield size={20} />, label: 'EHS Violation', path: '/EHSViolation' },
        { icon: <AlertOctagon size={20} />, label: 'Critical Incidents', path: '/criticalincident' },
      ]
    },
    { icon: <CreditCard size={22} />, label: 'Payment', path: '/payment' },
    { icon: <BarChart3 size={22} />, label: 'Payroll', path: '/payroll' },
    { icon: <ClipboardList size={22} />, label: 'Statutory Registers', path: '/statutoryregisters' },
    { icon: <Search size={22} />, label: 'Detection', path: '/detection' },
  ];

  // Define all modules for App Administrator
  const allModules = [
    { icon: <HomeIcon size={22} />, label: 'Home', path: '/' },
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Landmark size={22} />, label: 'Organization', path: '/organization' },
    { icon: <Users size={22} />, label: 'Employees', path: '/employees' },
    {
      icon: <FileText size={22} />,
      label: 'Candidate Onboarding & Induction',
      children: [
        { icon: <FileText size={20} />, label: 'Candidate', path: '/candidate' },
        { icon: <AlertTriangle size={20} />, label: 'EHS', path: '/EHS' },
      ]
    },
    { icon: <Handshake size={22} />, label: 'Contractors', path: '/contracters' },
    { icon: <ClipboardList size={22} />, label: 'Designation', path: '/tasks' },
    { icon: <Building size={22} />, label: 'Department', path: '/time' },
    {
      icon: <Shield size={22} />,
      label: 'EHS Management',
      children: [
        { icon: <Shield size={20} />, label: 'EHS Violation', path: '/EHSViolation' },
        { icon: <AlertOctagon size={20} />, label: 'Critical Incidents', path: '/criticalincident' },
      ]
    },
    { icon: <ClipboardList size={22} />, label: 'Statutory Registers', path: '/statutoryregisters' },
    { icon: <Search size={22} />, label: 'Deduction', path: '/detection' },
    { icon: <BarChart3 size={22} />, label: 'Payroll', path: '/payroll' },
    { icon: <CreditCard size={22} />, label: 'Payment', path: '/payment' },
    { icon: <Calendar size={22} />, label: 'Attendance Sync', path: '/attendance' },
    { icon: <Clock size={22} />, label: 'Shift', path: '/shift' },
    { icon: <Clock3 size={22} />, label: 'LOH', path: '/loh-report' },
    {
      icon: <BarChart3 size={22} />,
      label: 'Reports',
      children: [
        { icon: <BarChart3 size={20} />, label: 'Monthly OT', path: '/reports' },
        { icon: <FolderOpen size={20} />, label: 'Attendance Muster', path: '/attendancemuster' },
        { icon: <AlertTriangle size={20} />, label: 'Deviation', path: '/deviationrecords' },
      ]
    },
  ];

  // Determine which modules to show based on user role
  const modulesToShow = userRole === 'App Administrator' ? allModules : modulesForUser;

  // Toggle expandable menus
  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setData(null);
    try {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates.');
        return;
      }
      console.log('Start Date:', startDate, 'End Date:', endDate);
      const response = await fetch(`/server/attendance_muster_function?startDate=${startDate}&endDate=${endDate}&source=both`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch muster data');
      setData(result);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch dropdown data on mount
  useEffect(() => {
    fetch('/server/reports_function/contractors')
      .then(res => res.json())
      .then(data => setContractors(['All', ...(data.data || [])]))
      .catch(() => setContractors(['All']));
    fetch('/server/reports_function/departments')
      .then(res => res.json())
      .then(data => setDepartments(['All', ...(data.data || [])]))
      .catch(() => setDepartments(['All']));
  }, []);

  const refreshContractors = () => {
    fetch('/server/reports_function/contractors')
      .then(res => res.json())
      .then(data => setContractors(['All', ...(data.data || [])]))
      .catch(() => setContractors(['All']));
  };

  const refreshDepartments = () => {
    fetch('/server/reports_function/departments')
      .then(res => res.json())
      .then(data => setDepartments(['All', ...(data.data || [])]))
      .catch(() => setDepartments(['All']));
  };

  const handleExport = () => {
    if (!data || !data.dates || !data.employees || !data.muster) return;
    // Build rows for export
    const header = ['Employee ID', ...data.dates.map(date => new Date(date).toLocaleDateString('en-GB')), 'Total Present', 'Total Absent'];
    const rows = data.employees.map((empId, rowIdx) => {
      const rowStatuses = data.muster[rowIdx];
      const totalPresent = rowStatuses.reduce((sum, s) => {
        if (s === 'Present' || s === 'P') return sum + 1;
        if (s === 'Half Day Present' || s === 'H') return sum + 0.5;
        return sum;
      }, 0);
      const totalAbsent = rowStatuses.filter(s => s === 'Absent' || s === 'A').length;
      return [
        empId,
        ...rowStatuses.map(s => (s === 'Present' || s === 'P') ? 'P' : (s === 'Half Day Present' || s === 'H') ? 'H' : 'A'),
        totalPresent,
        totalAbsent
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Muster');
    XLSX.writeFile(workbook, 'attendance_muster.xlsx');
  };

  // User info
  const userAvatar = "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150";
  const userName = userRole === 'App Administrator' ? 'Admin User' : 'App User';

  // Sample activity data with Lucide icons
  const recentActivities = [
    { icon: <User size={20} />, title: 'New Employee Added', description: 'John Doe joined the development team', time: '2 hours ago' },
    { icon: <BarChart3 size={20} />, title: 'Monthly Report Generated', description: 'Contractor performance report is ready', time: '4 hours ago' },
    { icon: <CheckCircle size={20} />, title: 'Contract Approved', description: 'ABC Construction contract approved', time: '6 hours ago' },
    { icon: <Bell size={20} />, title: 'System Update', description: 'Contractor Management System updated to version 2.1', time: '1 day ago' },
    { icon: <Plus size={20} />, title: 'New Application', description: 'Candidate applied for senior position', time: '2 days ago' }
  ];

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
                  </div>
                  <div className="cms-nav-children">
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
            <img src={userAvatar} alt="User" className="cms-user-avatar" />
            <div className="cms-user-details">
              <h4>{userName}</h4>
              <p>{userRole || 'User'}</p>
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
                <img src={userAvatar} alt="User" className="cms-user-avatar" />
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
            {/* Muster Form Card */}
            <div className="employee-card-container">
              <div className="employee-section-title">Muster Report Configuration</div>
              <div className="employee-section-subtitle">
                Generate attendance muster reports with advanced filtering and export capabilities
              </div>
              
              <form className="muster-filter-form" onSubmit={handleSubmit}>
                <div className="muster-filter-grid">
                  <div className="muster-filter-group">
                    <label>Start Date:
                      <input
                        type="date"
                        className="muster-input"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                      />
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>End Date:
                      <input
                        type="date"
                        className="muster-input"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                      />
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Contractor:
                      <select
                        className="muster-input"
                        value={contractor}
                        onChange={e => setContractor(e.target.value)}
                        onFocus={refreshContractors}
                      >
                        {contractors.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Employee ID:
                      <input type="text" className="muster-input" placeholder="Search By Employee" />
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Employee Name:
                      <input type="text" className="muster-input" placeholder="Search By Name" />
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Status:
                      <input type="text" className="muster-input" placeholder="Search By Status" />
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Department:
                      <select
                        className="muster-input"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        onFocus={refreshDepartments}
                      >
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="muster-filter-group">
                    <label>Location:
                      <input type="text" className="muster-input" placeholder="Search By Zone" />
                    </label>
                  </div>
                </div>
                <div className="muster-filter-actions">
                  <button type="submit" className="cms-btn primary">Apply Filter</button>
                  <button type="button" className="cms-btn" onClick={handleExport} disabled={!data}>
                    <Download size={16} /> Export to Excel
                  </button>
                </div>
              </form>
              
              {error && <div className="muster-error">{error}</div>}
              
              {data && data.summary && (
                <div className="muster-data-info">
                  <h4>Data Sources</h4>
                  <p>ESSL Server Records: {data.summary.bhrRecords || 0}</p>
                  <p>Imported Attendance Records: {data.summary.attendanceRecords || 0}</p>
                  <p>Total Employees: {data.summary.totalEmployees || 0}</p>
                  <p>Date Range: {data.summary.dateRange || 'N/A'}</p>
                </div>
              )}
            </div>

            {/* Muster Table Section */}
            {data && data.dates && data.employees && data.muster && (
              <div className="cms-chart-card muster-table-section">
                <div className="cms-chart-header">
                  <h3 className="cms-chart-title">Attendance Muster Report</h3>
                </div>
                
                <div className="muster-table-scroll">
                  <table className="muster-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        {data.dates.map(date => (
                          <th key={date}>{new Date(date).toLocaleDateString('en-GB')}</th>
                        ))}
                        <th>Total Present</th>
                        <th>Total Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employees.map((empId, rowIdx) => {
                        const rowStatuses = data.muster[rowIdx];
                        const totalPresent = rowStatuses.reduce((sum, s) => {
                          if (s === 'Present' || s === 'P') return sum + 1;
                          if (s === 'Half Day Present' || s === 'H') return sum + 0.5;
                          return sum;
                        }, 0);
                        const totalAbsent = rowStatuses.filter(s => s === 'Absent' || s === 'A').length;
                        return (
                          <tr key={empId}>
                            <td>{empId}</td>
                            {rowStatuses.map((status, colIdx) => {
                              let display = status;
                              let className = '';
                              if (status === 'Present') { display = 'P'; className = 'present'; }
                              else if (status === 'Absent') { display = ' '; className = 'absent'; }
                              else if (status === 'Half Day Present') { display = '0.5'; className = 'halfday'; }
                              return (
                                <td key={colIdx} className={className}>{display}</td>
                              );
                            })}
                            <td>{totalPresent}</td>
                            <td>{totalAbsent}</td>
                          </tr>
                        );
                      })}
                      {/* Total Row */}
                      <tr className="muster-total-row">
                        <td><strong>TOTAL</strong></td>
                        {data.dates.map((date, colIdx) => {
                          // Calculate total for each date column
                          const dateTotal = data.muster.reduce((sum, rowStatuses) => {
                            const status = rowStatuses[colIdx];
                            if (status === 'Present' || status === 'P') return sum + 1;
                            if (status === 'Half Day Present' || status === 'H') return sum + 0.5;
                            return sum;
                          }, 0);
                          return (
                            <td key={colIdx} className="total-cell">
                              <strong>{dateTotal}</strong>
                            </td>
                          );
                        })}
                        {/* Total Present and Absent columns */}
                        <td className="total-cell">
                          <strong>
                            {data.muster.reduce((sum, rowStatuses) => {
                              return sum + rowStatuses.reduce((rowSum, s) => {
                                if (s === 'Present' || s === 'P') return rowSum + 1;
                                if (s === 'Half Day Present' || s === 'H') return rowSum + 0.5;
                                return rowSum;
                              }, 0);
                            }, 0)}
                          </strong>
                        </td>
                        <td className="total-cell">
                          <strong>
                            {data.muster.reduce((sum, rowStatuses) => {
                              return sum + rowStatuses.filter(s => s === 'Absent' || s === 'A').length;
                            }, 0)}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Attendancemuster;