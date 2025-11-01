import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import EmployeeManagement from './EmployeeManagement';
import Layout from './Layout';
import { useEffect, useState, useCallback, useRef } from 'react';
import LoginPage from './LoginPage';
import Button from './Button';
import Candidateform from './Candidateform';
import Designation  from './Designation';
import Department from './Department';
import Attendance from './Attendance';
import Contracters from './Contracters';
import Organization from './Organization';
import Attendancemuster from './Attendancemuster';
import Shift from './Shift';
import EHS from './EHS';
import Shiftmap from './Shiftmap';
import DeviationRecords from './DeviationRecords';
import Reports from './reports';
import LOHReport from './LOHReport';
import Dashboard from './Dashboard';
import CriticalIncident from './criticalIncident';
import Payment from './Payment';
import EHSViolation from './EHSViolation';
import ContractForm from './ContractForm';
import StatutoryRegisters from './StatutoryRegisters';
import Payroll from './Payroll';
import PayrollReport from './PayrollReport';
import Detection from './Detection';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import cmsHeadingLogo from './assets/cms new logo fixed.png';
import { 
  Users, Calendar, FileText, AlertTriangle, FolderOpen, 
  ClipboardList, Building, Handshake, Landmark, Clock, 
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon, AlertOctagon, CreditCard, Shield, Trophy, Medal, Award, Star, FileSignature, Search, Clock3
} from 'lucide-react';

// Enhanced Home component with CMS styling
// Protected Route component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const authStatus = await window.catalyst.auth.isUserAuthenticated();
        console.log('Authentication status:', authStatus);
        setIsAuthenticated(authStatus);
      } catch (err) {
        console.error('Authentication error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = useCallback(() => {
    const redirectURL = "/__catalyst/auth/login";
    window.catalyst.auth.signOut(redirectURL);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#3f51b5'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
}

// Role-based Protected Route component
function RoleProtectedRoute({ children, allowedRoles, userRole }) {
  console.log('RoleProtectedRoute - userRole:', userRole, 'allowedRoles:', allowedRoles);
  
  if (!userRole) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#f44336'
      }}>
        Loading user role... (Current role: {userRole || 'undefined'})
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#f44336'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Your role: {userRole}</p>
        <button 
          onClick={() => window.history.back()} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#3f51b5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
}

function Home({ userRole, userEmail, setUserRole }) {
  // State for animations and interactions
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [animatedCounts, setAnimatedCounts] = useState({
    employees: 0,
    departments: 0,
    contracters: 0,
    candidates: 0
  });

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
    { icon: <ClipboardList size={22} />, label: 'Statutory Registers', path: '/statutoryregisters' },
  ];
  // Define all modules for App Administrator
  const allModules = [
    { icon: <HomeIcon size={22} />, label: 'Home', path: '/' },
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Landmark size={22} />, label: 'Organization', path: '/organization' },
    { icon: <Handshake size={22} />, label: 'Contractors', path: '/contracters' },
    { icon: <Users size={22} />, label: 'Employees', path: '/employees' },
    {
      icon: <FileText size={22} />,
      label: 'Candidate Onboarding & Induction',
      children: [
        { icon: <FileText size={20} />, label: 'Candidate', path: '/candidate' },
        { icon: <AlertTriangle size={20} />, label: 'EHS', path: '/EHS' },
      ]
    },
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

  const [counts, setCounts] = useState({
    employees: null,
    departments: null,
    contracters: null,
    candidates: null,
    attendance: '95%'
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Animate count numbers
  const animateCount = (target, key) => {
    if (typeof target !== 'number') return;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setAnimatedCounts(prev => ({
        ...prev,
        [key]: Math.floor(current)
      }));
    }, 30);
  };



  useEffect(() => {
    async function fetchCounts() {
      // Don't fetch counts if userRole is not set yet
      if (!userRole) {
        console.log('User role not set yet, skipping fetchCounts');
        return;
      }
      
      try {
        console.log('Fetching counts from APIs...');
        console.log('User role:', userRole);
        console.log('User email:', userEmail);
        
        const userRoleParam = encodeURIComponent(userRole || '');
        console.log('Encoded user role param:', userRoleParam);
        
        const [empRes, deptRes, contRes, candRes] = await Promise.all([
          fetch(`/server/cms_function/employees/count?userRole=${userRoleParam}&userEmail=${encodeURIComponent(userEmail || '')}&dashboard=true`)
            .then(r => {
              console.log('Employee count API response status:', r.status);
              if (!r.ok) throw new Error(`Employees count failed: ${r.status}`);
              return r.json();
            })
            .then(data => {
              console.log('Employee count API response data:', data);
              return data;
            })
            .catch(err => {
              console.error('Employees count error:', err);
              return { count: 0 };
            }),
          fetch('/server/Department_function/departments/count')
            .then(r => {
              if (!r.ok) throw new Error(`Departments count failed: ${r.status}`);
              return r.json();
            })
            .catch(err => {
              console.error('Departments count error:', err);
              return { count: 0 };
            }),
          fetch('/server/Contracters_function/contractors/count')
            .then(r => {
              if (!r.ok) throw new Error(`Contractors count failed: ${r.status}`);
              return r.json();
            })
            .catch(err => {
              console.error('Contractors count error:', err);
              return { count: 0 };
            }),
          fetch(`/server/candidate_function/candidate/count?userRole=${userRoleParam}&userEmail=${encodeURIComponent(userEmail || '')}`)
            .then(r => {
              console.log('Candidates count response status:', r.status);
              if (!r.ok) throw new Error(`Candidates count failed: ${r.status}`);
              return r.json();
            })
            .catch(err => {
              console.error('Candidates count error:', err);
              return { count: 0 };
            }),
        ]);
        
        console.log('API responses:', { empRes, deptRes, contRes, candRes });
        console.log('Candidate count response:', candRes);
        console.log('Candidate count value:', candRes.count);
        
        setCounts({
          employees: empRes.count ?? empRes.data?.count ?? '—',
          departments: deptRes.count ?? deptRes.data?.count ?? '—',
          contracters: contRes.count ?? contRes.data?.count ?? '—',
          candidates: candRes.count || candRes.data?.count || 0,
          attendance: '95%'
        });
        
        // Animate counts after fetching
        setTimeout(() => {
          animateCount(empRes.count ?? empRes.data?.count ?? 0, 'employees');
          animateCount(deptRes.count ?? deptRes.data?.count ?? 0, 'departments');
          animateCount(contRes.count ?? contRes.data?.count ?? 0, 'contracters');
          animateCount(candRes.count ?? candRes.data?.count ?? 0, 'candidates');
        }, 500);
      } catch (err) {
        console.error('Fetch counts error:', err);
        setCounts({
          employees: '—',
          departments: '—',
          contracters: '—',
          candidates: '—',
          attendance: '95%'
        });
      } finally {
        setLoadingCounts(false);
        setIsLoading(false);
      }
    }
    fetchCounts();
  }, [userRole, userEmail]);

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



  // State for contractor performance data
  const [contractorPerformanceData, setContractorPerformanceData] = useState([]);
  const [loadingContractorData, setLoadingContractorData] = useState(true);
  const [dataSource, setDataSource] = useState('');



  // Function to fetch contractor performance data
  const fetchContractorPerformanceData = useCallback(async () => {
    try {
      setLoadingContractorData(true);
      
      // Fetch contractor performance data from the new dedicated endpoint
      const performanceResponse = await fetch('/server/Contracters_function/contractor-performance');
      const performanceData = await performanceResponse.json();
      
      if (performanceData.status !== 'success') {
        throw new Error('Failed to fetch contractor performance data');
      }
      
      const performanceRecords = performanceData.data?.performanceData || [];
      
      // Transform the data to match our component structure
      const transformedData = performanceRecords.map(record => ({
        id: record.id,
        name: record.contractorName,
        rank: record.rank,
        employees: record.employees,
        cirCount: record.cirCount,
        ehsViolations: record.ehsViolations,
        overallScore: record.overallScore,
        status: record.status
      }));
      
      setContractorPerformanceData(transformedData);
      
      // Store the data source for display
      setDataSource(performanceData.data?.source || 'Unknown');
      
      // Log the data source for debugging
      console.log('Performance data source:', performanceData.data?.source);
      console.log('Total records:', performanceData.data?.total);
      console.log('Total employees:', performanceData.data?.totalEmployees);
      console.log('Total CIR count:', performanceData.data?.totalCIRCount);
      console.log('Total EHS violations:', performanceData.data?.totalEHSViolations);
      
    } catch (error) {
      console.error('Error fetching contractor performance data:', error);
      // Fallback to sample data if API fails
      setContractorPerformanceData([
        { id: 1, name: 'XYZ Construction', rank: 1, employees: 150, cirCount: 10, ehsViolations: 5, overallScore: 92, status: 'Excellent' },
        { id: 2, name: 'ABC Services', rank: 2, employees: 100, cirCount: 8, ehsViolations: 3, overallScore: 88, status: 'Good' },
        { id: 3, name: 'PQR Logistics', rank: 3, employees: 80, cirCount: 6, ehsViolations: 2, overallScore: 85, status: 'Good' },
        { id: 4, name: 'LMN Transport', rank: 4, employees: 70, cirCount: 5, ehsViolations: 1, overallScore: 82, status: 'Good' },
        { id: 5, name: 'RST Construction', rank: 5, employees: 60, cirCount: 4, ehsViolations: 0, overallScore: 80, status: 'Excellent' },
      ]);
    } finally {
      setLoadingContractorData(false);
    }
  }, []);

  // Fetch contractor performance data on component mount
  useEffect(() => {
    fetchContractorPerformanceData();
  }, [fetchContractorPerformanceData]);


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
          {/* Water Bubbles */}
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          
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
            {/* Water Bubbles */}
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            <div className="water-bubble"></div>
            
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
            {/* Stats Grid */}
            <div className="cms-stats-grid">
              <div className="cms-stat-card">
                <div className="cms-stat-header">
                  <div>
                    <div className="cms-stat-value">
                      {isLoading ? '...' : (animatedCounts.employees || counts.employees)}
                    </div>
                    <div className="cms-stat-label">Active Employees</div>
                    <div className="cms-stat-change positive">
                      <TrendingUp size={16} /> +12% from last month
                    </div>
                  </div>
                  <div className="cms-stat-icon">
                    <Users size={28} />
                  </div>
                </div>
              </div>

              <div className="cms-stat-card">
                <div className="cms-stat-header">
                  <div>
                    <div className="cms-stat-value">
                      {isLoading ? '...' : (animatedCounts.departments || counts.departments)}
                    </div>
                    <div className="cms-stat-label">Departments</div>
                    <div className="cms-stat-change positive">
                      <TrendingUp size={16} /> +3% from last month
                    </div>
                  </div>
                  <div className="cms-stat-icon">
                    <Building size={28} />
                  </div>
                </div>
              </div>

              <div className="cms-stat-card">
                <div className="cms-stat-header">
                  <div>
                    <div className="cms-stat-value">
                      {isLoading ? '...' : (animatedCounts.contracters || counts.contracters)}
                    </div>
                    <div className="cms-stat-label">Active Contractors</div>
                    <div className="cms-stat-change positive">
                      <TrendingUp size={16} /> +8% from last month
                    </div>
                  </div>
                  <div className="cms-stat-icon">
                    <Handshake size={28} />
                  </div>
                </div>
              </div>

              <div className="cms-stat-card">
                <div className="cms-stat-header">
                  <div>
                    <div className="cms-stat-value">
                      {isLoading ? '...' : (animatedCounts.candidates || counts.candidates)}
                    </div>
                    <div className="cms-stat-label">Candidates</div>
                    <div className="cms-stat-change positive">
                      <TrendingUp size={16} /> +15% from last month
                    </div>
                  </div>
                  <div className="cms-stat-icon">
                    <FileText size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid - About CMS, Today Stats, and Recent Activity */}
            <div className="cms-main-content-grid">
              {/* About CMS Section - Left Side */}
              <div className="cms-about-section">
                <div className="cms-about-card">
                  <div className="cms-chart-header">
                    <div className="cms-about-left">
                      <h3 className="cms-chart-title">About</h3>
                      <div className="cms-heading-logo">
                        <img src={cmsLogo} alt="CMS Logo" className="cms-heading-logo-img" />
                      </div>
                    </div>
                    <div className="cms-about-right">
                      <p className="cms-about-subtitle" style={{fontFamily: 'Radley'}}>Contractor Management System - Your Complete Workforce Solution</p>
                    </div>
                  </div>
                  <div className="cms-about-content">
                    <div className="cms-about-description">
                      <p>
                        Contractor Management System is a comprehensive platform designed to streamline 
                        and manage all aspects of contractor operations, employee management, and organizational processes. 
                        Built with modern technology and user-friendly interfaces, Contractor Management System provides powerful tools for 
                        administrators and users to efficiently manage their workforce.
                      </p>
                    </div>
                    
                    <div className="cms-modules-overview">
                      <h4>System Modules & Features</h4>
                      <div className="cms-modules-grid">
                        
                        
                        <Link to="/dashboard" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)'}}>
                            <LayoutDashboard size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Dashboard Analytics</h5>
                            <p>Comprehensive analytics, performance metrics, and data visualization for informed decision-making</p>
                          </div>
                        </Link>
                        
                        <Link to="/organization" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #4ECDC4, #6EDDD6)'}}>
                            <Landmark size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Organization Management</h5>
                            <p>Manage organizational structure, company details, and corporate information</p>
                          </div>
                        </Link>
                        
                        <Link to="/employees" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #45B7D1, #67C3DD)'}}>
                            <Users size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Employee Management</h5>
                            <p>Complete employee lifecycle management including profiles, roles, and performance tracking</p>
                          </div>
                        </Link>
                        
                        <Link to="/attendance" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #96CEB4, #A8D5C4)'}}>
                            <Calendar size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Attendance Sync</h5>
                            <p>Track employee attendance, generate reports, and monitor workforce presence</p>
                          </div>
                        </Link>
                        
                        <Link to="/candidate" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #FFEAA7, #FDCB6E)'}}>
                            <FileText size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Candidate On-Boarding</h5>
                            <p>Streamlined process for hiring new candidates with EHS compliance and documentation</p>
                          </div>
                        </Link>
                        
                        <Link to="/EHSViolation" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #DDA0DD, #E6B3E6)'}}>
                            <Shield size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>EHS Management</h5>
                            <p>Environment, Health & Safety management including violations and critical incident tracking</p>
                          </div>
                        </Link>
                        
                        <Link to="/tasks" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #FFB347, #FFC266)'}}>
                            <ClipboardList size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Designation Management</h5>
                            <p>Manage job titles, roles, and organizational hierarchy</p>
                          </div>
                        </Link>
                        
                        <Link to="/time" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #87CEEB, #9BDAEF)'}}>
                            <Building size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Department Management</h5>
                            <p>Organize company structure with departments and reporting relationships</p>
                          </div>
                        </Link>
                        
                        <Link to="/contracters" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #98FB98, #A8FBA8)'}}>
                            <Handshake size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Contractor Management</h5>
                            <p>Comprehensive contractor database with approval workflows and compliance tracking</p>
                          </div>
                        </Link>
                        
                        <Link to="/payment" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #F0A0A0, #F5B2B2)'}}>
                            <CreditCard size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Payment Processing</h5>
                            <p>Manage payments, invoices, and financial transactions for contractors and employees</p>
                          </div>
                        </Link>
                        
                        <Link to="/shift" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #FFD700, #FFA500)'}}>
                            <Clock size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Shift Management</h5>
                            <p>Create and manage work schedules, shift patterns, and time allocations</p>
                          </div>
                        </Link>
                        
                        <Link to="/statutoryregisters" className="cms-module-item cms-module-link">
                          <div className="cms-module-icon" style={{background: 'linear-gradient(135deg, #20B2AA, #40E0D0)'}}>
                            <ClipboardList size={20} />
                          </div>
                          <div className="cms-module-content">
                            <h5>Statutory Registers</h5>
                            <p>Statutory registers are legal records maintained for regulatory compliance</p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Section - Today Stats and Recent Activity */}
              <div className="cms-right-side-section">
                {/* Today Stats Section */}
                <div className="cms-today-stats-section">
                  <div className="cms-today-stats-card">
                    <div className="cms-chart-header">
                      <div className="cms-header-left">
                        <h3 className="cms-chart-title">Today Stats</h3>
                        <p className="cms-today-stats-subtitle">Contractor Performance Scoring</p>
                      </div>
                      <button 
                        className="cms-refresh-btn-icon-only"
                        onClick={fetchContractorPerformanceData}
                        disabled={loadingContractorData}
                        title="Refresh contractor performance data"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 4v6h-6"/>
                          <path d="M1 20v-6h6"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                      </button>
                    </div>
                    <div className="cms-contractor-score-cards">
                      {loadingContractorData ? (
                        <div className="cms-loading-state">
                          <div className="cms-loading-spinner"></div>
                          <div className="cms-loading-text">Loading Contractor Performance Data</div>
                          <div className="cms-loading-subtext">Fetching real-time metrics from backend APIs...</div>
                        </div>
                      ) : (
                        contractorPerformanceData.map((contractor, index) => (
                          <div 
                            key={contractor.id} 
                            className="cms-contractor-score-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="cms-score-card-header">
                              <div className="cms-contractor-rank">
                                <span className="rank-number">#{contractor.rank}</span>
                                <div className="rank-badge">
                                  {contractor.rank === 1 && <Trophy size={16} className="rank-icon gold" />}
                                  {contractor.rank === 2 && <Medal size={16} className="rank-icon silver" />}
                                  {contractor.rank === 3 && <Award size={16} className="rank-icon bronze" />}
                                  {contractor.rank > 3 && <Star size={16} className="rank-icon star" />}
                                </div>
                              </div>
                              <div className="cms-contractor-name">
                                <h4>{contractor.name}</h4>
                                <span className="contractor-status">
                                  <span className={`status-indicator ${contractor.status.toLowerCase()}`}></span>
                                  {contractor.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="cms-score-card-metrics">
                              <div className="metric-item">
                                <div className="metric-icon">
                                  <Users size={16} />
                                </div>
                                <div className="metric-content">
                                  <span className="metric-value">{contractor.employees}</span>
                                  <span className="metric-label">Employees</span>
                                </div>
                              </div>
                              
                              <div className="metric-item">
                                <div className="metric-icon">
                                  <AlertTriangle size={16} />
                                </div>
                                <div className="metric-content">
                                  <span className="metric-value">{contractor.cirCount}</span>
                                  <span className="metric-label">CIR Count</span>
                                </div>
                              </div>
                              
                              <div className="metric-item">
                                <div className="metric-icon">
                                  <Shield size={16} />
                                </div>
                                <div className="metric-content">
                                  <span className="metric-value">{contractor.ehsViolations}</span>
                                  <span className="metric-label">EHS Violations</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="cms-score-card-footer">
                              <div className="overall-score">
                                <div className="score-circle">
                                  <span className="score-value">{contractor.overallScore}</span>
                                  <span className="score-label">Score</span>
                                </div>
                              </div>
                              <div className="score-trend">
                                {contractor.overallScore >= 80 && <TrendingUp size={20} className="trend-up" />}
                                {contractor.overallScore >= 60 && contractor.overallScore < 80 && <TrendingDown size={20} className="trend-stable" />}
                                {contractor.overallScore < 60 && <AlertOctagon size={20} className="trend-down" />}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="cms-activity-section">
                  <div className="cms-activity-card">
                    <div className="cms-chart-header">
                      <h3 className="cms-chart-title">Recent Activity</h3>
                    </div>
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
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// Add this function to fetch the user's role from the backend
async function fetchUserRoleFromBackend() {
  try {
    // Get role from Catalyst authentication
    const authData = await window.catalyst.auth.isUserAuthenticated();
    console.log('Frontend auth data:', authData);
    
    if (authData && authData.content && authData.content.role_details) {
      const roleName = authData.content.role_details.role_name;
      console.log('Role from Catalyst auth:', roleName);
      
      // Map Catalyst roles to app roles
      switch(roleName) {
        case 'App Administrator':
          return 'App Administrator';
        case 'App User':
          return 'App User';
        default:
          // If role is not recognized, try backend endpoint
          break;
      }
    }
    
    // Fallback: Try backend endpoint
    console.log('Trying backend endpoint as fallback...');
    const response = await fetch('/server/authorized_portal_function', { 
      credentials: 'include',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('HTTP error:', response.status);
      return 'App User';
    }
    
    const data = await response.json();
    console.log('Backend response:', data);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Handle the case where the response is wrapped in an 'output' field
    let responseData = data;
    if (data.output) {
      try {
        responseData = JSON.parse(data.output);
      } catch (parseError) {
        console.error('Error parsing output:', parseError);
        return 'App User';
      }
    }
    
    if (responseData && responseData.status === 'success' && responseData.user_details) {
      console.log('User details from backend:', responseData.user_details);
      console.log('Detected role from backend:', responseData.user_details.role_identifier);
      
      // Store contractor info if available
      if (responseData.user_details.contractor_info) {
        localStorage.setItem('contractorInfo', JSON.stringify(responseData.user_details.contractor_info));
        console.log('Contractor info stored:', responseData.user_details.contractor_info);
      }
      
      return responseData.user_details.role_identifier;
    } else if (responseData && responseData.status === 'failure') {
      console.error('Backend authentication failed:', responseData.message);
      return 'App User'; // fallback
    }
  } catch (err) {
    console.error('Error fetching user role:', err);
    return 'App User'; // fallback
  }
  return 'App User';
}

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  
  console.log('App component - userRole:', userRole, 'userEmail:', userEmail);

  // Fetch user role and email after authentication
  useEffect(() => {
    async function fetchUserRole() {
      try {
        // Clear ALL cached data first
        localStorage.clear();
        sessionStorage.clear();
        
        const auth = await window.catalyst.auth.isUserAuthenticated();
        console.log('User authenticated:', auth);
        
        if (auth) {
          // Force fresh role fetch from backend
          const role = await fetchUserRoleFromBackend();
          console.log('Setting user role to:', role);
          setUserRole(role);
          localStorage.setItem('userRole', role);
          
          // Get user email from authentication
          if (auth.content && auth.content.email_id) {
            const email = auth.content.email_id;
            console.log('Setting user email to:', email);
            setUserEmail(email);
            localStorage.setItem('userEmail', email);
          }
        } else {
          console.log('User not authenticated');
          setUserRole('App User'); // Default role for unauthenticated users
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUserRole('App User'); // Default role on error
      }
    }
    fetchUserRole();
  }, []);

  // Pass userRole to Home and Dashboard
  return (
    <Router>
      <Routes>
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home userRole={userRole} userEmail={userEmail} setUserRole={setUserRole} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard userRole={userRole} userEmail={userEmail} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <EmployeeManagement userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
            
          }
        />
        <Route
          path="/candidate"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Candidateform userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Designation />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />
        <Route
          path="/time"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Department userRole={userRole} userEmail={userEmail} setUserRole={setUserRole} />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Attendance userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracters"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Contracters userRole={userRole} setUserRole={setUserRole} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contract-form"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <ContractForm userRole={userRole} setUserRole={setUserRole} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Organization />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendancemuster"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Attendancemuster userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shift"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Shift />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/EHS"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <EHS userRole={userRole} />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />
        <Route
          path="/EHSViolation"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <EHSViolation userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/Shiftmap"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Shiftmap />
              </RoleProtectedRoute>
            </ProtectedRoute>
            }
        />
        <Route
          path="/deviationrecords"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <DeviationRecords userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <Reports />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/loh-report"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App Administrator']} userRole={userRole}>
                <LOHReport />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statutoryregisters"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <StatutoryRegisters userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/criticalincident"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <CriticalIncident userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Payment />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Payroll />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll-report"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <PayrollReport />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/detection"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['App User', 'App Administrator']} userRole={userRole}>
                <Detection userRole={userRole} userEmail={userEmail} />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;