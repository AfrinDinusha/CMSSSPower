import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import Button from './Button';
import { Plus, Bell } from 'lucide-react';
import { allModules as sidebarModules } from './modulesConfig';
import './PayrollReport.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function PayrollReport() {
  const query = useQuery();
  const navigate = useNavigate();
  const [month, setMonth] = useState(query.get('month') || new Date().toISOString().slice(0,7));
  const [contractor, setContractor] = useState('All');
  const [department, setDepartment] = useState('All');
  const [employeeId, setEmployeeId] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (contractor !== 'All') params.set('contractor', contractor);
    if (department !== 'All') params.set('department', department);
    if (employeeId !== 'All') params.set('employeeId', employeeId);
    navigate({ pathname: '/payroll-report', search: params.toString() }, { replace: true });
  }, [month, contractor, department, employeeId, navigate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ month });
      if (contractor !== 'All') params.set('contractor', contractor);
      if (department !== 'All') params.set('department', department);
      if (employeeId !== 'All') params.set('employeeId', employeeId);
      const res = await fetch(`/server/payroll_function/report?${params.toString()}`);
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || `HTTP ${res.status}`);
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [month, contractor, department, employeeId]);

  const totals = useMemo(() => {
    const sum = (fn) => data.reduce((acc, r) => acc + (Number(fn(r)) || 0), 0);
    return {
      employees: data.length,
      otHours: sum(r => r.otHours),
      actualTotalSalary: sum(r => r.actualTotalSalary),
      earnedSalaryCross: sum(r => r.earnedSalaryCross),
      totalDeduction: sum(r => r.totalDeduction),
      netPay: sum(r => r.netPay),
      totalNetPayable: sum(r => r.totalNetPayable),
    };
  }, [data]);

  return (
    <>
      <div className="cms-background">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      <div className="cms-dashboard-root">
        <nav className="cms-sidebar">
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
          <div className="water-bubble"></div>
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
          <div className="cms-nav">
            {sidebarModules.map((item, idx) => (
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
                      <Link to={child.path} key={child.label} className="cms-nav-child">
                        <span className="cms-nav-icon">{child.icon}</span>
                        <span className="cms-nav-label">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link to={item.path} className="cms-nav-item" key={item.label}>
                  <span className="cms-nav-icon">{item.icon}</span>
                  <span className="cms-nav-label">{item.label}</span>
                </Link>
              )
            ))}
          </div>
          <div className="cms-user-info">
            <div className="cms-user-details">
              <h4>CMS User</h4>
              <p>App User</p>
            </div>
          </div>
        </nav>
        <div className="cms-main-content">
          <header className="cms-header">
            <div className="cms-header-center">
              <h1>Contractor Management System</h1>
            </div>
            <div className="cms-header-right">
              <div className="cms-header-sspower-logo">
                <img src={sspowerLogo} alt="SSPower Logo" className="cms-header-sspower" />
                <div className="cms-header-sspower-text">S&S Power Switchgear Equipment Limited</div>
              </div>
              <div className="cms-header-user">
                <div className="cms-notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell size={24} />
                </div>
                <div className="cms-logout-icon">
                  <Button title="" className="cms-logout-btn" />
                </div>
              </div>
            </div>
          </header>
          <main className="cms-dashboard-content">
            <div className="container payroll-report" style={{ padding: '16px' }}>
              <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Payroll Report</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                  <button onClick={fetchReport} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
                </div>
              </div>

              {error && (
                <div style={{ color: '#b00020', marginTop: 8 }}>{error}</div>
              )}

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  <div><strong>Total Employees:</strong> {totals.employees}</div>
                  <div><strong>Total OT Hours:</strong> {totals.otHours.toFixed(2)}</div>
                  <div><strong>Total Net Payable:</strong> ₹{totals.totalNetPayable.toLocaleString()}</div>
                </div>
              </div>

              <div className="table-wrapper" style={{ marginTop: 16, overflow: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Name</th>
                      <th>Dept</th>
                      <th>Contractor</th>
                      <th>Days</th>
                      <th>Present</th>
                      <th>OT Hrs</th>
                      <th>LOH</th>
                      <th>Actual Basic</th>
                      <th>Actual HRA</th>
                      <th>Actual DA</th>
                      <th>Other Allowance</th>
                      <th>Actual Total</th>
                      <th>Earned Basic</th>
                      <th>Earned HRA</th>
                      <th>Earned Cross</th>
                      <th>PF</th>
                      <th>ESI</th>
                      <th>Total Deduction</th>
                      <th>OT Amount</th>
                      <th>OT ESI</th>
                      <th>OT Payment</th>
                      <th>Payable Amount</th>
                      <th>OT Wages</th>
                      <th>Rent</th>
                      <th>Advance</th>
                      <th>Net Pay</th>
                      <th>Total Net Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(row => (
                      <tr key={`${row.employeeCode}`}>
                        <td>{row.employeeCode}</td>
                        <td title={row.employeeName}>{row.employeeName}</td>
                        <td title={row.department}>{row.department}</td>
                        <td title={row.contractor}>{row.contractor}</td>
                        <td style={{ textAlign: 'right' }}>{row.daysInMonth}</td>
                        <td style={{ textAlign: 'right' }}>{row.daysPresent}</td>
                        <td style={{ textAlign: 'right' }}>{Number(row.otHours || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{row.loh}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.actualBasic||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.actualHRA||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.actualDA||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.otherAllowance||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.actualTotalSalary||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.earnedBasic||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.earnedHRA||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.earnedSalaryCross||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.pf||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.esi||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.totalDeduction||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.otAmount||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.otEsi||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.otPayment||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.payableAmount||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.otWages||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.rent||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.advance||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.netPay||0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.totalNetPayable||0).toLocaleString()}</td>
                      </tr>
                    ))}
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

export default PayrollReport;


