import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Button from './Button';
import { 
  Users, Calendar, FileText, AlertTriangle, FolderOpen, 
  ClipboardList, Building, Handshake, Landmark, Clock, 
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon,
  Search, Edit, Trash2, X, Download, Upload, RefreshCw, Menu, Shield, AlertOctagon, CreditCard, FileSignature, Clock3
} from 'lucide-react';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import contractorImage from './assets/contractor.jfif';
import './App.css'; // For sidebar styling (Home page look)
import './employeeManagement.css'; // For Employee form styling
import './Organization.css';
import * as XLSX from 'xlsx';

function Organization({ userRole = 'App Administrator', setUserRole }) {
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [fetchState, setFetchState] = useState('init');
  const [fetchError, setFetchError] = useState('');
  const [selectedOrganizations, setSelectedOrganizations] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [selectedOrganizationDetails, setSelectedOrganizationDetails] = useState(null);
  const [form, setForm] = useState({
    organizationName: '',
    primaryName: '',
    designation: '',
    noOfContractorsEngaged: '',
    rcNo: '',
    primaryContact: '',
    secondaryContact: '',
    primaryEmail: '',
    secondaryEmail: '',
    registeredContractManPower: '',
    registeredAddressLine1: '',
    registeredAddressLine2: '',
    registeredCity: '',
    registeredState: '',
    factoryAddressLine1: '',
    factoryAddressLine2: '',
    factoryCity: '',
    factoryState: '',
    factoryPostalCode: '',
    factoryCountry: '',
    sameAsRegisteredAddress: false,
    postalCode: '',
    country: '',
    licenseAmendmentDate: '',
    amendmentNo: '',
    registrationCertificate: '',
    noOfLicensedManpower: '',
    primaryContactPerson: '',
    primaryContactPersonPhone: '',
    primaryContactPersonEmail: '',
    secondaryContactPerson: '',
    secondaryContactPersonPhone: '',
    secondaryContactPersonEmail: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [exportError, setExportError] = useState('');
  const fileInputRef = useRef(null);

  // Search functionality - Employee style
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Organization dropdown states
  const [organizationNames, setOrganizationNames] = useState([]);
  const [organizationNameSearch, setOrganizationNameSearch] = useState('');
  const [isOrganizationNameDropdownOpen, setIsOrganizationNameDropdownOpen] = useState(false);
  const [loadingOrganizationNames, setLoadingOrganizationNames] = useState(false);
  
  // Designation dropdown states
  const [designations, setDesignations] = useState([]);
  const [designationSearch, setDesignationSearch] = useState('');
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  
  const [searchFields, setSearchFields] = useState({
    // Basic Information
    organizationName: { enabled: false, selectedOrganization: '' },
    rcNo: { enabled: false, value: '' },
    
    // Contact Information
    primaryName: { enabled: false, value: '' },
    primaryContact: { enabled: false, value: '' },
    primaryEmail: { enabled: false, value: '' },
    secondaryContact: { enabled: false, value: '' },
    secondaryEmail: { enabled: false, value: '' },
    designation: { enabled: false, selectedDesignation: '' },
    
    // Business Information
    noOfContractorsEngaged: { enabled: false, value: '' },
    registeredContractManPower: { enabled: false, value: '' },
    noOfLicensedManpower: { enabled: false, value: '' },
    licenseAmendmentDate: { enabled: false, value: '' },
    amendmentNo: { enabled: false, value: '' },
    
    // Address Information - Registered
    registeredAddressLine1: { enabled: false, value: '' },
    registeredAddressLine2: { enabled: false, value: '' },
    registeredCity: { enabled: false, value: '' },
    registeredState: { enabled: false, value: '' },
    postalCode: { enabled: false, value: '' },
    country: { enabled: false, value: '' },
    
    // Address Information - Unit
    factoryAddressLine1: { enabled: false, value: '' },
    factoryAddressLine2: { enabled: false, value: '' },
    factoryCity: { enabled: false, value: '' },
    factoryState: { enabled: false, value: '' },
    factoryPostalCode: { enabled: false, value: '' },
    factoryCountry: { enabled: false, value: '' },
    
    // Contact Persons
    primaryContactPerson: { enabled: false, value: '' },
    primaryContactPersonPhone: { enabled: false, value: '' },
    primaryContactPersonEmail: { enabled: false, value: '' },
    secondaryContactPerson: { enabled: false, value: '' },
    secondaryContactPersonPhone: { enabled: false, value: '' },
    secondaryContactPersonEmail: { enabled: false, value: '' }
  });

  // Add state for dynamic business information rows
  const [businessInfoRows, setBusinessInfoRows] = useState([
    {
      id: 1,
      noOfContractorsEngaged: '',
      registeredContractManPower: '',
      noOfLicensedManpower: '',
      licenseAmendmentDate: '',
      amendmentNo: '',
    }
  ]);

  // Sidebar and navigation states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

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
    { icon: <Search size={22} />, label: 'Deduction', path: '/detection' },
  ];

  // Define searchable fields for organization search
  const searchableFields = [
    // Basic Information
    { label: 'Organization Name', field: 'organizationName' },
    { label: 'RC No', field: 'rcNo' },
    
    // Contact Information
    { label: 'Primary Name', field: 'primaryName' },
    { label: 'Primary Contact', field: 'primaryContact' },
    { label: 'Primary Email', field: 'primaryEmail' },
    { label: 'Secondary Contact', field: 'secondaryContact' },
    { label: 'Secondary Email', field: 'secondaryEmail' },
    { label: 'Designation', field: 'designation' },
    
    // Business Information
    { label: 'No of Contractors Engaged', field: 'noOfContractorsEngaged' },
    { label: 'Registered Contract Employees', field: 'registeredContractManPower' },
    { label: 'No of License', field: 'noOfLicensedManpower' },
    { label: 'License/Amendment Date', field: 'licenseAmendmentDate' },
    { label: 'Amendment No', field: 'amendmentNo' },
    
    // Address Information - Registered
    { label: 'Registered Address Line 1', field: 'registeredAddressLine1' },
    { label: 'Registered Address Line 2', field: 'registeredAddressLine2' },
    { label: 'Registered City', field: 'registeredCity' },
    { label: 'Registered State', field: 'registeredState' },
    { label: 'Postal Code', field: 'postalCode' },
    { label: 'Country', field: 'country' },
    
    // Address Information - Unit
    { label: 'Unit Address Line 1', field: 'factoryAddressLine1' },
    { label: 'Unit Address Line 2', field: 'factoryAddressLine2' },
    { label: 'Unit City', field: 'factoryCity' },
    { label: 'Unit State', field: 'factoryState' },
    { label: 'Unit Postal Code', field: 'factoryPostalCode' },
    { label: 'Unit Country', field: 'factoryCountry' },
    
    // Contact Persons
    { label: 'Primary Contact Person', field: 'primaryContactPerson' },
    { label: 'Primary Contact Person Phone', field: 'primaryContactPersonPhone' },
    { label: 'Primary Contact Person Email', field: 'primaryContactPersonEmail' },
    { label: 'Secondary Contact Person', field: 'secondaryContactPerson' },
    { label: 'Secondary Contact Person Phone', field: 'secondaryContactPersonPhone' },
    { label: 'Secondary Contact Person Email', field: 'secondaryContactPersonEmail' }
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

  // Move API base URL to environment variable or config
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/server/Organization_function';

  // Filter organizations based on search criteria - Employee style
  const filteredData = useMemo(() => {
    const hasActiveFilters = Object.values(searchFields).some(
      field => field.enabled
    );

    if (!hasActiveFilters) {
      return organizations;
    }

    return organizations.filter((org) => {
      if (!org || typeof org !== 'object') return false;
      return searchableFields.every(({ field }) => {
        const fieldData = searchFields[field];
        if (!fieldData.enabled) return true;

        // Handle organization name dropdown selection
        if (field === 'organizationName') {
          const { selectedOrganization } = fieldData;
          if (!selectedOrganization) return true;
          return org[field] === selectedOrganization;
        }

        // Handle designation dropdown selection
        if (field === 'designation') {
          const { selectedDesignation } = fieldData;
          if (!selectedDesignation) return true;
          return org[field] === selectedDesignation;
        }

        // Handle different field types
        const orgValue = (org[field] || '').toString().toLowerCase();
        const searchValue = (fieldData.value || '').toString().toLowerCase();

        if (!searchValue) return true;

        // For date fields, handle date comparison
        if (field === 'licenseAmendmentDate') {
          if (!org[field] || !fieldData.value) return true;
          return org[field] === fieldData.value;
        }

        // For numeric fields, handle numeric comparison
        if (['noOfContractorsEngaged', 'registeredContractManPower', 'noOfLicensedManpower'].includes(field)) {
          const orgNum = parseFloat(org[field]) || 0;
          const searchNum = parseFloat(fieldData.value) || 0;
          return orgNum === searchNum;
        }

        // For text fields, use contains search
        return orgValue.includes(searchValue);
      });
    });
  }, [organizations, searchFields]);

  useEffect(() => {
    setFilteredOrganizations(filteredData);
  }, [filteredData]);

  const fetchOrganizations = useCallback(() => {
    setFetchState('loading');
    setFetchError('');
    axios
      .get(`${API_BASE_URL}/organizations`, { params: { page: 1, perPage: 50 }, timeout: 5000 })
      .then((response) => {
        if (!response?.data?.data?.organizations) {
          throw new Error('Unexpected API response structure');
        }
        const fetchedOrganizations = response.data.data.organizations || [];
        if (!Array.isArray(fetchedOrganizations)) {
          throw new Error('Organizations data is not an array');
        }
        setOrganizations(fetchedOrganizations);
        setFilteredOrganizations(fetchedOrganizations);
        setFetchState('fetched');
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Failed to fetch organizations. Please try again later.';
        setFetchError(errorMessage);
        setFetchState('error');
        console.error('Fetch organizations error:', err);
      });
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const validateForm = () => {
    const errors = [];
    if (!form.organizationName.trim()) errors.push('Organization Name is required.');
    
    // Enhanced email validation for primary email
    if (form.primaryEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(form.primaryEmail)) {
        errors.push('Primary Email must be in a valid format (e.g., example@domain.com).');
      }
    }
    
    // Enhanced phone validation for primary contact - 10 digits only
    if (form.primaryContact) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.primaryContact.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Primary Contact must be exactly 10 digits.');
      }
    }
    
    // Validate secondary email if provided
    if (form.secondaryEmail && form.secondaryEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(form.secondaryEmail)) {
        errors.push('Secondary Email must be in a valid format (e.g., example@domain.com).');
      }
    }
    
    // Validate secondary contact if provided - 10 digits only
    if (form.secondaryContact && form.secondaryContact.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.secondaryContact.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Secondary Contact must be exactly 10 digits.');
      }
    }
    
    // Validate contact person fields if provided - 10 digits only
    if (form.primaryContactPersonPhone && form.primaryContactPersonPhone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.primaryContactPersonPhone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Primary Contact Person Phone must be exactly 10 digits.');
      }
    }
    
    if (form.primaryContactPersonEmail && form.primaryContactPersonEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(form.primaryContactPersonEmail)) {
        errors.push('Primary Contact Person Email must be in a valid format (e.g., example@domain.com).');
      }
    }
    
    if (form.secondaryContactPersonPhone && form.secondaryContactPersonPhone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(form.secondaryContactPersonPhone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Secondary Contact Person Phone must be exactly 10 digits.');
      }
    }
    
    if (form.secondaryContactPersonEmail && form.secondaryContactPersonEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(form.secondaryContactPersonEmail)) {
        errors.push('Secondary Contact Person Email must be in a valid format (e.g., example@domain.com).');
      }
    }
    
    if (form.registeredAddressLine1.trim() === '' && !form.sameAsRegisteredAddress) {
      errors.push('Registered Address Line 1 is required.');
    }

    // Validate business information rows
    businessInfoRows.forEach((row, index) => {
      // No mandatory validations for business information fields
    });

    if (errors.length > 0) {
      setFormError(errors.join(', '));
      return false;
    }
    return true;
  };

  const saveOrganization = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setFormError('');

    // Send all form data to the backend
    const dataToSend = {};
   
    // Handle sameAsRegisteredAddress checkbox - copy registered address to factory address if checked
    let processedForm = { ...form };
    if (form.sameAsRegisteredAddress) {
      processedForm.factoryAddressLine1 = form.registeredAddressLine1;
      processedForm.factoryAddressLine2 = form.registeredAddressLine2;
      processedForm.factoryCity = form.registeredCity;
      processedForm.factoryState = form.registeredState;
    }
   
    // Define numeric fields that need special handling
    const numericFields = ['noOfContractorsEngaged', 'registeredContractManPower', 'noOfLicensedManpower'];
   
    // Only include fields that have actual data (not empty strings)
    Object.keys(processedForm).forEach(key => {
      const value = processedForm[key];
      // Skip sameAsRegisteredAddress as it's not a database column
      if (key === 'sameAsRegisteredAddress') return;
      // Skip registrationCertificate as it's a file upload field
      if (key === 'registrationCertificate') return;
     
      if (value !== null && value !== undefined && value !== '') {
        if (numericFields.includes(key)) {
          // Handle numeric fields - convert string to number if valid
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            dataToSend[key] = numValue;
          }
        } else if (typeof value === 'string' && value.trim() !== '') {
          dataToSend[key] = value.trim();
        } else if (typeof value === 'boolean') {
          dataToSend[key] = value;
        } else if (typeof value === 'number') {
          dataToSend[key] = value;
        }
      }
    });

    // Add business information rows to the data
    dataToSend.businessInfoRows = businessInfoRows.map(row => ({
      noOfContractorsEngaged: row.noOfContractorsEngaged ? Number(row.noOfContractorsEngaged) : null,
      registeredContractManPower: row.registeredContractManPower ? Number(row.registeredContractManPower) : null,
      noOfLicensedManpower: row.noOfLicensedManpower ? Number(row.noOfLicensedManpower) : null,
      licenseAmendmentDate: row.licenseAmendmentDate,
      amendmentNo: row.amendmentNo.trim(),
    }));

    const request = editingOrganization
      ? axios.put(`${API_BASE_URL}/organizations/${editingOrganization.id}`, dataToSend, { timeout: 5000 })
      : axios.post(`${API_BASE_URL}/organizations`, dataToSend, { timeout: 5000 });

    request
      .then((response) => {
        if (!response?.data?.data?.organization) {
          throw new Error('Unexpected API response structure');
        }
        fetchOrganizations();
        setSuccess(editingOrganization ? 'Organization updated successfully!' : 'Organization added successfully!');
        setTimeout(() => setSuccess(''), 3000);
        resetForm();
        setShowForm(false);
        setEditingOrganization(null);
      })
      .catch((err) => {
        const serverError = err.response?.data?.message || (editingOrganization ? 'Failed to update organization.' : 'Failed to add organization.');
        setFormError(serverError);
        console.error('Save organization error:', err);
      })
      .finally(() => setSubmitting(false));
  }, [form, editingOrganization, validateForm, fetchOrganizations, API_BASE_URL, businessInfoRows]);

  const handleEdit = (organization) => {
    const sanitize = (value) => value || '';
    setForm({
      organizationName: sanitize(organization.organizationName),
      primaryName: sanitize(organization.primaryName),
      designation: sanitize(organization.designation),
      noOfContractorsEngaged: sanitize(organization.noOfContractorsEngaged),
      rcNo: sanitize(organization.rcNo),
      primaryContact: sanitize(organization.primaryContact),
      secondaryContact: sanitize(organization.secondaryContact),
      primaryEmail: sanitize(organization.primaryEmail),
      secondaryEmail: sanitize(organization.secondaryEmail),
      registeredContractManPower: sanitize(organization.registeredContractManPower),
      registeredAddressLine1: sanitize(organization.registeredAddressLine1),
      registeredAddressLine2: sanitize(organization.registeredAddressLine2),
      registeredCity: sanitize(organization.registeredCity),
      registeredState: sanitize(organization.registeredState),
      factoryAddressLine1: sanitize(organization.factoryAddressLine1),
      factoryAddressLine2: sanitize(organization.factoryAddressLine2),
      factoryCity: sanitize(organization.factoryCity),
      factoryState: sanitize(organization.factoryState),
      factoryPostalCode: sanitize(organization.factoryPostalCode),
      factoryCountry: sanitize(organization.factoryCountry),
      sameAsRegisteredAddress: organization.sameAsRegisteredAddress || false,
      postalCode: sanitize(organization.postalCode),
      country: sanitize(organization.country),
      licenseAmendmentDate: sanitize(organization.licenseAmendmentDate),
      amendmentNo: sanitize(organization.amendmentNo),
      registrationCertificate: sanitize(organization.registrationCertificate),
      noOfLicensedManpower: sanitize(organization.noOfLicensedManpower),
      primaryContactPerson: sanitize(organization.primaryContactPerson),
      primaryContactPersonPhone: sanitize(organization.primaryContactPersonPhone),
      primaryContactPersonEmail: sanitize(organization.primaryContactPersonEmail),
      secondaryContactPerson: sanitize(organization.secondaryContactPerson),
      secondaryContactPersonPhone: sanitize(organization.secondaryContactPersonPhone),
      secondaryContactPersonEmail: sanitize(organization.secondaryContactPersonEmail),
    });

    // Handle business information rows for editing
    if (organization.businessInfoRows && organization.businessInfoRows.length > 0) {
      setBusinessInfoRows(organization.businessInfoRows.map((row, index) => ({
        id: index + 1,
        noOfContractorsEngaged: sanitize(row.noOfContractorsEngaged),
        registeredContractManPower: sanitize(row.registeredContractManPower),
        noOfLicensedManpower: sanitize(row.noOfLicensedManpower),
        licenseAmendmentDate: sanitize(row.licenseAmendmentDate),
        amendmentNo: sanitize(row.amendmentNo),
      })));
    } else {
      // If no business info rows exist, create one with the old single values
      setBusinessInfoRows([{
        id: 1,
        noOfContractorsEngaged: sanitize(organization.noOfContractorsEngaged),
        registeredContractManPower: sanitize(organization.registeredContractManPower),
        noOfLicensedManpower: sanitize(organization.noOfLicensedManpower),
        licenseAmendmentDate: sanitize(organization.licenseAmendmentDate),
        amendmentNo: sanitize(organization.amendmentNo),
      }]);
    }

    setEditingOrganization(organization);
    setShowForm(true);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (organizationId) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    setDeleting(true);
    axios.delete(`${API_BASE_URL}/organizations/${organizationId}`, { timeout: 5000 })
      .then(() => {
        fetchOrganizations();
        setSuccess('Organization deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Failed to delete organization. Please try again.';
        setFormError(errorMessage);
        console.error('Delete organization error:', err);
      })
      .finally(() => setDeleting(false));
  };

  const handleDeleteSelected = () => {
    if (selectedOrganizations.size === 0) {
      setFormError('Please select at least one organization to delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedOrganizations.size} organization(s)?`)) {
      return;
    }

    const selectedCount = selectedOrganizations.size;
    setDeleting(true);
    setFormError('');

    Promise.all(
      Array.from(selectedOrganizations).map((id) =>
        axios.delete(`${API_BASE_URL}/organizations/${id}`, { timeout: 5000 }).catch((err) => {
          const errorMessage = err.response?.data?.message || `Failed to delete organization (ID: ${id})`;
          console.error(`Mass delete error for ID ${id}:`, err);
          return { error: errorMessage, id };
        })
      )
    )
      .then((results) => {
        const failedDeletions = results.filter((result) => result?.error);
        if (failedDeletions.length > 0) {
          setFormError(
            'Failed to delete some organizations: ' +
            failedDeletions.map((f) => `ID ${f.id}: ${f.error}`).join('; ')
          );
        }
        fetchOrganizations();
        setSelectedOrganizations(new Set());
        setSuccess(`Successfully deleted ${selectedCount} organization(s)!`);
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((err) => {
        setFormError('An unexpected error occurred while deleting organizations.');
        console.error('Mass delete error:', err);
      })
      .finally(() => setDeleting(false));
  };

  const toggleAllOrganizationsSelection = () => {
    if (selectedOrganizations.size === organizations.length) {
      setSelectedOrganizations(new Set());
    } else {
      setSelectedOrganizations(new Set(organizations.map(org => org.id)));
    }
  };

  const toggleOrganizationSelection = (organizationId) => {
    const newSelected = new Set(selectedOrganizations);
    if (newSelected.has(organizationId)) {
      newSelected.delete(organizationId);
    } else {
      newSelected.add(organizationId);
    }
    setSelectedOrganizations(newSelected);
  };

  const handleCardClick = (organization) => {
    setSelectedOrganizationDetails(organization);
  };

  const closeDetailsCard = () => {
    setSelectedOrganizationDetails(null);
  };

  const resetForm = () => {
    setForm({
      organizationName: '',
      primaryName: '',
      designation: '',
      noOfContractorsEngaged: '',
      rcNo: '',
      primaryContact: '',
      secondaryContact: '',
      primaryEmail: '',
      secondaryEmail: '',
      registeredContractManPower: '',
      registeredAddressLine1: '',
      registeredAddressLine2: '',
      registeredCity: '',
      registeredState: '',
      factoryAddressLine1: '',
      factoryAddressLine2: '',
      factoryCity: '',
      factoryState: '',
      factoryPostalCode: '',
      factoryCountry: '',
      sameAsRegisteredAddress: false,
      postalCode: '',
      country: '',
      licenseAmendmentDate: '',
      amendmentNo: '',
      registrationCertificate: '',
      noOfLicensedManpower: '',
      primaryContactPerson: '',
      primaryContactPersonPhone: '',
      primaryContactPersonEmail: '',
      secondaryContactPerson: '',
      secondaryContactPersonPhone: '',
      secondaryContactPersonEmail: '',
    });
    setBusinessInfoRows([
      {
        id: 1,
        noOfContractorsEngaged: '',
        registeredContractManPower: '',
        noOfLicensedManpower: '',
        licenseAmendmentDate: '',
        amendmentNo: '',
      }
    ]);
    setFormError('');
  };

  // Functions to handle dynamic business information rows
  const addBusinessInfoRow = () => {
    const newId = Math.max(...businessInfoRows.map(row => row.id), 0) + 1;
    setBusinessInfoRows(prev => [
      ...prev,
      {
        id: newId,
        noOfContractorsEngaged: '',
        registeredContractManPower: '',
        noOfLicensedManpower: '',
        licenseAmendmentDate: '',
        amendmentNo: '',
      }
    ]);
  };

  const removeBusinessInfoRow = (id) => {
    if (businessInfoRows.length > 1) {
      setBusinessInfoRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const updateBusinessInfoRow = (id, field, value) => {
    setBusinessInfoRows(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingOrganization(null);
    resetForm();
  };

  // Search field handlers - Employee style
  const handleFieldToggle = useCallback((field) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: field === 'organizationName'
        ? { ...prev[field], enabled: !prev[field].enabled, selectedOrganization: !prev[field].enabled ? prev[field].selectedOrganization : '' }
        : field === 'designation'
        ? { ...prev[field], enabled: !prev[field].enabled, selectedDesignation: !prev[field].enabled ? prev[field].selectedDesignation : '' }
        : { ...prev[field], enabled: !prev[field].enabled, value: !prev[field].enabled ? prev[field].value : '' },
    }));
  }, []);

  const handleSearchValueChange = useCallback((field, value) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: field === 'organizationName' 
        ? { ...prev[field], selectedOrganization: value }
        : field === 'designation'
        ? { ...prev[field], selectedDesignation: value }
        : { ...prev[field], value },
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const clearedFields = {};
    Object.keys(searchFields).forEach(field => {
      if (field === 'organizationName') {
        clearedFields[field] = { enabled: false, selectedOrganization: '' };
      } else if (field === 'designation') {
        clearedFields[field] = { enabled: false, selectedDesignation: '' };
      } else {
        clearedFields[field] = { enabled: false, value: '' };
      }
    });
    setSearchFields(clearedFields);
  }, [searchFields]);

  // Fetch organization names for dropdown
  const fetchOrganizationNames = useCallback(async () => {
    if (organizationNames.length > 0) return; // Already fetched
    
    setLoadingOrganizationNames(true);
    try {
      console.log('Fetching organization names from:', `${API_BASE_URL}/organizations`);
      const response = await axios.get(`${API_BASE_URL}/organizations`, { 
        params: { page: 1, perPage: 1000 }, 
        timeout: 5000 
      });
      
      console.log('API Response:', response.data);
      
      if (response?.data?.data?.organizations) {
        const names = response.data.data.organizations
          .map(org => org.organizationName)
          .filter(name => name && name.trim() !== '')
          .sort();
        console.log('Extracted organization names:', names);
        setOrganizationNames([...new Set(names)]); // Remove duplicates
      } else {
        console.log('No organizations found in response or unexpected structure');
        // Try to use the existing organizations state as fallback
        if (organizations.length > 0) {
          const names = organizations
            .map(org => org.organizationName)
            .filter(name => name && name.trim() !== '')
            .sort();
          console.log('Using existing organizations state:', names);
          setOrganizationNames([...new Set(names)]);
        }
      }
    } catch (error) {
      console.error('Error fetching organization names:', error);
      // Fallback to existing organizations state
      if (organizations.length > 0) {
        const names = organizations
          .map(org => org.organizationName)
          .filter(name => name && name.trim() !== '')
          .sort();
        console.log('Using existing organizations as fallback:', names);
        setOrganizationNames([...new Set(names)]);
      }
    } finally {
      setLoadingOrganizationNames(false);
    }
  }, [API_BASE_URL, organizationNames.length, organizations]);

  // Filter organization names based on search
  const filteredOrganizationNames = organizationNames.filter(name => 
    name.toLowerCase().includes(organizationNameSearch.toLowerCase())
  );

  // Filter designations based on search
  const filteredDesignations = designations.filter(designation => 
    designation.toLowerCase().includes(designationSearch.toLowerCase())
  );

  // Initialize organization names from existing organizations when they're available
  useEffect(() => {
    if (organizations.length > 0 && organizationNames.length === 0) {
      const names = organizations
        .map(org => org.organizationName)
        .filter(name => name && name.trim() !== '')
        .sort();
      console.log('Initializing organization names from existing data:', names);
      setOrganizationNames([...new Set(names)]);
    }
  }, [organizations, organizationNames.length]);

  // Fetch designations for dropdown
  const fetchDesignations = useCallback(async () => {
    console.log('fetchDesignations called');
    console.log('Current designations length:', designations.length);
    console.log('Current organizations length:', organizations.length);
    
    // Always try to fetch from existing organizations first
    if (organizations.length > 0) {
      const designationList = organizations
        .map(org => org.designation)
        .filter(designation => designation && designation.trim() !== '')
        .sort();
      console.log('Extracting designations from existing organizations:', designationList);
      if (designationList.length > 0) {
        setDesignations([...new Set(designationList)]);
        return;
      }
    }
    
    if (designations.length > 0) return; // Already fetched
    
    setLoadingDesignations(true);
    try {
      console.log('Fetching designations from API:', `${API_BASE_URL}/organizations`);
      const response = await axios.get(`${API_BASE_URL}/organizations`, { 
        params: { page: 1, perPage: 1000 }, 
        timeout: 5000 
      });
      
      console.log('API Response for designations:', response.data);
      
      if (response?.data?.data?.organizations) {
        const designationList = response.data.data.organizations
          .map(org => org.designation)
          .filter(designation => designation && designation.trim() !== '')
          .sort();
        console.log('Extracted designations from API:', designationList);
        setDesignations([...new Set(designationList)]); // Remove duplicates
      } else {
        console.log('No designations found in API response or unexpected structure');
      }
    } catch (error) {
      console.error('Error fetching designations from API:', error);
    } finally {
      setLoadingDesignations(false);
    }
  }, [API_BASE_URL, designations.length, organizations]);

  // Initialize designations from existing organizations when they're available
  useEffect(() => {
    console.log('Designation initialization effect triggered');
    console.log('Organizations length:', organizations.length);
    console.log('Designations length:', designations.length);
    
    if (organizations.length > 0) {
      const designationList = organizations
        .map(org => org.designation)
        .filter(designation => designation && designation.trim() !== '')
        .sort();
      console.log('Initializing designations from existing data:', designationList);
      if (designationList.length > 0) {
        setDesignations([...new Set(designationList)]);
      }
    }
  }, [organizations]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOrganizationNameDropdownOpen && !event.target.closest('[data-dropdown="organization"]')) {
        setIsOrganizationNameDropdownOpen(false);
      }
      if (isDesignationDropdownOpen && !event.target.closest('[data-dropdown="designation"]')) {
        setIsDesignationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOrganizationNameDropdownOpen, isDesignationDropdownOpen]);

  // Create dropdown UI for organization name
  const createOrganizationDropdownUI = () => {
    return (
      <div style={{ position: 'relative', width: '100%' }} data-dropdown="organization">
        <input
          type="text"
          placeholder="Search organization name..."
          value={organizationNameSearch}
          onChange={(e) => {
            setOrganizationNameSearch(e.target.value);
            setIsOrganizationNameDropdownOpen(true);
          }}
          onFocus={(e) => {
            setIsOrganizationNameDropdownOpen(true);
            fetchOrganizationNames();
            e.target.style.borderColor = '#3B82F6';
          }}
          style={{
            padding: '10px 12px',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        
        {isOrganizationNameDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {loadingOrganizationNames ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                Loading organizations...
              </div>
            ) : filteredOrganizationNames.length > 0 ? (
              filteredOrganizationNames.map((name, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleSearchValueChange('organizationName', name);
                    setOrganizationNameSearch(name);
                    setIsOrganizationNameDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {name}
                </div>
              ))
            ) : organizationNames.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                No organizations available. Please add some organizations first.
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                No organizations match your search
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Create dropdown UI for designation
  const createDesignationDropdownUI = () => {
    console.log('Creating designation dropdown UI');
    console.log('Current designations:', designations);
    console.log('Filtered designations:', filteredDesignations);
    console.log('Loading designations:', loadingDesignations);
    console.log('Is dropdown open:', isDesignationDropdownOpen);
    
    return (
      <div style={{ position: 'relative', width: '100%' }} data-dropdown="designation">
        <input
          type="text"
          placeholder="Search designation..."
          value={designationSearch}
          onChange={(e) => {
            setDesignationSearch(e.target.value);
            setIsDesignationDropdownOpen(true);
          }}
          onFocus={(e) => {
            console.log('Designation input focused, fetching designations...');
            setIsDesignationDropdownOpen(true);
            fetchDesignations();
            e.target.style.borderColor = '#3B82F6';
          }}
          style={{
            padding: '10px 12px',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        
        {isDesignationDropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {loadingDesignations ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                Loading designations...
              </div>
            ) : filteredDesignations.length > 0 ? (
              filteredDesignations.map((designation, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleSearchValueChange('designation', designation);
                    setDesignationSearch(designation);
                    setIsDesignationDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  {designation}
                </div>
              ))
            ) : designations.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                <div>No designations available.</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Debug: Organizations: {organizations.length}, Designations: {designations.length}
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                No designations match your search
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const countryOptions = [
    { value: '', label: '-Select-' },
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'USA' },
    { value: 'UK', label: 'UK' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
  ];

  const onChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    console.log('onChange triggered:', { name, value, type, checked }); // Debug log
    
    // Special handling for checkbox to ensure it's working
    if (name === 'sameAsRegisteredAddress') {
      console.log('Checkbox clicked! Current state:', checked);
      alert(`Checkbox clicked! New state: ${checked}`); // Temporary alert to test
    }
    
    setForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
     
      // Handle "Same as Registered Address" checkbox
      if (name === 'sameAsRegisteredAddress') {
        console.log('Checkbox changed:', checked); // Debug log
        if (checked) {
          // Copy registered address to factory address
          updatedForm.factoryAddressLine1 = prev.registeredAddressLine1;
          updatedForm.factoryAddressLine2 = prev.registeredAddressLine2;
          updatedForm.factoryCity = prev.registeredCity;
          updatedForm.factoryState = prev.registeredState;
          updatedForm.factoryPostalCode = prev.postalCode;
          updatedForm.factoryCountry = prev.country;
          console.log('Copied address data:', {
            factoryAddressLine1: updatedForm.factoryAddressLine1,
            factoryAddressLine2: updatedForm.factoryAddressLine2,
            factoryCity: updatedForm.factoryCity,
            factoryState: updatedForm.factoryState,
            factoryPostalCode: updatedForm.factoryPostalCode,
            factoryCountry: updatedForm.factoryCountry
          }); // Debug log
        }
      }
     
      // If "Same as Registered Address" is checked and registered address fields are being updated,
      // automatically copy them to factory address fields
      if (updatedForm.sameAsRegisteredAddress &&
          (name === 'registeredAddressLine1' || name === 'registeredAddressLine2' ||
           name === 'registeredCity' || name === 'registeredState' || 
           name === 'postalCode' || name === 'country')) {
       
        if (name === 'registeredAddressLine1') {
          updatedForm.factoryAddressLine1 = value;
        } else if (name === 'registeredAddressLine2') {
          updatedForm.factoryAddressLine2 = value;
        } else if (name === 'registeredCity') {
          updatedForm.factoryCity = value;
        } else if (name === 'registeredState') {
          updatedForm.factoryState = value;
        } else if (name === 'postalCode') {
          updatedForm.factoryPostalCode = value;
        } else if (name === 'country') {
          updatedForm.factoryCountry = value;
        }
      }
     
      return updatedForm;
    });
    setFormError('');
  }, []);

  const handleImport = useCallback((event) => {
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

    const reader = new FileReader();
    reader.onload = (e) => {
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

        // Process the data and import
        // This is a simplified version - you may need to add more validation
        Promise.all(
          jsonData.map((row, index) =>
            axios.post(`${API_BASE_URL}/organizations`, row, { timeout: 5000 })
              .then(response => response.data.data.organization)
              .catch(err => {
                const errorMessage = err.response?.data?.message || `Failed to import row ${index + 2}`;
                console.error(`Import error for organization at row ${index + 2}:`, row, err);
                return { error: errorMessage, row: index + 2 };
              })
          )
        )
          .then(results => {
            const successfulImports = results.filter(result => !result?.error);
            const failedImports = results.filter(result => result?.error);
            if (successfulImports.length === 0) {
              setImportError('Failed to import any organizations. See errors below.');
            } else {
              fetchOrganizations();
              if (failedImports.length > 0) {
                setImportError(
                  `Imported ${successfulImports.length} out of ${jsonData.length} organizations. Failed rows: ` +
                  failedImports.map(f => `Row ${f.row}: ${f.error}`).join('; ')
                );
              }
            }
          })
          .catch(err => {
            setImportError(err.message || 'An error occurred while importing organizations.');
            console.error('Import error:', err);
          })
          .finally(() => {
            setImporting(false);
            fileInputRef.current.value = '';
          });
      } catch (err) {
        setImportError(err.message || 'Failed to parse Excel file.');
        console.error('Excel parse error:', err);
        setImporting(false);
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read the Excel file.');
      setImporting(false);
      fileInputRef.current.value = '';
    };

    reader.readAsArrayBuffer(file);
  }, [fetchOrganizations, API_BASE_URL]);

  const handleExport = useCallback(() => {
    if (filteredOrganizations.length === 0) {
      setExportError('No data to export.');
      return;
    }

    setExporting(true);
    setExportError('');

    try {
      const exportData = filteredOrganizations.map(org => ({
        'Organization Name': org.organizationName || '',
        'Primary Name': org.primaryName || '',
        'RC No': org.rcNo || '',
        'Designation': org.designation || '',
        'Primary Contact': org.primaryContact || '',
        'Secondary Contact': org.secondaryContact || '',
        'Primary Email': org.primaryEmail || '',
        'Secondary Email': org.secondaryEmail || '',
        'No of Contractors Engaged': org.noOfContractorsEngaged || '',
        'Registered Contract Employees': org.registeredContractManPower || '',
        'Registered Address Line 1': org.registeredAddressLine1 || '',
        'Registered Address Line 2': org.registeredAddressLine2 || '',
        'Registered City': org.registeredCity || '',
        'Registered State': org.registeredState || '',
        'Postal Code': org.postalCode || '',
        'Country': org.country || '',
        'Factory Address Line 1': org.factoryAddressLine1 || '',
        'Factory Address Line 2': org.factoryAddressLine2 || '',
        'Factory City': org.factoryCity || '',
        'Factory State': org.factoryState || '',
        'Same as Registered Address': org.sameAsRegisteredAddress ? 'true' : 'false',
        'Primary Contact Person': org.primaryContactPerson || '',
        'Secondary Contact Person': org.secondaryContactPerson || '',
        'Primary Contact Person Phone': org.primaryContactPersonPhone || '',
        'Secondary Contact Person Phone': org.secondaryContactPersonPhone || '',
        'Primary Contact Person Email': org.primaryContactPersonEmail || '',
        'Secondary Contact Person mail': org.secondaryContactPersonEmail || '',
        'License/Amendment Date': org.licenseAmendmentDate || '',
        'Amendment No': org.amendmentNo || '',
        'Registration Certificate': org.registrationCertificate || '',
        'No of License': org.noOfLicensedManpower || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Organizations');

      XLSX.writeFile(workbook, 'organizations_export.xlsx');
    } catch (err) {
      const errorMessage = err.message || 'Failed to export data to Excel. Please try again.';
      setExportError(errorMessage);
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [filteredOrganizations]);

  // User info
  const userAvatar = "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150";
  const userName = userRole === 'App Administrator' ? 'Admin User' : 'App User';

  // Sample activity data with Lucide icons
  const recentActivities = [
    { icon: <User size={20} />, title: 'New Organization Added', description: 'ABC Corp joined the system', time: '2 hours ago' },
    { icon: <BarChart3 size={20} />, title: 'Monthly Report Generated', description: 'Organization performance report is ready', time: '4 hours ago' },
    { icon: <CheckCircle size={20} />, title: 'Contract Approved', description: 'XYZ Ltd contract approved', time: '6 hours ago' },
    { icon: <Bell size={20} />, title: 'System Update', description: 'Contractor Management System updated to version 2.1', time: '1 day ago' },
    { icon: <Plus size={20} />, title: 'New Application', description: 'Organization applied for registration', time: '2 days ago' }
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

          {/* Dashboard Content */}
          <main className="cms-dashboard-content">
            {/* Organization Management Section */}
            <div className="organization-management-section">
              {/* Header Actions */}
              <div className="organization-header-actions">
                <div className="organization-title-section">
                  <h2 className="organization-title">
                    <Building size={28} />
                    Organization Directory
                  </h2>
                  <p className="organization-subtitle">
                  Manage your organization's details efficiently
                </p>
              </div>
              
                             <div className="organization-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                 <button
                   className="toolbar-btn import-btn"
                   onClick={() => fileInputRef.current.click()}
                   disabled={importing}
                   title="Import organizations from Excel"
                   type="button"
                   style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 >
                   {importing ? (
                     <div className="btn-loader">
                       <div className="cms-spinner"></div>
                     </div>
                   ) : (
                     <i className="fas fa-file-import" style={{ color: '#232323' }}></i>
                   )}
                 </button>

                 <button
                   className="toolbar-btn export-btn"
                   onClick={handleExport}
                   disabled={exporting}
                   title="Export filtered organizations to Excel"
                   type="button"
                   style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 >
                   {exporting ? (
                     <div className="btn-loader">
                       <div className="cms-spinner"></div>
                     </div>
                   ) : (
                     <i className="fas fa-file-export" style={{ color: '#232323' }}></i>
                   )}
                 </button>

                 <button
                   className="toolbar-btn filter-btn"
                   onClick={() => setShowSearchDropdown(true)}
                   title="Show search options"
                   type="button"
                   style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 >
                   <i className="fas fa-filter" style={{ color: '#232323' }}></i>
                 </button>

                 <button
                   className="toolbar-btn"
                   onClick={() => {
                     setShowForm(true);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                   type="button"
                   title="Add new organization"
                   style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 700, fontSize: '1.2rem', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(60,72,88,0.10)' }}
                 >
                   <i className="fas fa-plus" style={{ color: '#232323', fontSize: '1.5rem' }}></i>
                 </button>

                 {/* Delete button for selected organizations - positioned after + button */}
                 {selectedOrganizations.size > 0 && (
                   <button
                     className="toolbar-btn delete-selected-btn"
                     onClick={handleDeleteSelected}
                     disabled={deleting}
                     title="Delete selected organizations"
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
                     {deleting ? (
                       <div className="btn-loader">
                         <div className="cms-spinner"></div>
                       </div>
                     ) : (
                       <i className="fas fa-trash" style={{ color: '#d32f2f', fontSize: '1.2rem' }}></i>
                     )}
                   </button>
                 )}
               </div>
            </div>

            {/* Messages */}
            {success && (
              <div className="cms-message cms-message-success">
                <CheckCircle size={20} />
                {success}
              </div>
            )}
            
            {formError && (
              <div className="cms-message cms-message-error">
                <AlertTriangle size={20} />
                {formError}
              </div>
            )}
            
            {importError && (
              <div className="cms-message cms-message-error">
                <AlertTriangle size={20} />
                {importError}
              </div>
            )}
            
            {exportError && (
              <div className="cms-message cms-message-error">
                <AlertTriangle size={20} />
                {exportError}
              </div>
            )}

            {/* Content */}
            <div className="organization-content">
              {showForm ? (
                <div className="employee-form-page">
                  <div className="employee-form-container">
                    <div className="employee-form-header">
                      <h2>{editingOrganization ? 'Edit Organization' : 'Add Organization'}</h2>
                      <button
                        className="close-btn"
                        onClick={closeModal}
                        aria-label="Close form"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="employee-form-content">
                      {submitting && (
                        <div className="form-loader">
                          <div className="cms-spinner"></div>
                        </div>
                      )}
                      
                      <form className="employee-form" onSubmit={saveOrganization}>
                        <div className="form-sections">
                          <div className="form-section-card employee-info">
                            <h2 className="section-title">Basic Information</h2>
                            <div className="form-grid">
                              <div className="form-group">
                                <label htmlFor="organizationName" className="required">
                                  Organization Name *
                                </label>
                                <input
                                  type="text"
                                  id="organizationName"
                                  name="organizationName"
                                  value={form.organizationName}
                                  onChange={onChange}
                                  className="form-input"
                                  required
                                  aria-required="true"
                                />
                              </div>
                              
                              
                              <div className="form-group">
                                <label htmlFor="rcNo">RC No</label>
                                <input
                                  type="text"
                                  id="rcNo"
                                  name="rcNo"
                                  value={form.rcNo}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="form-section-card work-info">
                            <h2 className="section-title">Contact Information</h2>
                            <div className="form-grid">
                              <div className="form-group">
                                <label htmlFor="primaryName">Primary Name</label>
                                <input
                                  type="text"
                                  id="primaryName"
                                  name="primaryName"
                                  value={form.primaryName}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="primaryContact">
                                  Primary Contact
                                </label>
                                <input
                                  type="tel"
                                  id="primaryContact"
                                  name="primaryContact"
                                  value={form.primaryContact}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="primaryEmail">
                                  Primary Email
                                </label>
                                <input
                                  type="email"
                                  id="primaryEmail"
                                  name="primaryEmail"
                                  value={form.primaryEmail}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secondaryContact">Secondary Contact</label>
                                <input
                                  type="tel"
                                  id="secondaryContact"
                                  name="secondaryContact"
                                  value={form.secondaryContact}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secondaryEmail">Secondary Email</label>
                                <input
                                  type="email"
                                  id="secondaryEmail"
                                  name="secondaryEmail"
                                  value={form.secondaryEmail}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="designation">Designation</label>
                                <input
                                  type="text"
                                  id="designation"
                                  name="designation"
                                  value={form.designation}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="form-section-card business-info">
                            <div className="business-info-header">
                              <h2 className="section-title">Business Information</h2>
                              <button
                                type="button"
                                className="add-row-btn"
                                onClick={addBusinessInfoRow}
                                title="Add new business information row"
                              >
                                <Plus size={16} />
                                Add Row
                              </button>
                            </div>
                            
                            {businessInfoRows.map((row, index) => (
                              <div key={row.id} className="business-info-row">
                                <div className="row-header">
                                  <h3>Business Entry {index + 1}</h3>
                                  {businessInfoRows.length > 1 && (
                                    <button
                                      type="button"
                                      className="remove-row-btn"
                                      onClick={() => removeBusinessInfoRow(row.id)}
                                      title="Remove this business information row"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                                
                                <div className="form-grid">
                                  <div className="form-group">
                                    <label htmlFor={`noOfContractorsEngaged_${row.id}`}>No of Contractors Engaged</label>
                                    <input
                                      type="number"
                                      id={`noOfContractorsEngaged_${row.id}`}
                                      value={row.noOfContractorsEngaged}
                                      onChange={(e) => updateBusinessInfoRow(row.id, 'noOfContractorsEngaged', e.target.value)}
                                      className="form-input"
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <label htmlFor={`registeredContractManPower_${row.id}`}>Registered Contract Employees</label>
                                    <input
                                      type="number"
                                      id={`registeredContractManPower_${row.id}`}
                                      value={row.registeredContractManPower}
                                      onChange={(e) => updateBusinessInfoRow(row.id, 'registeredContractManPower', e.target.value)}
                                      className="form-input"
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <label htmlFor={`noOfLicensedManpower_${row.id}`}>
                                      No of License
                                    </label>
                                    <input
                                      type="number"
                                      id={`noOfLicensedManpower_${row.id}`}
                                      value={row.noOfLicensedManpower}
                                      onChange={(e) => updateBusinessInfoRow(row.id, 'noOfLicensedManpower', e.target.value)}
                                      className="form-input"
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <label htmlFor={`licenseAmendmentDate_${row.id}`}>
                                      License/Amendment Date
                                    </label>
                                    <input
                                      type="date"
                                      id={`licenseAmendmentDate_${row.id}`}
                                      value={row.licenseAmendmentDate}
                                      onChange={(e) => updateBusinessInfoRow(row.id, 'licenseAmendmentDate', e.target.value)}
                                      className="form-input"
                                    />
                                  </div>
                                  
                                  <div className="form-group">
                                    <label htmlFor={`amendmentNo_${row.id}`}>
                                      Amendment No
                                    </label>
                                    <input
                                      type="text"
                                      id={`amendmentNo_${row.id}`}
                                      value={row.amendmentNo}
                                      onChange={(e) => updateBusinessInfoRow(row.id, 'amendmentNo', e.target.value)}
                                      className="form-input"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="form-section-card address-details">
                            <h2 className="section-title">Registered Address</h2>
                            <div className="form-grid">
                              <div className="form-group">
                                <label htmlFor="registeredAddressLine1" className="required">
                                  Address Line 1 *
                                </label>
                                <input
                                  type="text"
                                  id="registeredAddressLine1"
                                  name="registeredAddressLine1"
                                  value={form.registeredAddressLine1}
                                  onChange={onChange}
                                  className="form-input"
                                  required
                                  aria-required="true"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="registeredAddressLine2">Address Line 2</label>
                                <input
                                  type="text"
                                  id="registeredAddressLine2"
                                  name="registeredAddressLine2"
                                  value={form.registeredAddressLine2}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="registeredCity">City</label>
                                <input
                                  type="text"
                                  id="registeredCity"
                                  name="registeredCity"
                                  value={form.registeredCity}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="registeredState">State</label>
                                <input
                                  type="text"
                                  id="registeredState"
                                  name="registeredState"
                                  value={form.registeredState}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="postalCode">Postal Code</label>
                                <input
                                  type="text"
                                  id="postalCode"
                                  name="postalCode"
                                  value={form.postalCode}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="country">Country</label>
                                <select
                                  id="country"
                                  name="country"
                                  value={form.country}
                                  onChange={onChange}
                                  className="form-input"
                                >
                                  {countryOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          
                          
                          <div className="form-section-card address-details">
                            <h2 className="section-title">Unit Address</h2>
                            <div className="form-group checkbox-group">
                              <input
                                type="checkbox"
                                id="sameAsRegisteredAddress"
                                name="sameAsRegisteredAddress"
                                checked={form.sameAsRegisteredAddress}
                                onChange={onChange}
                                style={{ marginRight: '8px', cursor: 'pointer' }}
                              />
                              <label htmlFor="sameAsRegisteredAddress" className="checkbox-label">
                                Same as Registered Address
                              </label>
                            </div>
                            
                            <div className="form-grid">
                              <div className="form-group">
                                <label htmlFor="factoryAddressLine1">Address Line 1</label>
                                <input
                                  type="text"
                                  id="factoryAddressLine1"
                                  name="factoryAddressLine1"
                                  value={form.factoryAddressLine1}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="factoryAddressLine2">Address Line 2</label>
                                <input
                                  type="text"
                                  id="factoryAddressLine2"
                                  name="factoryAddressLine2"
                                  value={form.factoryAddressLine2}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="factoryCity">City</label>
                                <input
                                  type="text"
                                  id="factoryCity"
                                  name="factoryCity"
                                  value={form.factoryCity}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="factoryState">State</label>
                                <input
                                  type="text"
                                  id="factoryState"
                                  name="factoryState"
                                  value={form.factoryState}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="factoryPostalCode">Postal Code</label>
                                <input
                                  type="text"
                                  id="factoryPostalCode"
                                  name="factoryPostalCode"
                                  value={form.factoryPostalCode}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="factoryCountry">Country</label>
                                <select
                                  id="factoryCountry"
                                  name="factoryCountry"
                                  value={form.factoryCountry}
                                  onChange={onChange}
                                  className="form-input"
                                  disabled={form.sameAsRegisteredAddress}
                                >
                                  {countryOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="form-section">
                            <h3>Contact Persons</h3>
                            <div className="form-grid">
                              <div className="form-group">
                                <label htmlFor="primaryContactPerson">Primary Contact Person</label>
                                <input
                                  type="text"
                                  id="primaryContactPerson"
                                  name="primaryContactPerson"
                                  value={form.primaryContactPerson}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="primaryContactPersonPhone">Primary Contact Person Phone</label>
                                <input
                                  type="tel"
                                  id="primaryContactPersonPhone"
                                  name="primaryContactPersonPhone"
                                  value={form.primaryContactPersonPhone}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="primaryContactPersonEmail">Primary Contact Person Email</label>
                                <input
                                  type="email"
                                  id="primaryContactPersonEmail"
                                  name="primaryContactPersonEmail"
                                  value={form.primaryContactPersonEmail}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secondaryContactPerson">Secondary Contact Person</label>
                                <input
                                  type="text"
                                  id="secondaryContactPerson"
                                  name="secondaryContactPerson"
                                  value={form.secondaryContactPerson}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secondaryContactPersonPhone">Secondary Contact Person Phone</label>
                                <input
                                  type="tel"
                                  id="secondaryContactPersonPhone"
                                  name="secondaryContactPersonPhone"
                                  value={form.secondaryContactPersonPhone}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label htmlFor="secondaryContactPersonEmail">Secondary Contact Person Email</label>
                                <input
                                  type="email"
                                  id="secondaryContactPersonEmail"
                                  name="secondaryContactPersonEmail"
                                  value={form.secondaryContactPersonEmail}
                                  onChange={onChange}
                                  className="form-input"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-actions">
                          <button
                            type="submit"
                            className="cms-btn cms-btn-primary"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <div className="btn-loader">
                                <div className="cms-spinner"></div>
                              </div>
                            ) : (
                              editingOrganization ? 'Update Organization' : 'Add Organization'
                            )}
                                                    </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={closeModal}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : fetchState === 'loading' ? (
                <div className="cms-loading">
                  <div className="cms-spinner"></div>
                  <p>Loading organizations...</p>
                </div>
              ) : fetchState === 'error' ? (
                <div className="cms-error-state">
                  <div className="cms-error-icon">
                    <AlertTriangle size={48} />
                  </div>
                  <h3>Error Loading Organizations</h3>
                  <p>{fetchError}</p>
                  <button 
                    className="cms-btn cms-btn-primary"
                    onClick={fetchOrganizations}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>

                  {/* Organizations Grid */}
                  <div className="organizations-grid">
                    {filteredOrganizations.length > 0 ? (
                      filteredOrganizations.map((org) => (
                        <div 
                          key={org.id} 
                          className={`organization-card ${selectedOrganizationDetails?.id === org.id ? 'selected' : ''}`}
                          onClick={() => handleCardClick(org)}
                        >
                          <div className="card-header">
                            <h3 className="card-title">{org.organizationName || 'N/A'}</h3>
                          </div>
                          
                          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                            <div className="card-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedOrganizations.has(org.id)}
                                onChange={() => toggleOrganizationSelection(org.id)}
                                aria-label={`Select organization ${org.organizationName}`}
                              />
                            </div>
                            <button
                              className="action-btn"
                              onClick={() => handleEdit(org)}
                              title="Edit organization"
                              aria-label={`Edit organization ${org.organizationName}`}
                            >
                              <i className="fas fa-edit" style={{ color: 'blue' }}></i>
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => handleDelete(org.id)}
                              title="Delete organization"
                              aria-label={`Delete organization ${org.organizationName}`}
                              disabled={deleting}
                            >
                              <i className="fas fa-trash" style={{ color: 'red' }}></i>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Building size={64} />
                        </div>
                        <h3 className="empty-state-title">No Organizations Found</h3>
                        <p className="empty-state-text">
                          Get started by adding your first organization
                        </p>
                        <button
                          className="toolbar-btn"
                          onClick={() => {
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          type="button"
                          title="Add new organization"
                          style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 700, fontSize: '1.2rem', borderRadius: '8px', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(60,72,88,0.10)', padding: 0 }}
                        >
                          <i className="fas fa-plus" style={{ color: '#232323', fontSize: '1.5rem' }}></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Organization Details Card */}
                  {selectedOrganizationDetails && (
                    <div className="organization-details-card">
                      <div className="details-header">
                        <h3>Organization Details</h3>
                        <button
                          className="details-close-btn"
                          onClick={closeDetailsCard}
                          aria-label="Close details"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="details-content">
                        <div className="details-section">
                          <h4>Basic Information</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <label>Organization Name:</label>
                              <span>{selectedOrganizationDetails.organizationName || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Primary Name:</label>
                              <span>{selectedOrganizationDetails.primaryName || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Designation:</label>
                              <span>{selectedOrganizationDetails.designation || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>RC No:</label>
                              <span>{selectedOrganizationDetails.rcNo || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="details-section">
                          <h4>Contact Information</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <label>Primary Contact:</label>
                              <span>{selectedOrganizationDetails.primaryContact || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Secondary Contact:</label>
                              <span>{selectedOrganizationDetails.secondaryContact || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Primary Email:</label>
                              <span>{selectedOrganizationDetails.primaryEmail || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Secondary Email:</label>
                              <span>{selectedOrganizationDetails.secondaryEmail || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="details-section">
                          <h4>Address Information</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <label>Registered Address Line 1:</label>
                              <span>{selectedOrganizationDetails.registeredAddressLine1 || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Registered Address Line 2:</label>
                              <span>{selectedOrganizationDetails.registeredAddressLine2 || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Registered City:</label>
                              <span>{selectedOrganizationDetails.registeredCity || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Registered State:</label>
                              <span>{selectedOrganizationDetails.registeredState || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Postal Code:</label>
                              <span>{selectedOrganizationDetails.postalCode || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Country:</label>
                              <span>{selectedOrganizationDetails.country || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="details-section">
                          <h4>Unit Address</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <label>Unit Address Line 1:</label>
                              <span>{selectedOrganizationDetails.factoryAddressLine1 || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Unit Address Line 2:</label>
                              <span>{selectedOrganizationDetails.factoryAddressLine2 || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Unit City:</label>
                              <span>{selectedOrganizationDetails.factoryCity || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Unit State:</label>
                              <span>{selectedOrganizationDetails.factoryState || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Unit Postal Code:</label>
                              <span>{selectedOrganizationDetails.factoryPostalCode || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Unit Country:</label>
                              <span>{selectedOrganizationDetails.factoryCountry || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="details-section">
                          <h4>Business Information</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <label>No of Contractors Engaged:</label>
                              <span>{selectedOrganizationDetails.noOfContractorsEngaged || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Registered Contract Employees:</label>
                              <span>{selectedOrganizationDetails.registeredContractManPower || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>No of License:</label>
                              <span>{selectedOrganizationDetails.noOfLicensedManpower || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>License/Amendment Date:</label>
                              <span>{selectedOrganizationDetails.licenseAmendmentDate || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Amendment No:</label>
                              <span>{selectedOrganizationDetails.amendmentNo || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
        
        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {/* Filter Sidebar - Employee Management Style */}
        {showSearchDropdown && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            paddingTop: '80px'
          }} onClick={() => setShowSearchDropdown(false)}>
            <div style={{
              backgroundColor: 'white',
              width: '400px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '8px',
              marginRight: '20px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e5e7eb'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '600' }}>Filter Options</h4>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    color: '#ef4444',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px'
                  }}
                  title="Close filter options"
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {searchableFields.map(({ label, field }) => (
                  <div key={field} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '6px',
                    backgroundColor: '#fafafa'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <input
                        type="checkbox"
                        checked={searchFields[field].enabled}
                        onChange={() => handleFieldToggle(field)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      {label}
                    </label>
                    {searchFields[field].enabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '24px' }}>
                        {field === 'organizationName' ? (
                          createOrganizationDropdownUI()
                        ) : field === 'designation' ? (
                          createDesignationDropdownUI()
                        ) : field === 'licenseAmendmentDate' ? (
                          <input
                            type="date"
                            value={searchFields[field].value}
                            onChange={(e) => handleSearchValueChange(field, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        ) : ['noOfContractorsEngaged', 'registeredContractManPower', 'noOfLicensedManpower'].includes(field) ? (
                          <input
                            type="number"
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            value={searchFields[field].value}
                            onChange={(e) => handleSearchValueChange(field, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        ) : field === 'primaryEmail' || field === 'secondaryEmail' || field === 'primaryContactPersonEmail' || field === 'secondaryContactPersonEmail' ? (
                          <input
                            type="email"
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            value={searchFields[field].value}
                            onChange={(e) => handleSearchValueChange(field, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        ) : field === 'primaryContact' || field === 'secondaryContact' || field === 'primaryContactPersonPhone' || field === 'secondaryContactPersonPhone' ? (
                          <input
                            type="tel"
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            value={searchFields[field].value}
                            onChange={(e) => handleSearchValueChange(field, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={`Enter ${label.toLowerCase()}...`}
                            value={searchFields[field].value}
                            onChange={(e) => handleSearchValueChange(field, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
}

export default Organization;