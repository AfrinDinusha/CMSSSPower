import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Payroll.css';
import './App.css';
import './helper.css';
import { Link } from 'react-router-dom';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import cmsHeadingLogo from './assets/cmsheadinglogo.png';
import Button from './Button';
import * as XLSX from 'xlsx';
import {
  Users, Calendar, FileText, AlertTriangle, FolderOpen,
  ClipboardList, Building, Handshake, Landmark, Clock,
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon,
  Shield, AlertOctagon, CreditCard, FileSignature, Search, Clock3
} from 'lucide-react';

const Payroll = () => {
  console.log('Payroll component is rendering');
  const navigate = useNavigate();
  
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [contractor, setContractor] = useState('All');
  const [department, setDepartment] = useState('All');
  const [employeeId, setEmployeeId] = useState('All');
  const [contractors, setContractors] = useState(['All']);
  const [departments, setDepartments] = useState(['All']);
  const [employees, setEmployees] = useState(['All']);
  const [error, setError] = useState(null);
  const [renderError, setRenderError] = useState(null);
  
  // Run Payroll state
  const [payrollRun, setPayrollRun] = useState(false);
  const [runningPayroll, setRunningPayroll] = useState(false);

  // Edit functionality state
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [savingPayroll, setSavingPayroll] = useState(false);


  // Sidebar state
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  // User info
  const userAvatar = "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150";
  const userName = 'Admin User';
  const userRole = 'App Administrator';

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
    {
      icon: <BarChart3 size={22} />,
      label: 'Payroll',
      children: [
        { icon: <BarChart3 size={20} />, label: 'Payroll', path: '/payroll' },
        { icon: <BarChart3 size={20} />, label: 'Payroll Report', path: '/payroll-report' },
      ]
    },
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

  // Toggle expandable menus
  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to fetch payroll data
  const fetchPayrollData = useCallback(async () => {
    try {
      console.log('=== FETCH PAYROLL DATA DEBUG START ===');
      setLoading(true);
      setError(null);
      
      let url = `/server/payroll_function/payroll?month=${selectedMonth}&_t=${Date.now()}`;
      if (contractor !== 'All') url += `&contractor=${encodeURIComponent(contractor)}`;
      if (department !== 'All') url += `&department=${encodeURIComponent(department)}`;
      if (employeeId !== 'All') url += `&employeeId=${encodeURIComponent(employeeId)}`;
      
      console.log('Fetching payroll data from:', url);
      console.log('Current filters:', { selectedMonth, contractor, department, employeeId });
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch payroll data: ${res.status} ${errorText}`);
      }
      
      const result = await res.json();
      console.log('Payroll data received:', result);
      console.log('Data array length:', result.data ? result.data.length : 0);
      
      if (result.data && result.data.length > 0) {
        console.log('First record in data:', result.data[0]);
        console.log('Sample employee codes in data:', result.data.slice(0, 3).map(emp => emp.employeeCode));
        console.log('All employee codes in received data:', result.data.map(emp => emp.employeeCode));
        console.log('Current filters applied:', { selectedMonth, contractor, department, employeeId });
      } else {
        console.log('No payroll data received - checking filters and backend response');
        console.log('Current filters:', { selectedMonth, contractor, department, employeeId });
        console.log('Request URL:', url);
      }
      
      // Force a new array reference to ensure React re-renders
      const newPayrollData = result.data ? [...result.data] : [];
      setPayrollData(newPayrollData);
      console.log('Payroll data state updated with', newPayrollData.length, 'records');
      console.log('New payroll data reference created:', newPayrollData !== (result.data || []));
      
      // Debug: Log sample data to verify it's correct
      if (newPayrollData.length > 0) {
        console.log('Sample payroll data after fetch:', {
          firstRecord: newPayrollData[0],
          totalRecords: newPayrollData.length,
          employeeCodes: newPayrollData.map(emp => emp.employeeCode).slice(0, 5)
        });
      }
      
      console.log('=== FETCH PAYROLL DATA DEBUG END - SUCCESS ===');
    } catch (err) {
      console.error('=== FETCH PAYROLL DATA DEBUG END - ERROR ===');
      console.error('Error fetching payroll data:', err);
      setError(err.message);
      setPayrollData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, contractor, department, employeeId]);

  // Fetch payroll data when month or filters change (only if payroll has been run)
  useEffect(() => {
    if (payrollRun) {
      console.log('useEffect triggered for payroll data');
      fetchPayrollData();
    }
  }, [fetchPayrollData, payrollRun]);

  // Fetch contractors
  useEffect(() => {
    console.log('Fetching contractors');
    fetch('/server/payroll_function/contractors')
      .then(res => {
        console.log('Contractors response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Contractors data:', data);
        setContractors(['All', ...(data.data || [])]);
      })
      .catch(err => {
        console.error('Error fetching contractors:', err);
        setContractors(['All']);
      });
  }, []);

  // Fetch departments
  useEffect(() => {
    console.log('Fetching departments');
    fetch('/server/payroll_function/departments')
      .then(res => {
        console.log('Departments response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Departments data:', data);
        setDepartments(['All', ...(data.data || [])]);
      })
      .catch(err => {
        console.error('Error fetching departments:', err);
        setDepartments(['All']);
      });
  }, []);

  // Fetch employee codes, filtered by contractor
  useEffect(() => {
    console.log('Fetching employee codes for contractor:', contractor);
    let url = '/server/payroll_function/employee-codes';
    if (contractor && contractor !== 'All') {
      url += `?contractor=${encodeURIComponent(contractor)}`;
    }
    fetch(url)
      .then(res => {
        console.log('Employee codes response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Employee codes data:', data);
        setEmployees(['All', ...(data.data || [])]);
      })
      .catch(err => {
        console.error('Error fetching employee codes:', err);
        setEmployees(['All']);
      });
    setEmployeeId('All'); // Reset employeeId when contractor changes
  }, [contractor]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Handle Run Payroll button click
  const handleRunPayroll = async () => {
    setRunningPayroll(true);
    setError(null);
    setImportSuccess('');
    
    try {
      // Show initial message
      setImportSuccess('Fetching OT data and running payroll...');
      
      // Simulate payroll processing time (includes fetching OT data)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch payroll data (OT Hours are auto-fetched, Days Present uses imported values only)
      await fetchPayrollData();
      setPayrollRun(true);
      
      // Show success message
      setImportSuccess('Payroll completed successfully! OT Hours are automatically fetched, but Days Present uses only imported values.');
      setTimeout(() => setImportSuccess(''), 5000);
    } catch (err) {
      console.error('Error running payroll:', err);
      setError('Failed to run payroll. Please try again.');
      setImportSuccess('');
    } finally {
      setRunningPayroll(false);
    }
  };


  // Handle row click to edit employee data
  const handleRowClick = (employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      employeeCode: employee.employeeCode || '',
      employeeName: employee.employeeName || '',
      department: employee.department || '',
      contractor: employee.contractor || '',
      daysInMonth: employee.daysInMonth || 0,
      daysPresent: employee.daysPresent || 0,
      otHours: employee.otHours || 0,
      loh: employee.loh || 0,
      actualBasic: employee.actualBasic || 0,
      actualHRA: employee.actualHRA || 0,
      actualDA: employee.actualDA || 0,
      otherAllowance: employee.otherAllowance || 0,
      actualTotalSalary: employee.actualTotalSalary || 0,
      earnedBasic: employee.earnedBasic || 0,
      earnedHRA: employee.earnedHRA || 0,
      earnedSalaryCross: employee.earnedSalaryCross || 0,
      pf: employee.pf || 0,
      esi: employee.esi || 0,
      totalDeduction: employee.totalDeduction || 0,
      otAmount: employee.otAmount || 0,
      otEsi: employee.otEsi || 0,
      otPayment: employee.otPayment || 0,
      payableAmount: employee.payableAmount || 0,
      otWages: employee.otWages || 0,
      rent: employee.rent || 0,
      advance: employee.advance || 0,
      netPay: employee.netPay || 0,
      totalNetPayable: employee.totalNetPayable || 0,
    });
    setShowEditModal(true);
  };

  // Calculate derived fields based on formulas
  const calculateDerivedFields = (formData) => {
    const actualBasic = parseFloat(formData.actualBasic) || 0;
    const actualHRA = parseFloat(formData.actualHRA) || 0;
    const actualDA = parseFloat(formData.actualDA) || 0;
    const otherAllowance = parseFloat(formData.otherAllowance) || 0;
    const daysInMonth = parseFloat(formData.daysInMonth) || 31;
    const daysPresent = parseFloat(formData.daysPresent) || 0;
    const otHours = parseFloat(formData.otHours) || 0;
    const loh = parseFloat(formData.loh) || 0;
    const otAmount = parseFloat(formData.otAmount) || 0;
    // OT Wages = (Actual Basic / no.of present in month) / 8 * OT Hours
    const otWages = daysPresent > 0 ? ((actualBasic / daysPresent) / 8) * otHours : 0;

    // Calculate earned amounts
    // Earned Basic = (Actual Basic / daysInMonth * daysPresent) - ((Actual Basic / daysInMonth) / 8 * LOH)
    const dailyBasic = actualBasic / daysInMonth;
    const earnedBasic = (dailyBasic * daysPresent) - ((dailyBasic / 8) * loh);
    const earnedHRA = ((actualHRA / daysInMonth) * daysPresent) - (((actualHRA / daysInMonth) / 8) * loh);

    const actualTotalSalary = actualBasic + actualHRA + actualDA + otherAllowance; // Actual Total Salary = Actual Basic + Actual HRA + Actual DA + Other Allowance
    const earnedSalaryCross = earnedBasic + earnedHRA; // Earned Salary Cross = Earned Basic + Earned HRA
    const pf = earnedBasic * 0.12; // PF = Earned Basic * 12%
    const esi = earnedSalaryCross * 0.0075; // ESI = Earned Salary Cross * 0.75%
    const totalDeduction = pf + esi; // Total Deduction = PF + ESI
    const netpay = earnedSalaryCross - totalDeduction; // Netpay = Earned Salary Cross - Total Deduction
   const otPayment = daysInMonth > 0 ? ((actualTotalSalary / daysInMonth) / 8) * otHours * 2 : 0; // OT Payment = (Actual Total Salary / no.of months) / 8 * OT Hours * 2
    const otEsi = otPayment * 0.0075; // OT ESI = OT Payment * 0.75%
    const payableAmount = otPayment - otEsi; // Payable Amount = OT Payment - OT ESI
    const rent = parseFloat(formData.rent) || 0;
    const advance = parseFloat(formData.advance) || 0;
    const finalNetPay = netpay - rent - advance; // Final Net Pay after rent and advance deductions
    const totalNetPayable = finalNetPay + payableAmount; // Total Net Payable = Net Pay + Payable Amount

    return {
      actualTotalSalary: parseFloat(actualTotalSalary.toFixed(2)),
      earnedBasic: parseFloat(earnedBasic.toFixed(2)),
      earnedHRA: parseFloat(earnedHRA.toFixed(2)),
      earnedSalaryCross: parseFloat(earnedSalaryCross.toFixed(2)),
      pf: parseFloat(pf.toFixed(2)),
      esi: parseFloat(esi.toFixed(2)),
      totalDeduction: parseFloat(totalDeduction.toFixed(2)),
      netpay: parseFloat(netpay.toFixed(2)),
      otEsi: parseFloat(otEsi.toFixed(2)),
      otPayment: parseFloat(otPayment.toFixed(2)),
      payableAmount: parseFloat(payableAmount.toFixed(2)),
      totalNetPayable: parseFloat(totalNetPayable.toFixed(2)),
    };
  };

  // Handle form input changes with automatic calculations
  const handleEditFormChange = (field, value) => {
    console.log(`Form field changed: ${field} = ${value}`);
    setEditFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      console.log(`Updated form data for ${field}:`, newFormData[field]);
      
      if (['actualBasic', 'actualHRA', 'actualDA', 'otherAllowance', 'daysInMonth', 'daysPresent', 'otAmount', 'otWages', 'otHours', 'loh', 'rent', 'advance'].includes(field)) {
        const derivedFields = calculateDerivedFields(newFormData);
        console.log(`Calculated derived fields for ${field}:`, derivedFields);
        return { ...newFormData, ...derivedFields };
      }
      return newFormData;
    });
  };

  // Save edited data
  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log('=== PAYROLL SAVE DEBUG START ===');
      console.log('Selected month:', selectedMonth);
      console.log('Editing employee:', editingEmployee);
      console.log('Edit form data:', editFormData);
      console.log('Days Present value being saved:', editFormData.daysPresent);
      console.log('OT Hours value being saved:', editFormData.otHours);
      
      const requestPayload = {
        month: selectedMonth,
        employeeCode: editingEmployee.employeeCode,
        updatedData: editFormData
      };
      
      console.log('Request payload:', requestPayload);
      console.log('Request URL:', '/server/payroll_function/update');
      
      // Send the updated data to the backend
      const response = await fetch('/server/payroll_function/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseErr) {
          console.error('Failed to parse error response as JSON:', parseErr);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update payroll record`);
      }

      const result = await response.json();
      console.log('Update successful response:', result);

      // Refresh the payroll data from backend to ensure we have the latest data
      console.log('Refreshing payroll data after update...');
      console.log('Current filters:', { selectedMonth, contractor, department, employeeId });
      
      // Add a small delay to ensure database has time to process the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchPayrollData();
      console.log('Payroll data refreshed successfully');

      // Force a re-render by updating the data with a timestamp
      setPayrollData(prev => {
        console.log('Forcing payroll data re-render after edit');
        // Find the updated employee record
        const updatedEmployee = prev.find(emp => emp.employeeCode === editingEmployee.employeeCode);
        if (updatedEmployee) {
          console.log('Updated employee record found:', {
            employeeCode: updatedEmployee.employeeCode,
            daysPresent: updatedEmployee.daysPresent,
            otHours: updatedEmployee.otHours,
            actualBasic: updatedEmployee.actualBasic
          });
        } else {
          console.log('Updated employee record NOT found in refreshed data');
        }
        return [...prev];
      });

      setShowEditModal(false);
      setEditingEmployee(null);
      setEditFormData({});
      
      // Show success message
      setImportSuccess('Payroll record updated successfully!');
      setTimeout(() => setImportSuccess(''), 3000);
      
      console.log('=== PAYROLL SAVE DEBUG END - SUCCESS ===');
    } catch (err) {
      console.error('=== PAYROLL SAVE DEBUG END - ERROR ===');
      console.error('Error saving edit:', err);
      console.error('Error stack:', err.stack);
      setError('Failed to save changes: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingEmployee(null);
    setEditFormData({});
  };

  const exportToExcel = () => {
    try {
      console.log('Exporting payroll data to Excel...');
      
      if (!payrollData || payrollData.length === 0) {
        alert('No payroll data available to export. Please run payroll first.');
        return;
      }

      // Prepare data for export
      const exportData = payrollData.map((employee, index) => ({
        'S.No': index + 1,
        'Employee Code': employee.employeeCode || '',
        'Employee Name': employee.employeeName || '',
        'Department': employee.department || '',
        'Contractor': employee.contractor || '',
        'No. of Days (Month)': employee.daysInMonth || 0,
        'No. of Days Present': employee.daysPresent || 0,
        'OT Hours': employee.otHours || 0,
        'LOH': employee.loh || 0,
        'Actual Basic': employee.actualBasic || 0,
        'Actual HRA': employee.actualHRA || 0,
        'Actual DA': employee.actualDA || 0,
        'Other Allowance': employee.otherAllowance || 0,
        'Actual Total Salary': employee.actualTotalSalary || 0,
        'Earned Basic': employee.earnedBasic || 0,
        'Earned HRA': employee.earnedHRA || 0,
        'Earned Salary Cross': employee.earnedSalaryCross || 0,
        'PF': employee.pf || 0,
        'ESI': employee.esi || 0,
        'Total Deduction': employee.totalDeduction || 0,
        'OT Amount': employee.otAmount || 0,
        'OT ESI': employee.otEsi || 0,
        'OT Payment': employee.otPayment || 0,
        'Payable Amount': employee.payableAmount || 0,
        'OT Wages': employee.otWages || 0,
        'Rent Recovery': employee.rent || 0,
        'Salary Advance': employee.advance || 0,
        'Net Pay': employee.netPay || 0,
        'Total Net Payable': employee.totalNetPayable || 0
      }));

      // Add totals row
      const totalsRow = {
        'S.No': 'Total',
        'Employee Code': '',
        'Employee Name': '',
        'Department': '',
        'Contractor': '',
        'No. of Days (Month)': '',
        'No. of Days Present': '',
        'OT Hours': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otHours) || 0), 0),
        'LOH': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.loh) || 0), 0),
        'Actual Basic': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualBasic) || 0), 0),
        'Actual HRA': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualHRA) || 0), 0),
        'Actual DA': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualDA) || 0), 0),
        'Other Allowance': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otherAllowance) || 0), 0),
        'Actual Total Salary': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualTotalSalary) || 0), 0),
        'Earned Basic': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedBasic) || 0), 0),
        'Earned HRA': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedHRA) || 0), 0),
        'Earned Salary Cross': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedSalaryCross) || 0), 0),
        'PF': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.pf) || 0), 0),
        'ESI': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.esi) || 0), 0),
        'Total Deduction': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalDeduction) || 0), 0),
        'OT Amount': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otAmount) || 0), 0),
        'OT ESI': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otEsi) || 0), 0),
        'OT Payment': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otPayment) || 0), 0),
        'Payable Amount': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.payableAmount) || 0), 0),
        'OT Wages': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otWages) || 0), 0),
        'Rent Recovery': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.rent) || 0), 0),
        'Salary Advance': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.advance) || 0), 0),
        'Net Pay': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.netPay) || 0), 0),
        'Total Net Payable': payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalNetPayable) || 0), 0)
      };

      // Add totals row to export data
      exportData.push(totalsRow);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 8 },   // S.No
        { wch: 15 },  // Employee Code
        { wch: 20 },  // Employee Name
        { wch: 15 },  // Department
        { wch: 20 },  // Contractor
        { wch: 15 },  // No. of Days (Month)
        { wch: 15 },  // No. of Days Present
        { wch: 12 },  // OT Hours
        { wch: 10 },  // LOH
        { wch: 15 },  // Actual Basic
        { wch: 15 },  // Actual HRA
        { wch: 15 },  // Actual DA
        { wch: 15 },  // Other Allowance
        { wch: 18 },  // Actual Total Salary
        { wch: 15 },  // Earned Basic
        { wch: 15 },  // Earned HRA
        { wch: 18 },  // Earned Salary Cross
        { wch: 12 },  // PF
        { wch: 12 },  // ESI
        { wch: 15 },  // Total Deduction
        { wch: 15 },  // OT Amount
        { wch: 12 },  // OT ESI
        { wch: 15 },  // OT Payment
        { wch: 18 },  // Payable Amount
        { wch: 15 },  // OT Wages
        { wch: 15 },  // Rent Recovery
        { wch: 15 },  // Salary Advance
        { wch: 15 },  // Net Pay
        { wch: 18 }   // Total Net Payable
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Report');

      // Generate filename with current date and month
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split('T')[0];
      const filename = `Payroll_Report_${selectedMonth}_${dateStr}.xlsx`;

      // Export the file
      XLSX.writeFile(workbook, filename);
      
      console.log(`Excel file exported successfully: ${filename}`);
      setImportSuccess(`Excel file exported successfully: ${filename}`);
      setTimeout(() => setImportSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel file: ' + error.message);
    }
  };

  const exportToPDF = () => {
    try {
      console.log('Exporting payroll data to PDF...');
      
      if (!payrollData || payrollData.length === 0) {
        alert('No payroll data available to export. Please run payroll first.');
        return;
      }

      // Create a simple HTML table for PDF conversion
      let htmlContent = `
        <html>
          <head>
            <title>Payroll Report - ${selectedMonth}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; color: #333; margin-bottom: 30px; }
              h2 { color: #666; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .total-row { background-color: #e6f3ff; font-weight: bold; }
              .summary { margin-top: 30px; }
              .summary-item { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Payroll Report - ${selectedMonth}</h1>
            <h2>Employee Details</h2>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Contractor</th>
                  <th>Days Present</th>
                  <th>OT Hours</th>
                  <th>Actual Basic</th>
                  <th>Actual HRA</th>
                  <th>Actual Total Salary</th>
                  <th>Earned Basic</th>
                  <th>Earned HRA</th>
                  <th>PF</th>
                  <th>ESI</th>
                  <th>Total Deduction</th>
                  <th>Net Pay</th>
                </tr>
              </thead>
              <tbody>
      `;

      // Add employee rows
      payrollData.forEach((employee, index) => {
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${employee.employeeCode || ''}</td>
            <td>${employee.employeeName || ''}</td>
            <td>${employee.department || ''}</td>
            <td>${employee.contractor || ''}</td>
            <td>${employee.daysPresent || 0}</td>
            <td>${employee.otHours || 0}</td>
            <td>₹${(parseFloat(employee.actualBasic) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.actualHRA) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.actualTotalSalary) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.earnedBasic) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.earnedHRA) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.pf) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.esi) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.totalDeduction) || 0).toLocaleString()}</td>
            <td>₹${(parseFloat(employee.netPay) || 0).toLocaleString()}</td>
          </tr>
        `;
      });

      // Add totals row
      htmlContent += `
        <tr class="total-row">
          <td>Total</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.daysPresent) || 0), 0)}</td>
          <td>${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otHours) || 0), 0).toFixed(1)}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualBasic) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualHRA) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualTotalSalary) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedBasic) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedHRA) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.pf) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.esi) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalDeduction) || 0), 0).toLocaleString()}</td>
          <td>₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.netPay) || 0), 0).toLocaleString()}</td>
        </tr>
      `;

      htmlContent += `
              </tbody>
            </table>
            
            <div class="summary">
              <h2>Summary</h2>
              <div class="summary-item"><strong>Total Employees:</strong> ${payrollData.length}</div>
              <div class="summary-item"><strong>Total OT Hours:</strong> ${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otHours) || 0), 0).toFixed(1)} hrs</div>
              <div class="summary-item"><strong>Total Actual Salary:</strong> ₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualTotalSalary) || 0), 0).toLocaleString()}</div>
              <div class="summary-item"><strong>Total Earned Salary:</strong> ₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedSalaryCross) || 0), 0).toLocaleString()}</div>
              <div class="summary-item"><strong>Total Deductions:</strong> ₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalDeduction) || 0), 0).toLocaleString()}</div>
              <div class="summary-item"><strong>Total Net Pay:</strong> ₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.netPay) || 0), 0).toLocaleString()}</div>
              <div class="summary-item"><strong>Total Net Payable:</strong> ₹${payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalNetPayable) || 0), 0).toLocaleString()}</div>
            </div>
            
            <div style="margin-top: 50px; text-align: center; color: #666;">
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      console.log('PDF export initiated');
      setImportSuccess('PDF export initiated - use browser print dialog to save as PDF');
      setTimeout(() => setImportSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF: ' + error.message);
    }
  };

  const handleSavePayroll = async () => {
    if (!payrollRun) {
      setError('Please run payroll before saving.');
      return;
    }
    if (!Array.isArray(payrollData) || payrollData.length === 0) {
      setError('No payroll data to save.');
      return;
    }

    setSavingPayroll(true);
    setError(null);
    setImportError('');
    setImportSuccess('');

    try {
      // Always fetch the full month's payroll data for ALL employees, ignoring current filters
      let fullMonthUrl = `/server/payroll_function/payroll?month=${selectedMonth}&_t=${Date.now()}`;
      const fullRes = await fetch(fullMonthUrl);
      if (!fullRes.ok) {
        const errText = await fullRes.text();
        throw new Error(`Failed to fetch full month data: ${fullRes.status} ${errText}`);
      }
      const fullResult = await fullRes.json();
      const allEmployeesPayroll = Array.isArray(fullResult.data) ? fullResult.data : [];
      if (allEmployeesPayroll.length === 0) {
        throw new Error('No payroll data found for the month to save.');
      }

      const response = await fetch('/server/payroll_function/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          payrollData: allEmployeesPayroll,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || result.error || `HTTP ${response.status}`);
      }

      setImportSuccess(`Payroll saved for ${selectedMonth}. (${result.successCount || allEmployeesPayroll.length} records)`);

      // small delay to ensure backend writes are committed
      await new Promise(r => setTimeout(r, 800));
      await fetchPayrollData();
      // Navigate to Payroll Report for the saved month
      navigate(`/payroll-report?month=${encodeURIComponent(selectedMonth)}`);
    } catch (e) {
      setError(`Failed to save payroll: ${e.message}`);
    } finally {
      setSavingPayroll(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template content with exact column names
    // Note: The import function supports flexible header matching, so variations like "EmployeeName", "Name", etc. will also work
    // Note: When importing exported Excel files, totals/summary rows are automatically skipped
    const templateContent = `Employee Code,Employee Name,Department,Contractor,No. of Days (Month),No. of Days Present,OT Hours,LOH,Actual Basic,Actual HRA,Actual Total Salary,Earned Basic,Earned HRA,Earned Salary Cross,PF,ESI,Total Deduction,OT Amount,OT ESI,OT Payment,Payable Amount,OT Wages,Rent,Advance,Net Pay
EMP001,MUKESH,SALES,No,31,22.5,0.00,0,10000,5000,15000,7258.06,3629.03,10887.09,870.97,54.44,925.41,0,0,0,10887.09,0,0,0,10887.09
36050,K.Sivasubramanian,Accounts,R.P.D Facility Management,31,25,8.5,0,25000,5000,30000,25000,5000,30000,3000,187.5,3187.5,0,0,0,30000,4250,2000,1000,31250
36109,Sunil Kumar,Hamper assembly,R.P.D Facility Management,31,28,12.0,0,22000,4400,26400,22000,4400,26400,2640,165,2805,0,0,0,26400,6000,1500,500,28900`;

    // Create and download the file
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll-import-template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Validation function for imported payroll data
  const validateImportedPayroll = useCallback((payroll, rowIndex) => {
    const errors = [];
    if (!payroll.employeeCode) errors.push('Employee Code is required.');
    if (!payroll.employeeName) errors.push('Employee Name is required.');
    if (payroll.daysInMonth < 0 || payroll.daysInMonth > 31) {
      errors.push('Days in Month must be between 0 and 31.');
    }
    if (payroll.daysPresent < 0 || payroll.daysPresent > payroll.daysInMonth) {
      errors.push('Days Present cannot exceed Days in Month.');
    }
    if (payroll.otHours < 0) {
      errors.push('OT Hours cannot be negative.');
    }
    if (payroll.actualBasic < 0) {
      errors.push('Actual Basic cannot be negative.');
    }
    if (payroll.actualHRA < 0) {
      errors.push('Actual HRA cannot be negative.');
    }
    if (payroll.pf < 0) {
      errors.push('PF cannot be negative.');
    }
    if (payroll.esi < 0) {
      errors.push('ESI cannot be negative.');
    }
    if (payroll.totalDeduction < 0) {
      errors.push('Total Deduction cannot be negative.');
    }
    if (payroll.otAmount < 0) {
      errors.push('OT Amount cannot be negative.');
    }
    if (payroll.otEsi < 0) {
      errors.push('OT ESI cannot be negative.');
    }
    if (payroll.otPayment < 0) {
      errors.push('OT Payment cannot be negative.');
    }
    if (payroll.payableAmount < 0) {
      errors.push('Payable Amount cannot be negative.');
    }
    if (payroll.netPay < 0) {
      errors.push('Net Pay cannot be negative.');
    }
    return errors.length > 0 ? errors.join(' ') : null;
  }, []);

  // Import Excel file handler
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setImportError('No file selected.');
      return;
    }

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type)) {
      setImportError('Invalid file type. Please upload an Excel file (.xlsx or .xls).');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setImportError('File size exceeds 5MB limit.');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No sheets found in the Excel file.');
        }
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('No data found in the Excel file.');
        }

        console.log('Excel data parsed:', jsonData);
        
        // Track employee codes to detect duplicates
        const employeeCodes = new Set();
        const duplicateCodes = new Set();

        // Debug: Log the first row to see actual headers
        if (jsonData.length > 0) {
          console.log('Excel headers found:', Object.keys(jsonData[0]));
          console.log('First row data:', jsonData[0]);
          console.log('Sample values for key fields:');
          console.log('- Days Present:', jsonData[0]['No. of Days Present'], jsonData[0]['Days Present'], jsonData[0]['DaysPresent']);
          console.log('- OT Hours:', jsonData[0]['OT Hours'], jsonData[0]['OTHours'], jsonData[0]['OT']);
        }

        const newPayrollData = jsonData.map((row, index) => {
          // Skip rows that are clearly totals/summary rows
          const sNoValue = row['S.No'] || row['S.No'] || row['SNo'] || row['Serial No'] || row['SerialNo'];
          if (sNoValue === 'Total' || sNoValue === 'TOTAL' || sNoValue === 'total' || 
              sNoValue === 'Sum' || sNoValue === 'SUM' || sNoValue === 'sum' ||
              sNoValue === 'Grand Total' || sNoValue === 'GRAND TOTAL' || sNoValue === 'grand total') {
            console.log(`Skipping totals row at index ${index}:`, row);
            return null; // Return null to filter out later
          }

          const safeToString = (value, isNumeric = false) => {
            if (value == null || value === '') return isNumeric ? null : '';
            if (isNumeric) {
              const num = Number(value);
              return isNaN(num) ? null : num;
            }
            return String(value);
          };

          // Helper function to find column value with flexible matching
          const getColumnValue = (possibleNames) => {
            for (const name of possibleNames) {
              if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                return row[name];
              }
            }
            return null;
          };

          // Enhanced helper function with fuzzy matching for key fields
          const getColumnValueWithFuzzyMatch = (possibleNames, fuzzyKeywords) => {
            // First try exact matches
            let result = getColumnValue(possibleNames);
            if (result !== null) return result;
            
            // If no exact match, try fuzzy matching
            const allKeys = Object.keys(row);
            for (const key of allKeys) {
              const lowerKey = key.toLowerCase();
              for (const keyword of fuzzyKeywords) {
                if (lowerKey.includes(keyword.toLowerCase()) && row[key] !== undefined && row[key] !== null && row[key] !== '') {
                  console.log(`Fuzzy match found for ${fuzzyKeywords.join('/')}: "${key}" = ${row[key]}`);
                  return row[key];
                }
              }
            }
            return null;
          };

          // Check for duplicate employee codes
          const employeeCode = safeToString(getColumnValue(['Employee Code', 'EmployeeCode', 'employee_code', 'Employee ID', 'EmployeeID']));
          const employeeName = safeToString(getColumnValue(['Employee Name', 'EmployeeName', 'employee_name', 'Name', 'Employee']));
          
          // Skip rows with empty employee code or name (likely totals/summary rows)
          if (!employeeCode || !employeeName || employeeCode.trim() === '' || employeeName.trim() === '') {
            console.log(`Skipping row at index ${index} due to empty employee code or name:`, { employeeCode, employeeName });
            return null;
          }
          
          if (employeeCode && employeeCodes.has(employeeCode)) {
            duplicateCodes.add(employeeCode);
            console.warn(`Duplicate Employee Code found: ${employeeCode} at row ${index + 2}`);
          }
          if (employeeCode) {
            employeeCodes.add(employeeCode);
          }

          // Debug: Log key field extraction for first few rows
          if (index < 3) {
            console.log(`Row ${index + 2} - Key field extraction:`, {
              employeeCode: safeToString(getColumnValue(['Employee Code', 'EmployeeCode', 'employee_code', 'Employee ID', 'EmployeeID'])),
              employeeName: safeToString(getColumnValue(['Employee Name', 'EmployeeName', 'employee_name', 'Name', 'Employee'])),
              daysPresent: {
                possibleNames: ['No. of Days Present', 'Days Present', 'DaysPresent', 'days_present', 'Present Days', 'Days Worked', 'Working Days', 'Attendance Days', 'Days', 'Present'],
                fuzzyKeywords: ['days', 'present', 'attendance', 'worked'],
                foundValue: getColumnValueWithFuzzyMatch(['No. of Days Present', 'Days Present', 'DaysPresent', 'days_present', 'Present Days', 'Days Worked', 'Working Days', 'Attendance Days', 'Days', 'Present'], ['days', 'present', 'attendance', 'worked']),
                finalValue: Number(safeToString(getColumnValueWithFuzzyMatch(['No. of Days Present', 'Days Present', 'DaysPresent', 'days_present', 'Present Days', 'Days Worked', 'Working Days', 'Attendance Days', 'Days', 'Present'], ['days', 'present', 'attendance', 'worked']), true)) || 0
              },
              otHours: {
                possibleNames: ['OT Hours', 'OTHours', 'ot_hours', 'Overtime Hours', 'OT', 'Overtime', 'OT Hrs', 'OT_Hours', 'Extra Hours', 'Hours Worked', 'Hours'],
                fuzzyKeywords: ['ot', 'hours', 'overtime', 'extra'],
                foundValue: getColumnValueWithFuzzyMatch(['OT Hours', 'OTHours', 'ot_hours', 'Overtime Hours', 'OT', 'Overtime', 'OT Hrs', 'OT_Hours', 'Extra Hours', 'Hours Worked', 'Hours'], ['ot', 'hours', 'overtime', 'extra']),
                finalValue: Number(safeToString(getColumnValueWithFuzzyMatch(['OT Hours', 'OTHours', 'ot_hours', 'Overtime Hours', 'OT', 'Overtime', 'OT Hrs', 'OT_Hours', 'Extra Hours', 'Hours Worked', 'Hours'], ['ot', 'hours', 'overtime', 'extra']), true)) || 0
              },
              rawRow: row
            });
          }

          const payroll = {
            employeeCode: employeeCode,
            employeeName: employeeName,
            department: safeToString(getColumnValue(['Department', 'Dept', 'department'])),
            contractor: safeToString(getColumnValue(['Contractor', 'ContractorName', 'contractor'])),
            daysInMonth: Number(safeToString(getColumnValue(['No. of Days (Month)', 'Days in Month', 'DaysInMonth', 'days_in_month', 'Total Days']), true)) || 0,
            daysPresent: Number(safeToString(getColumnValueWithFuzzyMatch(['No. of Days Present', 'Days Present', 'DaysPresent', 'days_present', 'Present Days', 'Days Worked', 'Working Days', 'Attendance Days', 'Days', 'Present'], ['days', 'present', 'attendance', 'worked']), true)) || 0,
            otHours: Number(safeToString(getColumnValueWithFuzzyMatch(['OT Hours', 'OTHours', 'ot_hours', 'Overtime Hours', 'OT', 'Overtime', 'OT Hrs', 'OT_Hours', 'Extra Hours', 'Hours Worked', 'Hours'], ['ot', 'hours', 'overtime', 'extra']), true)) || 0,
            loh: Number(safeToString(getColumnValue(['LOH', 'loh', 'Loss of Hours']), true)) || 0,
            actualBasic: Number(safeToString(getColumnValue(['Actual Basic', 'ActualBasic', 'actual_basic', 'Basic Salary', 'Basic']), true)) || 0,
            actualHRA: Number(safeToString(getColumnValue(['Actual HRA', 'ActualHRA', 'actual_hra', 'HRA', 'House Rent Allowance']), true)) || 0,
            actualTotalSalary: Number(safeToString(getColumnValue(['Actual Total Salary', 'ActualTotalSalary', 'actual_total_salary', 'Total Salary', 'Gross Salary']), true)) || 0,
            earnedBasic: Number(safeToString(getColumnValue(['Earned Basic', 'EarnedBasic', 'earned_basic']), true)) || 0,
            earnedHRA: Number(safeToString(getColumnValue(['Earned HRA', 'EarnedHRA', 'earned_hra']), true)) || 0,
            earnedSalaryCross: 0, // Will be recalculated
            otWages: Number(safeToString(getColumnValue(['OT Wages', 'OTWages', 'ot_wages', 'Overtime Wages']), true)) || 0,
            rent: Number(safeToString(getColumnValue(['Rent', 'rent', 'Rent Recovery', 'RentRecovery']), true)) || 0,
            advance: Number(safeToString(getColumnValue(['Advance', 'advance', 'Salary Advance', 'SalaryAdvance']), true)) || 0,
            netPay: Number(safeToString(getColumnValue(['Net Pay', 'NetPay', 'net_pay', 'Final Pay', 'Take Home']), true)) || 0,
            pf: Number(safeToString(getColumnValue(['PF', 'pf', 'Provident Fund', 'ProvidentFund']), true)) || 0,
            esi: Number(safeToString(getColumnValue(['ESI', 'esi', 'Employee State Insurance']), true)) || 0,
            totalDeduction: Number(safeToString(getColumnValue(['Total Deduction', 'TotalDeduction', 'total_deduction', 'Deductions']), true)) || 0,
            otAmount: Number(safeToString(getColumnValue(['OT Amount', 'OTAmount', 'ot_amount', 'Overtime Amount']), true)) || 0,
            otEsi: Number(safeToString(getColumnValue(['OT ESI', 'OTESI', 'ot_esi', 'OT ESI Deduction']), true)) || 0,
            otPayment: Number(safeToString(getColumnValue(['OT Payment', 'OTPayment', 'ot_payment', 'OT Net Payment']), true)) || 0,
            payableAmount: Number(safeToString(getColumnValue(['Payable Amount', 'PayableAmount', 'payable_amount', 'Final Payable']), true)) || 0,
            totalNetPayable: Number(safeToString(getColumnValue(['Total Net Payable', 'TotalNetPayable', 'total_net_payable']), true)) || 0,
          };

          // Apply calculations for imported data
          const derivedFields = calculateDerivedFields(payroll);
          Object.assign(payroll, derivedFields);

          // Check for duplicate employee codes
          if (duplicateCodes.has(payroll.employeeCode)) {
            const error = `Row ${index + 2}: Duplicate Employee Code '${payroll.employeeCode}' found. Each employee must have a unique code.`;
            console.error(error);
            throw new Error(error);
          }

          const validationError = validateImportedPayroll(payroll, index + 2);
          if (validationError) {
            console.error(`Row ${index + 2} validation error:`, validationError);
            throw new Error(validationError);
          }

          return payroll;
        }).filter(row => row !== null); // Filter out null values (totals rows)

        // Log duplicate codes summary
        if (duplicateCodes.size > 0) {
          console.warn(`Found ${duplicateCodes.size} duplicate Employee Codes:`, Array.from(duplicateCodes));
        }

        console.log(`Importing ${newPayrollData.length} payroll records for month ${selectedMonth}`);

        // Send data to backend for processing
        try {
          const response = await fetch('/server/payroll_function/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              month: selectedMonth,
              payrollData: newPayrollData
            }),
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
            setImportSuccess(`Successfully imported ${result.successCount || newPayrollData.length} payroll records for ${selectedMonth}. Note: Totals/summary rows are automatically skipped during import.`);
            setImportError('');
            // Ensure payroll UI is enabled and data is visible after import
            setPayrollRun(true);
            // Optimistically render imported rows immediately
            setPayrollData(newPayrollData);
            
            // Immediately refresh payroll data after successful import
              console.log('Refreshing payroll data after import...');
            try {
              // small delay to ensure backend writes are committed
              await new Promise(r => setTimeout(r, 800));

              // Manually fetch latest data; only overwrite if backend returns rows
              let url = `/server/payroll_function/payroll?month=${selectedMonth}&_t=${Date.now()}`;
              if (contractor !== 'All') url += `&contractor=${encodeURIComponent(contractor)}`;
              if (department !== 'All') url += `&department=${encodeURIComponent(department)}`;
              if (employeeId !== 'All') url += `&employeeId=${encodeURIComponent(employeeId)}`;

              console.log('Post-import verification fetch:', url);
              const res = await fetch(url);
              const latest = res.ok ? await res.json() : { data: [] };

              if (latest && Array.isArray(latest.data) && latest.data.length > 0) {
                console.log('Backend has committed rows; updating table with', latest.data.length, 'records');
                setPayrollData([...latest.data]);
              } else {
                console.log('Backend returned 0 rows; keeping optimistically rendered imported rows');
              }

              // Force a re-render by updating the data state
              setPayrollData(prev => {
                console.log('Forcing payroll data re-render after import');
                return [...prev];
              });
            } catch (refreshError) {
              console.error('Error refreshing payroll data after import:', refreshError);
              // Still show success message even if refresh fails
            }
          } else {
            setImportError(result.message || result.error || 'Failed to import payroll data');
          }
        } catch (apiError) {
          console.error('Import error:', apiError);
          setImportError('Failed to send data to server. Please try again.');
        }

      } catch (err) {
        setImportError(err.message || 'Failed to parse Excel file.');
        console.error('Excel parse error:', err);
      } finally {
        setImporting(false);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read the Excel file.');
      setImporting(false);
    };

    reader.readAsArrayBuffer(file);
  }, [selectedMonth, validateImportedPayroll, fetchPayrollData]);

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
            {allModules.map((item, idx) => (
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

          {/* Payroll Content */}
          <div className="payroll-container">
            {error && (
              <div style={{ padding: '20px', background: 'orange', color: 'white', margin: '10px' }}>
                ERROR: {error}
              </div>
            )}
            
            {/* Import Success Message */}
            {importSuccess && (
              <div style={{ padding: '20px', background: 'green', color: 'white', margin: '10px' }}>
                SUCCESS: {importSuccess}
              </div>
            )}
            
            {/* Import Error Message */}
            {importError && (
              <div style={{ padding: '20px', background: 'red', color: 'white', margin: '10px' }}>
                IMPORT ERROR: {importError}
              </div>
            )}
            
            {/* Payroll Controls - Always visible */}
            <div className="payroll-filters">
              <h1 className="payroll-title">Payroll Report</h1>
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="month">Select Month:</label>
                  <input
                    type="month"
                    id="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="filter-select"
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="contractor">Contractor:</label>
                  <select
                    id="contractor"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="filter-select"
                    disabled={!payrollRun}
                  >
                    {contractors.map(contractorOption => (
                      <option key={contractorOption} value={contractorOption}>
                        {contractorOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="department">Department:</label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="filter-select"
                    disabled={!payrollRun}
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="employee">Employee Code:</label>
                  <select
                    id="employee"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="filter-select"
                    disabled={!payrollRun}
                  >
                    {employees.map(emp => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="export-buttons">
                <button 
                  onClick={handleRunPayroll}
                  className="run-payroll-btn"
                  disabled={runningPayroll}
                  title="Run payroll for the selected month (includes fetching attendance data)"
                >
                  {runningPayroll ? 'Running Payroll...' : 'Run Payroll'}
                </button>
                <button 
                  onClick={handleSavePayroll}
                  className="export-btn save-btn"
                  disabled={!payrollRun || savingPayroll || loading}
                  title="Save current payroll data for the selected month"
                >
                  {savingPayroll ? 'Saving...' : 'Save Payroll'}
                </button>
                <button 
                  onClick={downloadTemplate} 
                  className="export-btn template-btn"
                  disabled={!payrollRun}
                >
                  Download Template
                </button>
                <div className="import-section">
                  <input
                    type="file"
                    id="import-excel"
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                    style={{ display: 'none' }}
                    disabled={importing}
                  />
                  <button 
                    onClick={() => document.getElementById('import-excel').click()}
                    className="export-btn import-btn"
                    disabled={importing || !payrollRun}
                    title="Import payroll data from Excel file"
                  >
                    {importing ? 'Importing...' : 'Import Excel'}
                  </button>
                </div>
                <button 
                  onClick={exportToExcel} 
                  className="export-btn excel-btn"
                  disabled={!payrollRun}
                >
                  Export to Excel
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="export-btn pdf-btn"
                  disabled={!payrollRun}
                >
                  Export to PDF
                </button>
                <button 
                  onClick={fetchPayrollData} 
                  className="export-btn refresh-btn"
                  disabled={!payrollRun || loading}
                  title="Refresh payroll data"
                >
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>


            {/* Summary Cards - Only show after payroll is run */}
            {payrollRun && (
              <div className="payroll-summary">
                <div className="summary-card">
                  <h3>Total Employees</h3>
                  <span>{payrollData && Array.isArray(payrollData) ? payrollData.length : 0}</span>
                </div>
                <div className="summary-card">
                  <h3>Total OT Hours</h3>
                  <span>{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otHours) || 0), 0).toFixed(1) : '0.0'} hrs</span>
                </div>
                <div className="summary-card">
                  <h3>Total Actual Salary</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualTotalSalary) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Earned Salary</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedSalaryCross) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total PF</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.pf) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total ESI</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.esi) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Deduction</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalDeduction) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total OT Amount</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otAmount) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total OT ESI</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otEsi) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total OT Payment</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otPayment) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Payable Amount</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.payableAmount) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total OT Wages</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otWages) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Rent Recovery</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.rent) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Salary Advance</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.advance) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Net Pay</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.netPay) || 0), 0).toLocaleString() : '0'}</span>
                </div>
                <div className="summary-card">
                  <h3>Total Net Payable</h3>
                  <span>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalNetPayable) || 0), 0).toLocaleString() : '0'}</span>
                </div>
              </div>
            )}

            {/* Debug Info - Show when no data */}
            {payrollRun && payrollData.length === 0 && !loading && (
              <div style={{ padding: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', margin: '10px', borderRadius: '5px' }}>
                <h4>Debug Information - No Data Found</h4>
                <p><strong>Current Filters:</strong></p>
                <ul>
                  <li>Month: {selectedMonth}</li>
                  <li>Contractor: {contractor}</li>
                  <li>Department: {department}</li>
                  <li>Employee ID: {employeeId}</li>
                </ul>
                <p><strong>Possible Issues:</strong></p>
                <ul>
                  <li>No payroll data exists for this month</li>
                  <li>Filters are too restrictive</li>
                  <li>Data exists but doesn't match current filters</li>
                </ul>
                <p><strong>Solutions:</strong></p>
                <ul>
                  <li>Try setting all filters to "All"</li>
                  <li>Check if data was imported successfully</li>
                  <li>Use "Refresh Data" button</li>
                </ul>
              </div>
            )}

            {/* Payroll Table - Only show after payroll is run */}
            {payrollRun && (
              <div className="payroll-table-container">
                {loading ? (
                  <div className="loading">Loading payroll data...</div>
                ) : (
                  <table className="payroll-table">
                    <thead>
                      <tr className="table-header">
                        <th>S.No</th>
                        <th>Employee Code</th>
                        <th>Employee Name</th>
                        <th>Department</th>
                        <th>Contractor</th>
                        <th>No. of Days (Month)</th>
                        <th>No. of Days Present</th>
                        <th>OT Hours</th>
                        <th>LOH</th>
                        <th>Actual Basic</th>
                        <th>Actual HRA</th>
                        <th>Actual Total Salary</th>
                        <th>Earned Basic</th>
                        <th>Earned HRA</th>
                        <th>Earned Salary Cross</th>
                        <th>PF</th>
                        <th>ESI</th>
                        <th>Total Deduction</th>
                        <th>OT Amount</th>
                        <th>OT ESI</th>
                        <th>OT Payment</th>
                        <th>Payable Amount</th>
                        <th>OT Wages</th>
                        <th>Rent Recovery</th>
                        <th>Salary Advance</th>
                        <th>Net Pay</th>
                        <th>Total Net Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollData && Array.isArray(payrollData) ? payrollData.map((employee, index) => {
                        // Debug logging for Days Present
                        if (index < 3) {
                          console.log(`Employee ${index + 1} (${employee.employeeCode}) Days Present debug:`, {
                            rawValue: employee.daysPresent,
                            type: typeof employee.daysPresent,
                            parsedValue: parseFloat(employee.daysPresent),
                            displayValue: employee.daysPresent || 0,
                            allEmployeeData: employee
                          });
                        }
                        
                        return (
                        <tr 
                          key={`${employee.employeeCode}-${employee.actualBasic}-${employee.actualHRA}-${employee.actualDA}-${employee.otherAllowance}-${index}`} 
                          className="table-row clickable-row"
                          onClick={() => handleRowClick(employee)}
                          title="Click to edit this employee's payroll data"
                        >
                          <td>{index + 1}</td>
                          <td>{employee.employeeCode || ''}</td>
                          <td>{employee.employeeName || ''}</td>
                          <td>{employee.department || ''}</td>
                          <td>{employee.contractor || ''}</td>
                          <td>{employee.daysInMonth || 0}</td>
                          <td>{employee.daysPresent || 0}</td>
                          <td>
                            {employee.otHours || '0.0'}
                            {employee.otHours > 0 && (
                              <span 
                                style={{ 
                                  marginLeft: '5px', 
                                  fontSize: '12px', 
                                  color: '#28a745',
                                  cursor: 'help'
                                }} 
                                title="OT Hours automatically fetched from monthly OT report"
                              >
                                ✓
                              </span>
                            )}
                          </td>
                          <td>{employee.loh || 0}</td>
                          <td>₹{(parseFloat(employee.actualBasic) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.actualHRA) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.actualTotalSalary) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.earnedBasic) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.earnedHRA) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.earnedSalaryCross) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.pf) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.esi) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.totalDeduction) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.otAmount) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.otEsi) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.otPayment) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.payableAmount) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.otWages) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.rent) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.advance) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.netPay) || 0).toLocaleString()}</td>
                          <td>₹{(parseFloat(employee.totalNetPayable) || 0).toLocaleString()}</td>
                        </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="28" style={{ textAlign: 'center', padding: '20px' }}>
                            No payroll data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="table-footer">
                        <td colSpan="8">Total</td>
                        <td>{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otHours) || 0), 0).toFixed(1) : '0.0'}</td>
                        <td>{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.loh) || 0), 0).toFixed(1) : '0.0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualBasic) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualHRA) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.actualTotalSalary) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedBasic) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedHRA) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.earnedSalaryCross) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.pf) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.esi) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalDeduction) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otAmount) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otEsi) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otPayment) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.payableAmount) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.otWages) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.rent) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.advance) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.netPay) || 0), 0).toLocaleString() : '0'}</td>
                        <td>₹{payrollData && Array.isArray(payrollData) ? payrollData.reduce((sum, emp) => sum + (parseFloat(emp.totalNetPayable) || 0), 0).toLocaleString() : '0'}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
              <div className="edit-modal-overlay">
                <div className="edit-modal">
                  <div className="edit-modal-header">
                    <h2>Edit Payroll Data</h2>
                    <button 
                      className="close-edit-btn"
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                    >
                      ×
                    </button>
                  </div>
                  <div className="edit-modal-content">
                    <div className="edit-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Employee Code:</label>
                          <input
                            type="text"
                            value={editFormData.employeeCode}
                            onChange={(e) => handleEditFormChange('employeeCode', e.target.value)}
                            disabled={savingEdit}
                          />
                        </div>
                        <div className="form-group">
                          <label>Employee Name:</label>
                          <input
                            type="text"
                            value={editFormData.employeeName}
                            onChange={(e) => handleEditFormChange('employeeName', e.target.value)}
                            disabled={savingEdit}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Department:</label>
                          <input
                            type="text"
                            value={editFormData.department}
                            onChange={(e) => handleEditFormChange('department', e.target.value)}
                            disabled={savingEdit}
                          />
                        </div>
                        <div className="form-group">
                          <label>Contractor:</label>
                          <input
                            type="text"
                            value={editFormData.contractor}
                            onChange={(e) => handleEditFormChange('contractor', e.target.value)}
                            disabled={savingEdit}
                          />
                        </div>
                      </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Days in Month:</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={editFormData.daysInMonth}
                              onChange={(e) => handleEditFormChange('daysInMonth', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Days Present:</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={editFormData.daysPresent}
                              onChange={(e) => handleEditFormChange('daysPresent', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>OT Hours:</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={editFormData.otHours}
                              onChange={(e) => handleEditFormChange('otHours', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                              title="OT Hours are automatically fetched from monthly OT report but can be manually edited if needed"
                            />
                          </div>
                          <div className="form-group">
                            <label>LOH:</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="any"
                              value={editFormData.loh}
                              onChange={(e) => handleEditFormChange('loh', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>

                      <div className="form-section">
                        <h3>Actual Salary</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Actual Basic:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.actualBasic}
                              onChange={(e) => handleEditFormChange('actualBasic', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Actual HRA:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.actualHRA}
                              onChange={(e) => handleEditFormChange('actualHRA', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Actual DA:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.actualDA}
                              onChange={(e) => handleEditFormChange('actualDA', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Other Allowance:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.otherAllowance}
                              onChange={(e) => handleEditFormChange('otherAllowance', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Actual Total Salary:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.actualTotalSalary}
                              disabled
                              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h3>Earned Salary</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Earned Basic:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.earnedBasic}
                              disabled
                              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                              title="Calculated automatically: Actual Basic / Days in Month * Days Present"
                            />
                          </div>
                          <div className="form-group">
                            <label>Earned HRA:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.earnedHRA}
                              disabled
                              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                              title="Calculated automatically: Actual HRA / Days in Month * Days Present"
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Earned Salary Cross:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.earnedSalaryCross}
                              onChange={(e) => handleEditFormChange('earnedSalaryCross', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h3>Deductions</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>PF:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.pf}
                              onChange={(e) => handleEditFormChange('pf', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>ESI:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.esi}
                              onChange={(e) => handleEditFormChange('esi', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Total Deduction:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.totalDeduction}
                              onChange={(e) => handleEditFormChange('totalDeduction', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h3>OT Details</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>OT Amount:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.otAmount}
                              onChange={(e) => handleEditFormChange('otAmount', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>OT ESI:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.otEsi}
                              onChange={(e) => handleEditFormChange('otEsi', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>OT Payment:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.otPayment}
                              onChange={(e) => handleEditFormChange('otPayment', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Payable Amount:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.payableAmount}
                              onChange={(e) => handleEditFormChange('payableAmount', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-section">
                        <h3>Additional & Deductions</h3>
                        <div className="form-row">
                          <div className="form-group">
                            <label>OT Wages:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.otWages}
                              onChange={(e) => handleEditFormChange('otWages', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Rent Recovery:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.rent}
                              onChange={(e) => handleEditFormChange('rent', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Salary Advance:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.advance}
                              onChange={(e) => handleEditFormChange('advance', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Net Pay:</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.netPay}
                              onChange={(e) => handleEditFormChange('netPay', parseFloat(e.target.value) || 0)}
                              disabled={savingEdit}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="edit-modal-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Payroll;