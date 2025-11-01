import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Payment.css';
import './App.css'; // For sidebar styling
import './Dashboard.css'; // For dashboard background and shapes
import axios from 'axios';
import Button from './Button';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import { 
  Users, Calendar, FileText, AlertTriangle, FolderOpen, ClipboardList, 
  Building, Handshake, Landmark, Clock, Map, BarChart3, User, 
  TrendingUp, TrendingDown, Activity, Plus, CheckCircle, Bell, 
  Settings, LayoutDashboard, Home as HomeIcon, Award, Target, 
  Zap, Star, Trophy, Shield, Flame, Heart, Gift, Sparkles, 
  Crown, Medal, Rocket, CloudLightning as Lightning, Filter, 
  ChevronDown, AlertOctagon, CreditCard, FileSignature, Search, Clock3
} from 'lucide-react';

const initialPaymentDetail = {
  skill: '',
  skillType: '',
  ratePerHour: '',
  totalManHours: '',
  totalManHoursDecimal: '',
  totalAmount: '',
};

const transactionTypes = [
  { value: '', label: '-Select-' },
  { value: 'intra-state', label: 'intra-state' },
  { value: 'inter-state', label: 'inter-state' },
];

const skillTypeList = ['Skilled', 'Semi-Skilled', 'Un-Skilled'];

function Payment() {
  const [organizations, setOrganizations] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [form, setForm] = useState({
    organization: '',
    contractor: '',
    fromDate: '',
    toDate: '',
    transactionType: '',
  });
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [totals, setTotals] = useState({
    grandTotal: '',
    igst: '',
    sgst: '',
    cgst: '',
    tds: '',
    netPayable: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Sidebar state variables
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock user data - you can replace with actual user data
  const userName = 'John Doe';
  const userRole = 'App Administrator';
  const userAvatar = 'https://via.placeholder.com/40x40/4facfe/ffffff?text=JD';

  // Define modules for navigation
  const allModules = [
    { icon: <HomeIcon size={22} />, label: 'Home', path: '/' },
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Landmark size={22} />, label: 'Organization', path: '/organization' },
    { icon: <Users size={22} />, label: 'Employees', path: '/employees' },
    // Multi-stack parent
    {
      icon: <Calendar size={22} />,
      label: 'Attendance Sync',
      children: [
        { icon: <Calendar size={20} />, label: 'Attendance', path: '/attendance' },
        { icon: <FolderOpen size={20} />, label: 'Attendance Muster', path: '/attendancemuster' },
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
    { icon: <ClipboardList size={22} />, label: 'Designation', path: '/tasks' },
    { icon: <Building size={22} />, label: 'Department', path: '/time' },
    { icon: <Handshake size={22} />, label: 'Contractors', path: '/contracters' },
    { icon: <ClipboardList size={22} />, label: 'Statutory Registers', path: '/statutoryregisters' },
    { icon: <CreditCard size={22} />, label: 'Payment', path: '/payment' },
    { icon: <BarChart3 size={22} />, label: 'Payroll', path: '/payroll' },
    { icon: <Search size={22} />, label: 'Deduction', path: '/detection' },
    {
      icon: <Clock size={22} />,
      label: 'Shift Reports',
      children: [
        { icon: <Clock size={20} />, label: 'Shift', path: '/shift' },
        { icon: <Map size={20} />, label: 'Shift Map', path: '/Shiftmap' },
      ]
    },
    { icon: <Clock3 size={22} />, label: 'LOH Report', path: '/loh-report' },
    {
      icon: <BarChart3 size={22} />,
      label: 'Reports',
      children: [
        { icon: <BarChart3 size={20} />, label: 'Monthly OT Reports', path: '/reports' },
        { icon: <FolderOpen size={20} />, label: 'Attendance Muster', path: '/attendancemuster' },
        { icon: <AlertTriangle size={20} />, label: 'Deviation Records', path: '/deviationrecords' },
        { icon: <ClipboardList size={20} />, label: 'Statutory Registers', path: '/statutoryregisters' },
      ]
    },
  ];

  // Mock recent activities for notifications
  const recentActivities = [
    { icon: '💰', title: 'Payment Processed', description: 'Payment for ABC Corp has been processed', time: '2 hours ago' },
    { icon: '📊', title: 'Report Generated', description: 'Monthly payment report has been generated', time: '4 hours ago' },
    { icon: '✅', title: 'Contractor Approved', description: 'New contractor has been approved', time: '6 hours ago' },
  ];

  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fetch organizations and contractors
  useEffect(() => {
    axios.get('/server/contracters_function/organizations', { params: { page: 1, perPage: 100 } })
      .then(res => {
        setOrganizations(res.data.data.organizations || []);
      });
    axios.get('/server/contracters_function/contractors', { params: { page: 1, perPage: 100 } })
      .then(res => {
        setContractors(res.data.data.contractors || []);
      });
    // Fetch payments on component mount
    fetchPayments();
  }, []);

  // Refetch payments when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPayments();
    }
  }, [refreshTrigger]);

  // Fetch payments list
  const fetchPayments = async () => {
    setLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn('Payment fetch timeout - setting loading to false');
    }, 10000); // 10 second timeout
    
    try {
      const response = await axios.get('/server/Payment_function/payments', {
        params: { 
          page: 1, 
          perPage: 10000
        },
        timeout: 8000 // 8 second axios timeout
      });
      
      clearTimeout(timeoutId); // Clear timeout if request succeeds
      console.log('Payments response:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data.payments)) {
        setPayments(response.data.data.payments);
        console.log('Payments loaded:', response.data.data.payments.length);
      } else if (Array.isArray(response.data)) {
        setPayments(response.data);
        console.log('Payments loaded (direct array):', response.data.length);
      } else {
        console.warn('Unexpected response format:', response.data);
        setPayments([]);
      }
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout if request fails
      console.error('Error fetching payments:', error);
      setPayments([]);
      
      // Show specific error message based on the error type
      let errorMessage = 'Failed to load payments: ';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - please check your connection and try again';
      } else if (error.response?.status === 500) {
        if (error.response?.data?.message?.includes('table does not exist')) {
          errorMessage = 'Payment table does not exist. Please create the Payment table in your Catalyst datastore first.';
        } else if (error.response?.data?.message?.includes('permission')) {
          errorMessage = 'Permission denied. Please check your Catalyst datastore permissions.';
        } else {
          errorMessage = 'Server error: ' + (error.response?.data?.message || error.message);
        }
      } else {
        errorMessage += (error.response?.data?.message || error.message);
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Date validation function
  const validateDates = () => {
    const errors = {};
    
    if (form.fromDate && form.toDate) {
      const fromDate = new Date(form.fromDate);
      const toDate = new Date(form.toDate);
      
      if (fromDate > toDate) {
        errors.toDate = 'To Date must be after From Date';
      } else {
        const oneMonthLater = new Date(fromDate);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        if (toDate > oneMonthLater) {
          errors.toDate = 'The date period should be within 1 month';
        }
      }
    }
    
    return errors;
  };

  // Calculate payment details based on attendance data
  const calculatePaymentDetails = async () => {
  if (!form.contractor || !form.fromDate || !form.toDate) {
    return;
  }

  const dateErrors = validateDates();
  if (Object.keys(dateErrors).length > 0) {
    setErrors(dateErrors);
    return;
  }

  setCalculating(true);
  try {
    const response = await axios.post('/server/Payment_function/calculate-payment', {
      contractor: form.contractor,
      fromDate: form.fromDate,
      toDate: form.toDate,
      transactionType: form.transactionType,
    });

    if (response.data.status === 'success') {
      const details = response.data.data.paymentDetails || [];
      const totals = response.data.data.totals || {
        grandTotal: '',
        igst: '',
        sgst: '',
        cgst: '',
        tds: '',
        netPayable: '',
      };

      const processedDetails = details.map((detail, index) => ({
        S_No: detail.S_No || index + 1,
        Skill: detail.Skill || '',
        Skill_Type: detail.Skill_Type || '',
        Rate_per_hour: parseFloat(detail.Rate_per_hour) || 0,
        Total: detail.Total || '0h 0m',
        Total_Man_hours_In_Decimal: parseFloat(detail.Total_Man_hours_In_Decimal) || 0,
        Total_Amount: parseFloat(detail.Total_Amount) || 0,
      }));

      // Remove static fallback logic
      if (processedDetails.length === 0) {
        setPaymentDetails([]);
        setTotals({
          grandTotal: '0',
          igst: '0',
          sgst: '0',
          cgst: '0',
          tds: '0',
          netPayable: '0',
        });
      } else {
        setPaymentDetails(processedDetails);
        setTotals(totals);
      }
    } else {
      throw new Error(response.data.message || 'Failed to calculate payment details');
    }
  } catch (error) {
    console.error('Error calculating payment:', error);
    
    let errorMessage = 'Error calculating payment details: ';
    if (error.response?.status === 408) {
      errorMessage = 'Payment calculation timed out. Please try with a smaller date range (maximum 1 week) or check if there are too many attendance records.';
    } else if (error.response?.data?.message) {
      errorMessage += error.response.data.message;
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
    setPaymentDetails([]);
    setTotals({
      grandTotal: '0',
      igst: '0',
      sgst: '0',
      cgst: '0',
      tds: '0',
      netPayable: '0',
    });
  } finally {
    setCalculating(false);
  }
};

  // Trigger calculation when contractor, dates, or transaction type change
  useEffect(() => {
    if (form.contractor && form.fromDate && form.toDate && form.transactionType) {
      calculatePaymentDetails();
    }
  }, [form.contractor, form.fromDate, form.toDate, form.transactionType]);

  // Calculate taxes when payment details or transaction type changes
  useEffect(() => {
    if (paymentDetails.length > 0 && form.transactionType) {
      calculateTaxes();
    }
  }, [paymentDetails, form.transactionType]);

  // Function to calculate taxes based on current payment details
  const calculateTaxes = () => {
    if (paymentDetails.length === 0) return;

    const grandTotal = paymentDetails.reduce((sum, detail) => sum + (parseFloat(detail.Total_Amount) || 0), 0);
    let igst = 0, sgst = 0, cgst = 0, tds = 0, netPayable = 0;

    if (grandTotal > 0) {
      if (form.transactionType === 'intra-state') {
        sgst = Math.round(grandTotal * 0.09);
        cgst = Math.round(grandTotal * 0.09);
        igst = 0;
      } else if (form.transactionType === 'inter-state') {
        igst = Math.round(grandTotal * 0.18);
        sgst = 0;
        cgst = 0;
      }
      
      tds = Math.round(grandTotal * 0.02);
      netPayable = grandTotal + igst + sgst + cgst - tds;
    }

    const newTotals = {
      grandTotal: grandTotal.toString(),
      igst: igst.toString(),
      sgst: sgst.toString(),
      cgst: cgst.toString(),
      tds: tds.toString(),
      netPayable: netPayable.toString()
    };

    setTotals(newTotals);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const dateErrors = validateDates();
    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      setSubmitting(false);
      return;
    }

    const payload = {
      Organization: form.organization,
      Contractors: form.contractor,
      FromDate: form.fromDate,
      ToDate: form.toDate,
      TransactionType: form.transactionType,
      GrandTotal: totals.grandTotal,
      GST: totals.igst,
      SGST: totals.sgst,
      CGST: totals.cgst,
      TDS: totals.tds,
      NetPayable: totals.netPayable,
      Skill: paymentDetails.length > 0 ? paymentDetails[0].Skill : null,
    };

    try {
      const response = await axios.post('/server/Payment_function/payments', payload);
      
      if (response.data.status === 'success') {
        alert('Payment submitted successfully!');
        handleReset();
        setShowPaymentForm(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchPayments();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(response.data.message || 'Failed to submit payment');
      }
    } catch (err) {
      alert('Failed to submit payment. ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setForm({ organization: '', contractor: '', fromDate: '', toDate: '', transactionType: '' });
    setPaymentDetails([]);
    setTotals({ grandTotal: '', igst: '', sgst: '', cgst: '', tds: '', netPayable: '' });
    setErrors({});
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get contractor name by ID
  const getContractorName = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor ? contractor.ContractorName : contractorId;
  };

  const handleSelectPayment = (id) => {
    setSelectedPayments(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const handleDeletePayments = async () => {
    if (!window.confirm('Are you sure you want to delete the selected payments?')) return;
    try {
      await Promise.all(
        selectedPayments.map(id =>
          axios.delete(`/server/Payment_function/payments/${id}`)
        )
      );
      alert('Selected payments deleted successfully!');
      setSelectedPayments([]);
      fetchPayments();
    } catch (error) {
      alert('Failed to delete payments: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle edit payment
  const handleEditPayment = async (payment) => {
    try {
      const response = await axios.get(`/server/Payment_function/payments/${payment.ROWID || payment.id}`);
      
      if (response.data.status === 'success') {
        const paymentData = response.data.data.payment;
        
        setForm({
          organization: paymentData.Organization || '',
          contractor: paymentData.Contractors || '',
          fromDate: paymentData.FromDate ? new Date(paymentData.FromDate).toISOString().split('T')[0] : '',
          toDate: paymentData.ToDate ? new Date(paymentData.ToDate).toISOString().split('T')[0] : '',
          transactionType: paymentData.TransactionType || '',
        });
        
        setEditingPayment(payment);
        setIsEditMode(true);
        setShowPaymentForm(true);
      }
    } catch (error) {
      alert('Failed to load payment for editing: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle update payment
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const dateErrors = validateDates();
    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      setSubmitting(false);
      return;
    }

    const payload = {
      Organization: form.organization,
      Contractors: form.contractor,
      FromDate: form.fromDate,
      ToDate: form.toDate,
      TransactionType: form.transactionType,
      GrandTotal: totals.grandTotal,
      GST: totals.igst,
      SGST: totals.sgst,
      CGST: totals.cgst,
      TDS: totals.tds,
      NetPayable: totals.netPayable,
      Skill: paymentDetails.length > 0 ? paymentDetails[0].Skill : null,
    };

    try {
      const response = await axios.put(`/server/Payment_function/payments/${editingPayment.ROWID || editingPayment.id}`, payload);
      
      if (response.data.status === 'success') {
        alert('Payment updated successfully!');
        handleCancelEdit();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchPayments();
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(response.data.message || 'Failed to update payment');
      }
    } catch (err) {
      alert('Failed to update payment. ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingPayment(null);
    setIsEditMode(false);
    setShowPaymentForm(false);
    handleReset();
  };

  // Handle total payments count
  const handleTotalPayments = () => {
    const totalCount = payments.length;
    const selectedCount = selectedPayments.length;
    
    let message = `Total Payments: ${totalCount}`;
    
    if (selectedCount > 0) {
      message += `\nSelected Payments: ${selectedCount}`;
    }
    
    alert(message);
  };

  // Handle export payments to CSV
  const handleExportPayments = () => {
    const paymentsToExport = selectedPayments.length > 0 
      ? payments.filter(payment => selectedPayments.includes(payment.ROWID || payment.id))
      : payments;

    if (paymentsToExport.length === 0) {
      alert('No payments to export');
      return;
    }

    const headers = [
      'S.No',
      'Organization',
      'Contractor',
      'From Date',
      'To Date',
      'Grand Total',
      'IGST',
      'SGST',
      'CGST',
      'TDS',
      'Net Payable',
      'Transaction Type'
    ];

    const csvData = paymentsToExport.map((payment, index) => [
      index + 1,
      payment.Organization || '',
      getContractorName(payment.Contractors),
      formatDate(payment.FromDate),
      formatDate(payment.ToDate),
      payment.GrandTotal || '',
      payment.GST || '',
      payment.SGST || '',
      payment.CGST || '',
      payment.TDS || '',
      payment.NetPayable || '',
      payment.TransactionType || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exported ${paymentsToExport.length} payments to CSV`);
    alert(`Successfully exported ${paymentsToExport.length} payment(s) to CSV`);
  };

  // Handle download PDF report
  const handleDownloadPDF = () => {
    const paymentsToExport = selectedPayments.length > 0 
      ? payments.filter(payment => selectedPayments.includes(payment.ROWID || payment.id))
      : payments;

    if (paymentsToExport.length === 0) {
      alert('No payments to generate PDF report');
      return;
    }

    // Get image path for PDF embedding
    const getImagePath = () => {
      // Use the image file path - make sure Capture.jpg is in the public folder
      return 'Capture.jpg';
    };

    // Generate PDF content
    const generatePDFContent = () => {
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Get current form data
      const currentFormData = {
        organization: form.organization,
        contractor: form.contractor,
        fromDate: form.fromDate,
        toDate: form.toDate,
        transactionType: form.transactionType,
        paymentDetails: paymentDetails,
        totals: totals
      };

      let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; align-items: center; margin-bottom: 30px; }
            .logo-container { 
              display: flex; 
              align-items: center; 
              margin-right: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
              margin-left: 20px;
            }
            .report-info { margin-bottom: 20px; }
            .report-info div { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { text-align: right; margin-top: 20px; }
            .summary div { margin: 5px 0; font-weight: bold; }
            .payment-details { margin: 20px 0; }
            .payment-details div { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <img src="${getImagePath()}" alt="Buildhr Logo" style="height:60px; margin-right:20px;" />
            </div>
            <div class="company-name">Buildhr Management consultants Pvt Ltd</div>
          </div>
          
          <div class="report-info">
            <div><strong>Report Generation Date:</strong> ${currentDate}</div>
            <div><strong>Organization:</strong> ${currentFormData.organization || 'N/A'}</div>
            <div><strong>Contractor Name:</strong> ${getContractorName(currentFormData.contractor) || (paymentsToExport[0] ? getContractorName(paymentsToExport[0].Contractors) : 'N/A')}</div>
            <div><strong>Period (From & To date):</strong> ${formatDate(currentFormData.fromDate) || (paymentsToExport[0] ? formatDate(paymentsToExport[0].FromDate) + ' & ' + formatDate(paymentsToExport[0].ToDate) : 'N/A')}</div>
            <div><strong>Transaction Type:</strong> ${currentFormData.transactionType || 'N/A'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Skill</th>
                <th>Skill Type</th>
                <th>Rate per hour</th>
                <th>Total Man-hours</th>
                <th>Total Man-hours (In Decimal)</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Add payment details rows with actual form data or payment data
      const getPaymentDetailsForPDF = () => {
        console.log('Getting payment details for bulk PDF. Current form data:', currentFormData);
        console.log('Payment details from form:', paymentDetails);
        
        // ALWAYS use current form payment details if available (prioritize form data)
        if (currentFormData.paymentDetails && currentFormData.paymentDetails.length > 0) {
          console.log('Using current form payment details for bulk PDF');
          return currentFormData.paymentDetails.map((detail, index) => ({
            S_No: index + 1,
            Skill: detail.Skill || 'N/A',
            Skill_Type: detail.Skill_Type || 'N/A',
            Rate_per_hour: detail.Rate_per_hour || 0,
            Total_Man_hours: detail.Total || 'N/A',
            Total_Man_hours_Decimal: detail.Total_Man_hours_In_Decimal || 0,
            Total_Amount: detail.Total_Amount || 0
          }));
        }
        
        // If no valid form data, use the first payment's data
        if (paymentsToExport.length > 0) {
          const firstPayment = paymentsToExport[0];
          
          // Try to extract payment details from the payment record
          if (firstPayment.PaymentDetails && typeof firstPayment.PaymentDetails === 'string') {
            try {
              const parsedDetails = JSON.parse(firstPayment.PaymentDetails);
              if (Array.isArray(parsedDetails) && parsedDetails.length > 0) {
                return parsedDetails.map((detail, index) => ({
                  S_No: index + 1,
                  Skill: detail.Skill || detail.skill || 'N/A',
                  Skill_Type: detail.Skill_Type || detail.skillType || 'N/A',
                  Rate_per_hour: detail.Rate_per_hour || detail.ratePerHour || 0,
                  Total_Man_hours: detail.Total || detail.totalManHours || 'N/A',
                  Total_Man_hours_Decimal: detail.Total_Man_hours_In_Decimal || detail.totalManHoursDecimal || 0,
                  Total_Amount: detail.Total_Amount || detail.totalAmount || 0
                }));
              }
            } catch (e) {
              console.log('Error parsing PaymentDetails:', e);
            }
          }
          
          // Fallback to basic payment fields
          return [{
            S_No: 1,
            Skill: firstPayment.Skill || 'N/A',
            Skill_Type: firstPayment.SkillType || 'N/A',
            Rate_per_hour: firstPayment.Rateperhour || 0,
            Total_Man_hours: firstPayment.TotalManhours || 'N/A',
            Total_Man_hours_Decimal: firstPayment.TotalManhoursInDecimal || 0,
            Total_Amount: firstPayment.TotalAmount || 0
          }];
        }
        
        return [];
      };

      const paymentDetailsForPDF = getPaymentDetailsForPDF();
      
      if (paymentDetailsForPDF.length > 0) {
        paymentDetailsForPDF.forEach((detail) => {
          pdfContent += `
            <tr>
              <td>${detail.S_No}</td>
              <td>${detail.Skill}</td>
              <td>${detail.Skill_Type}</td>
              <td>₹${detail.Rate_per_hour}</td>
              <td>${detail.Total_Man_hours}</td>
              <td>${detail.Total_Man_hours_Decimal}</td>
              <td>₹${detail.Total_Amount}</td>
            </tr>
          `;
        });
      } else {
        // If still no data, show a placeholder
        pdfContent += `
          <tr>
            <td>1</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>₹0</td>
            <td>N/A</td>
            <td>0</td>
            <td>₹0</td>
          </tr>
        `;
      }

      // Add summary section
      const grandTotal = paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.GrandTotal) || 0), 0);
      const tds = grandTotal * 0.02;
      const netPayable = grandTotal - tds;

      pdfContent += `
            </tbody>
          </table>
          
          <div class="summary">
            <div><strong>Grand Total:</strong> ₹${grandTotal.toLocaleString()}</div>
            <div><strong>IGST:</strong> ₹${paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.GST) || 0), 0).toLocaleString()}</div>
            <div><strong>SGST:</strong> ₹${paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.SGST) || 0), 0).toLocaleString()}</div>
            <div><strong>CGST:</strong> ₹${paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.CGST) || 0), 0).toLocaleString()}</div>
            <div><strong>TDS:</strong> ₹${paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.TDS) || 0), 0).toLocaleString()}</div>
            <div><strong>Net Payable:</strong> ₹${paymentsToExport.reduce((sum, payment) => sum + (parseFloat(payment.NetPayable) || 0), 0).toLocaleString()}</div>
          </div>
        </body>
        </html>
      `;

      return pdfContent;
    };

    // Create and download PDF
    const pdfContent = generatePDFContent();
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_report_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Generated PDF report for ${paymentsToExport.length} payment(s)`);
    alert(`Successfully generated PDF report for ${paymentsToExport.length} payment(s)`);
  };

  // Handle download single payment PDF
  const handleDownloadSinglePDF = async (payment) => {
    let paymentDetailsForPDF = paymentDetails;
    let totalsForPDF = totals;
    
    if (!isEditMode || paymentDetails.length === 0) {
      try {
        const response = await axios.post('/server/Payment_function/calculate-payment', {
          contractor: payment.Contractors,
          fromDate: payment.FromDate,
          toDate: payment.ToDate,
          transactionType: payment.TransactionType
        });
        
        if (response.data.status === 'success') {
          paymentDetailsForPDF = response.data.data.paymentDetails || [];
          totalsForPDF = response.data.data.totals || {
            grandTotal: payment.GrandTotal || '0',
            igst: payment.GST || '0',
            sgst: payment.SGST || '0',
            cgst: payment.CGST || '0',
            tds: payment.TDS || '0',
            netPayable: payment.NetPayable || '0'
          };
        }
      } catch (error) {
        paymentDetailsForPDF = [{
          S_No: 1,
          Skill: payment.Skill || 'N/A',
          Skill_Type: payment.SkillType || 'N/A',
          Rate_per_hour: payment.Rateperhour || 0,
          Total: payment.TotalManhours || 'N/A',
          Total_Man_hours_In_Decimal: payment.TotalManhoursInDecimal || 0,
          Total_Amount: payment.TotalAmount || 0
        }];
        totalsForPDF = {
          grandTotal: payment.GrandTotal || '0',
          igst: payment.GST || '0',
          sgst: payment.SGST || '0',
          cgst: payment.CGST || '0',
          tds: payment.TDS || '0',
          netPayable: payment.NetPayable || '0'
        };
      }
    }
    
    // Get image path for PDF embedding
    const getImagePath = () => {
      // Use the image file path - make sure Capture.jpg is in the public folder
      return 'Capture.jpg';
    };
    
    const generateSinglePDFContent = (paymentData) => {
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Get current form data
      const currentFormData = {
        organization: form.organization || paymentData.Organization,
        contractor: form.contractor || paymentData.Contractors,
        fromDate: form.fromDate || paymentData.FromDate,
        toDate: form.toDate || paymentData.ToDate,
        transactionType: form.transactionType || paymentData.TransactionType,
        paymentDetails: paymentDetailsForPDF,
        totals: totalsForPDF
      };

      // Get payment details from the current form state or payment data
      const getPaymentDetailsData = () => {
        console.log('Getting payment details for PDF. Current form data:', currentFormData);
        console.log('Payment details from form:', paymentDetailsForPDF);
        
        // Use the fetched or current payment details
        if (paymentDetailsForPDF && paymentDetailsForPDF.length > 0) {
          console.log('Using payment details for PDF:', paymentDetailsForPDF);
          return paymentDetailsForPDF.map((detail, index) => ({
            S_No: index + 1,
            Skill: detail.Skill || 'N/A',
            Skill_Type: detail.Skill_Type || 'N/A',
            Total_Man_hours: detail.Total || 'N/A',
            Total_Man_hours_Decimal: detail.Total_Man_hours_In_Decimal || 0,
            Rate_per_hour: detail.Rate_per_hour || 0,
            Total_Amount: detail.Total_Amount || 0
          }));
        }
        
        // If form data is not valid, use payment data from database
        // Try to extract payment details from the payment record
        const paymentDetailsFromDB = [];
        
        // Check if payment has PaymentDetails field (stored as JSON)
        if (paymentData.PaymentDetails && typeof paymentData.PaymentDetails === 'string') {
          try {
            const parsedDetails = JSON.parse(paymentData.PaymentDetails);
            if (Array.isArray(parsedDetails) && parsedDetails.length > 0) {
              return parsedDetails.map((detail, index) => ({
                S_No: index + 1,
                Skill: detail.Skill || detail.skill || 'N/A',
                Skill_Type: detail.Skill_Type || detail.skillType || 'N/A',
                Total_Man_hours: detail.Total || detail.totalManHours || 'N/A',
                Total_Man_hours_Decimal: detail.Total_Man_hours_In_Decimal || detail.totalManHoursDecimal || 0,
                Rate_per_hour: detail.Rate_per_hour || detail.ratePerHour || 0,
                Total_Amount: detail.Total_Amount || detail.totalAmount || 0
              }));
            }
          } catch (e) {
            console.log('Error parsing PaymentDetails:', e);
          }
        }
        
        // Final fallback - create from basic payment fields
        return [{
          S_No: 1,
          Skill: paymentData.Skill || 'N/A',
          Skill_Type: paymentData.SkillType || 'N/A',
          Total_Man_hours: paymentData.TotalManhours || 'N/A',
          Total_Man_hours_Decimal: paymentData.TotalManhoursInDecimal || 0,
          Rate_per_hour: paymentData.Rateperhour || 0,
          Total_Amount: paymentData.TotalAmount || 0
        }];
      };

      const paymentDetailsData = getPaymentDetailsData();

      let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Report - ${paymentData.Organization || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; align-items: center; margin-bottom: 30px; }
            .logo-container { 
              display: flex; 
              align-items: center; 
              margin-right: 20px;
            }
            .logo-figures {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-right: 15px;
            }
            .figure-row {
              display: flex;
              justify-content: center;
              margin: 1px 0;
            }
            .human-figure {
              width: 16px;
              height: 20px;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .figure-head {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              margin-bottom: 2px;
            }
            .figure-body {
              width: 2px;
              height: 8px;
              background: currentColor;
            }
            .figure-arms {
              width: 12px;
              height: 2px;
              background: currentColor;
              position: absolute;
              top: 6px;
              left: 2px;
            }
            .figure-row:nth-child(1) .human-figure { color: #ff6b35; }
            .figure-row:nth-child(2) .human-figure { color: #ff8c42; }
            .figure-row:nth-child(3) .human-figure { color: #ffa726; }
            .figure-row:nth-child(1) { justify-content: center; }
            .figure-row:nth-child(2) { justify-content: space-around; width: 50px; }
            .figure-row:nth-child(3) { justify-content: space-around; width: 80px; }
            .logo-text {
              font-size: 18px;
              font-weight: bold;
              font-style: italic;
              background: linear-gradient(45deg, #ffa726, #ff6b35);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-top: 5px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
              margin-left: 20px;
            }
            .report-info { margin-bottom: 20px; }
            .report-info div { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { text-align: right; margin-top: 20px; }
            .summary div { margin: 5px 0; font-weight: bold; }
            .payment-details { margin: 20px 0; }
            .payment-details div { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <img src="${getImagePath()}" alt="Buildhr Logo" style="height:60px; margin-right:20px;" />
            </div>
            <div class="company-name">Buildhr Management consultants Pvt Ltd</div>
          </div>
          
          <div class="report-info">
            <div><strong>Report Generation Date:</strong> ${currentDate}</div>
            <div><strong>Organization:</strong> ${currentFormData.organization || paymentData.Organization || 'N/A'}</div>
            <div><strong>Contractor Name:</strong> ${getContractorName(currentFormData.contractor || paymentData.Contractors)}</div>
            <div><strong>Period (From & To date):</strong> ${formatDate(currentFormData.fromDate || paymentData.FromDate)} & ${formatDate(currentFormData.toDate || paymentData.ToDate)}</div>
            <div><strong>Transaction Type:</strong> ${currentFormData.transactionType || paymentData.TransactionType || 'N/A'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Skill</th>
                <th>Skill Type</th>
                <th>Rate per hour</th>
                <th>Total Man-hours</th>
                <th>Total Man-hours (In Decimal)</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Add payment details rows with actual data
      paymentDetailsData.forEach((detail) => {
        pdfContent += `
              <tr>
                <td>${detail.S_No}</td>
                <td>${detail.Skill}</td>
                <td>${detail.Skill_Type}</td>
                <td>₹${detail.Rate_per_hour}</td>
                <td>${detail.Total_Man_hours}</td>
                <td>${detail.Total_Man_hours_Decimal}</td>
                <td>₹${detail.Total_Amount}</td>
              </tr>
        `;
      });

      pdfContent += `
            </tbody>
          </table>
          
          <div class="summary">
            <div><strong>Grand Total:</strong> ₹${paymentData.GrandTotal || '0'}</div>
            <div><strong>IGST:</strong> ₹${paymentData.GST || '0'}</div>
            <div><strong>SGST:</strong> ₹${paymentData.SGST || '0'}</div>
            <div><strong>CGST:</strong> ₹${paymentData.CGST || '0'}</div>
            <div><strong>TDS:</strong> ₹${paymentData.TDS || '0'}</div>
            <div><strong>Net Payable:</strong> ₹${paymentData.NetPayable || '0'}</div>
          </div>
        </body>
        </html>
      `;

      return pdfContent;
    };

    const pdfContent = generateSinglePDFContent(payment);
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_${payment.Organization || 'report'}_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Generated PDF report for payment: ${payment.Organization || 'N/A'}`);
    alert(`Successfully generated PDF report for ${payment.Organization || 'payment'}`);
  };

  // Handle import payments from CSV
  const handleImportPayments = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target.result;
          const lines = csvContent.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          
          alert(`CSV file loaded successfully!\nHeaders: ${headers.join(', ')}\nTotal lines: ${lines.length - 1}`);
          
        } catch (error) {
          alert('Error reading CSV file: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };



  return (
    <>
      {/* CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Background Shapes */}
      <div className="dashboard-background">
        <div className="dashboard-floating-shape dashboard-shape-1"></div>
        <div className="dashboard-floating-shape dashboard-shape-2"></div>
        <div className="dashboard-floating-shape dashboard-shape-3"></div>
        <div className="dashboard-floating-shape dashboard-shape-4"></div>
        <div className="dashboard-floating-shape dashboard-shape-5"></div>
        <div className="dashboard-floating-shape dashboard-shape-6"></div>
      </div>

      <div className="dashboard-root">
        {/* Sidebar with Home page styling */}
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

        {/* Main Content with Home page styling */}
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

          {/* Payment Content */}
          <main className="cms-dashboard-content">
            {showPaymentForm ? (
              <form className="payment-form" onSubmit={isEditMode ? handleUpdatePayment : handleSubmit}>
                <div className="form-section">
                  <h2>{isEditMode ? 'Edit Payment' : 'Create New Payment'}</h2>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Organization</label>
                      <select name="organization" value={form.organization} onChange={handleFormChange}>
                        <option value="">-Select-</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.OrganizationName || org.Organization}>{org.OrganizationName || org.Organization}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Contractor *</label>
                      <select name="contractor" value={form.contractor} onChange={handleFormChange} required>
                        <option value="">-Select-</option>
                        {contractors.map(c => (
                          <option key={c.id} value={c.ContractorName}>{c.ContractorName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>From Date *</label>
                      <input 
                        type="date" 
                        name="fromDate" 
                        value={form.fromDate} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>To Date *</label>
                      <input 
                        type="date" 
                        name="toDate" 
                        value={form.toDate} 
                        onChange={handleFormChange} 
                        required 
                      />
                      {errors.toDate && <span className="error-message">{errors.toDate}</span>}
                    </div>
                    <div className="form-group">
                      <label>Transaction Type *</label>
                      <select name="transactionType" value={form.transactionType} onChange={handleFormChange} required>
                        {transactionTypes.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Payment Details</h3>
                  <table className="payment-details-table">
                    <thead>
                      <tr>
                        <th>S. No</th>
                        <th>Skill</th>
                        <th>Skill Type</th>
                        <th>Rate per hour</th>
                        <th>Total Man-hours</th>
                        <th>Total Man-hours (In Decimal)</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculating ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                              <div>Calculating payment details...</div>
                              <div style={{ width: '20px', height: '20px', border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                              This may take a few moments for large date ranges
                            </div>
                          </td>
                        </tr>
                      ) : paymentDetails.length > 0 ? (
                        paymentDetails.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.S_No || idx + 1}</td>
                            <td>{row.Skill}</td>
                            <td>{row.Skill_Type}</td>
                            <td>₹{row.Rate_per_hour?.toLocaleString() || '0'}</td>
                            <td>{row.Total || '0h 0m'}</td>
                            <td>{row.Total_Man_hours_In_Decimal?.toFixed(2) || '0.00'}</td>
                            <td>₹{row.Total_Amount?.toLocaleString() || '0'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                            Select contractor and dates to calculate payment details
                          </td>
                        </tr>
                      )}
                      
                      {paymentDetails.length > 0 && (
                        <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                          <td colSpan={4}>TOTAL</td>
                          <td>{paymentDetails.reduce((sum, row) => sum + (parseFloat(row.Total_Man_hours_In_Decimal) || 0), 0).toFixed(2)}</td>
                          <td>{paymentDetails.reduce((sum, row) => sum + (parseFloat(row.Total_Man_hours_In_Decimal) || 0), 0).toFixed(2)}</td>
                          <td>₹{paymentDetails.reduce((sum, row) => sum + (parseFloat(row.Total_Amount) || 0), 0).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="form-section">
                  <h3>Total Amount</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Grand Total</label>
                      <input value={totals.grandTotal} readOnly />
                    </div>
                    <div className="form-group">
                      <label>IGST@18%</label>
                      <input value={totals.igst} readOnly />
                    </div>
                    <div className="form-group">
                      <label>SGST@9%</label>
                      <input value={totals.sgst} readOnly />
                    </div>
                    <div className="form-group">
                      <label>CGST@9%</label>
                      <input value={totals.cgst} readOnly />
                    </div>
                    <div className="form-group">
                      <label>TDS 2%</label>
                      <input value={totals.tds} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Net Payable</label>
                      <input value={totals.netPayable} readOnly />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {isEditMode ? 'Update' : 'Submit'}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleReset}>Reset</button>
                  <button type="button" className="btn btn-secondary" onClick={isEditMode ? handleCancelEdit : () => setShowPaymentForm(false)}>
                    {isEditMode ? 'Cancel' : 'Back to List'}
                  </button>
                </div>
              </form>
            ) : (
              <div 
                className="payment-card-container" 
                style={{ 
                  background: 'var(--white)', 
                  borderRadius: '20px', 
                  boxShadow: '0 8px 30px var(--shadow-light)', 
                  padding: '30px', 
                  margin: '0', 
                  maxWidth: '100%', 
                  position: 'relative',
                  border: '1px solid rgba(37, 99, 235, 0.2)'
                }}
              >
                {/* Header and Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div className="payment-header-actions">
                    <div className="payment-title-section">
                      <h2 className="payment-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Landmark size={28} />
                        Payment Directory
                      </h2>
                      <p className="payment-subtitle">
                        Manage your organization's payment records efficiently
                      </p>
                    </div>
                  </div>
                  {/* Toolbar Buttons */}
                  <div className="payment-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      className="toolbar-btn import-btn"
                      onClick={handleImportPayments}
                      title="Import payments from CSV"
                      type="button"
                      style={{ 
                        background: '#fff', 
                        color: '#232323', 
                        border: 'none', 
                        fontWeight: 600, 
                        padding: '8px', 
                        borderRadius: '8px', 
                        width: '48px', 
                        height: '48px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(60,72,88,0.10)'
                      }}
                    >
                      <i className="fas fa-file-import" style={{ color: '#232323', fontSize: '1.2rem' }}></i>
                    </button>
                    <button
                      className="toolbar-btn export-btn"
                      onClick={handleExportPayments}
                      title="Export payments to CSV"
                      type="button"
                      style={{ 
                        background: '#fff', 
                        color: '#232323', 
                        border: 'none', 
                        fontWeight: 600, 
                        padding: '8px', 
                        borderRadius: '8px', 
                        width: '48px', 
                        height: '48px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(60,72,88,0.10)'
                      }}
                    >
                      <i className="fas fa-file-export" style={{ color: '#232323', fontSize: '1.2rem' }}></i>
                    </button>
                    <button
                      className="toolbar-btn"
                      onClick={() => {
                        console.log('Manual refresh triggered');
                        fetchPayments();
                      }}
                      title="Refresh data"
                      type="button"
                      style={{ 
                        background: '#fff', 
                        color: '#232323', 
                        border: 'none', 
                        fontWeight: 600, 
                        padding: '8px', 
                        borderRadius: '8px', 
                        width: '48px', 
                        height: '48px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(60,72,88,0.10)'
                      }}
                    >
                      <i className="fas fa-sync-alt" style={{ color: '#232323', fontSize: '1.2rem' }}></i>
                    </button>
                    <button
                      className="toolbar-btn filter-btn"
                      title="Search payments"
                      type="button"
                      style={{ 
                        background: '#fff', 
                        color: '#232323', 
                        border: 'none', 
                        fontWeight: 600, 
                        padding: '8px', 
                        borderRadius: '8px', 
                        width: '48px', 
                        height: '48px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(60,72,88,0.10)'
                      }}
                    >
                      <i className="fas fa-search" style={{ color: '#232323', fontSize: '1.2rem' }}></i>
                    </button>
                    <button
                      className="toolbar-btn add-btn"
                      onClick={() => {
                        setShowPaymentForm(true);
                        setIsEditMode(false);
                        setEditingPayment(null);
                        handleReset();
                      }}
                      title="Add new payment"
                      type="button"
                      style={{ 
                        background: '#fff', 
                        color: '#232323', 
                        border: 'none', 
                        fontWeight: 700, 
                        fontSize: '1.2rem', 
                        borderRadius: '8px', 
                        width: '48px', 
                        height: '48px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 2px 8px rgba(60,72,88,0.10)' 
                      }}
                    >
                      <i className="fas fa-plus" style={{ color: '#232323', fontSize: '1.5rem' }}></i>
                    </button>
                    {/* Delete button for selected payments - positioned after + button */}
                    {selectedPayments.length > 0 && (
                      <button
                        className="toolbar-btn delete-btn"
                        disabled={selectedPayments.length === 0}
                        onClick={handleDeletePayments}
                        title={`Delete ${selectedPayments.length} selected payment(s)`}
                        type="button"
                        style={{
                          background: '#fff',
                          color: '#d32f2f',
                          border: '2px solid #ffcdd2',
                          fontWeight: 700,
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          boxShadow: '0 2px 8px rgba(211,47,47,0.15)',
                        }}
                      >
                        <i className="fas fa-trash" style={{ color: '#d32f2f', fontSize: '1.2rem' }}></i>
                      </button>
                    )}
                  </div>
                </div>
                
                {loading ? (
                  <div className="payment-loader">Loading payments...</div>
                ) : (
                  <div className="payment-table-container">
                    <table className={`payment-table ${selectedPayments.length === 0 ? 'edit-column-hidden' : ''}`}>
                      <thead>
                        <tr>
                          <th>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedPayments.length === payments.length && payments.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPayments(payments.map(p => p.ROWID || p.id));
                                  } else {
                                    setSelectedPayments([]);
                                  }
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                            </div>
                          </th>
                          {selectedPayments.length > 0 && <th>Edit</th>}
                          <th>#</th>
                          <th>Organization</th>
                          <th>Contractor</th>
                          <th>From Date</th>
                          <th>To Date</th>
                          <th>Grand Total</th>
                          <th>IGST</th>
                          <th>SGST</th>
                          <th>CGST</th>
                          <th>TDS</th>
                          <th>Net Payable</th>
                          <th>Transaction Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length > 0 ? (
                          payments.map((payment, index) => (
                            <tr key={payment.ROWID || payment.id} className="clickable-row">
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={selectedPayments.includes(payment.ROWID || payment.id)} 
                                  onChange={() => handleSelectPayment(payment.ROWID || payment.id)} 
                                />
                              </td>
                              {selectedPayments.length > 0 && (
                                <td>
                                  {selectedPayments.includes(payment.ROWID || payment.id) && (
                                    <button
                                      className="btn btn-icon"
                                      onClick={() => handleEditPayment(payment)}
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                  )}
                                </td>
                              )}
                              <td>{index + 1}</td>
                              <td>{payment.Organization || 'N/A'}</td>
                              <td>{getContractorName(payment.Contractors)}</td>
                              <td>{formatDate(payment.FromDate)}</td>
                              <td>{formatDate(payment.ToDate)}</td>
                              <td>₹{payment.GrandTotal || '0'}</td>
                              <td>₹{payment.GST || '0'}</td>
                              <td>₹{payment.SGST || '0'}</td>
                              <td>₹{payment.CGST || '0'}</td>
                              <td>₹{payment.TDS || '0'}</td>
                              <td>₹{payment.NetPayable || '0'}</td>
                              <td>{payment.TransactionType || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectedPayments.length > 0 ? 15 : 14} className="text-center">
                              No payment records found. Click the + button to create a new payment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Payment;