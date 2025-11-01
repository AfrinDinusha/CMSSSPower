import './App.css';
import './helper.css';
import './employeeManagement.css';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import * as XLSX from 'xlsx'; // Import the xlsx library for Excel operations
import { Link } from 'react-router-dom';
import cmsLogo from './assets/cms new logo fixed.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import contractorImage from './assets/contractor.jfif';

import Button from './Button';
import {
  Users, Calendar, FileText, AlertTriangle, FolderOpen,
  ClipboardList, Building, Handshake, Landmark, Clock,
  Map, BarChart3, User, TrendingUp, TrendingDown,
  Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon,
  Shield, AlertOctagon, CreditCard, FileSignature, Search, Clock3
} from 'lucide-react';
// import DOMPurify from 'dompurify'; // Uncomment if you install DOMPurify for XSS sanitization

// Add a helper function at the top (after imports):
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return String(dateStr).slice(0, 10);
}

// Helper: robust download via axios (handles auth cookies and blobs)
async function downloadBlobWithAxios(downloadUrl, fallbackName) {
  try {
    const response = await axios.get(downloadUrl, {
      responseType: 'blob',
      withCredentials: true,
      headers: { Accept: '*/*' }
    });

    // Try to extract filename from Content-Disposition
    let fileName = fallbackName || 'download';
    const disposition = response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition']);
    if (disposition) {
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
      if (match) {
        fileName = decodeURIComponent(match[1] || match[2] || fileName);
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('downloadBlobWithAxios error:', err);
    return false;
  }
}

// Employee Row Component
function EmployeeRow({ employee, index, removeEmployee, editEmployee, isSelected, onSelect, selectedEmployees }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Function to download file
  const downloadFile = useCallback(async (employeeId, docType, fileName, event) => {
    // Store original text outside try block so it's accessible in catch
    const originalText = event?.target?.textContent;
   
    try {
      const downloadUrl = `/server/cms_function/employees/${employeeId}/file/${docType}`;
      console.log('Downloading file:', { downloadUrl, fileName, employeeId, docType });
     
      // Show loading indicator
      if (event?.target) {
        event.target.textContent = 'Downloading...';
        event.target.style.pointerEvents = 'none';
      }
     
      // Try axios blob approach (handles cookies and content-disposition)
      const axiosOk = await downloadBlobWithAxios(downloadUrl, fileName);
      if (!axiosOk) {
        console.log('Axios blob download failed, trying direct link.');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 100);
      }
      
      // Restore original text after a short delay
      setTimeout(() => {
        if (event?.target) {
          event.target.textContent = originalText;
          event.target.style.pointerEvents = 'auto';
        }
      }, 1000);
     
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
     
      // Restore original text on error
      if (event?.target) {
        event.target.textContent = originalText;
        event.target.style.pointerEvents = 'auto';
      }
    }
  }, []);

  // Style for download links
  const downloadLinkStyle = {
    cursor: 'pointer',
    color: '#1976d2',
    textDecoration: 'underline',
    fontWeight: 500,
    transition: 'color 0.2s ease'
  };

  const handleLinkHover = (e, isEntering) => {
    if (isEntering) {
      e.target.style.color = '#0d47a1';
      e.target.style.textDecoration = 'underline';
    } else {
      e.target.style.color = '#1976d2';
      e.target.style.textDecoration = 'underline';
    }
  };

  const deleteEmployee = useCallback((e) => {
    e.stopPropagation(); // Prevent row click when clicking delete
    setDeleting(true);
    setDeleteError('');
    axios
      .delete(`/server/cms_function/employees/${employee.id}`, { timeout: 5000 })
      .then(() => {
        removeEmployee(employee.id);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || `Failed to delete employee (ID: ${employee.id}).`;
        setDeleteError(errorMessage);
        console.error('Delete employee error:', err);
      })
      .finally(() => setDeleting(false));
  }, [employee.id, removeEmployee]);

  const handleRowClick = useCallback(() => {
    editEmployee(employee);
  }, [editEmployee, employee]);

  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation(); // Prevent row click when clicking checkbox
    onSelect(employee.id);
  }, [onSelect, employee.id]);

  const handleEditButtonClick = useCallback((e) => {
    e.stopPropagation(); // Prevent row click when clicking edit button
    editEmployee(employee);
  }, [editEmployee, employee]);

  return (
    <tr
      className="clickable-row"
      onClick={handleRowClick}
      style={{
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <td onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
        />
      </td>
      {selectedEmployees.length > 0 && (
        <td onClick={handleEditButtonClick}>
          {isSelected && (
            <button
              className="btn btn-icon"
              onClick={handleEditButtonClick}
              title="Edit"
              disabled={deleting}
            >
              <i className="fas fa-edit"></i>
            </button>
          )}
        </td>
      )}
      <td style={{ paddingRight: '20px' }}>{index + 1}</td>
      <td
        onClick={handleRowClick}
        style={{ cursor: 'pointer' }}
      >
        {(() => {
          const status = employee.employeeStatus || '-';
          let className = '';
          let style = {
            display: 'inline-block',
            padding: '4px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: '2px solid',
            fontSize: '1rem',
            background: 'transparent',
            margin: '2px 0',
            minWidth: '90px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          };
          if (status === 'Active') {
            style = { ...style, color: '#388e3c', borderColor: '#a5d6a7', background: '#e8f5e9' };
          } else if (status === 'Absconding') {
            style = { ...style, color: '#f57c00', borderColor: '#ffe0b2', background: '#fff3e0' };
          } else if (status === 'Resigned') {
            style = { ...style, color: '#1976d2', borderColor: '#bbdefb', background: '#e3f2fd' };
          } else if (status === 'Terminated') {
            style = { ...style, color: '#d32f2f', borderColor: '#ffcdd2', background: '#ffebee' };
          } else if (status === 'Deceased') {
            style = { ...style, color: '#6d4c41', borderColor: '#d7ccc8', background: '#efebe9' };
          } else {
            style = { ...style, color: '#757575', borderColor: '#e0e0e0', background: '#fafafa' };
          }
          return <span style={style}>{status}</span>;
        })()}
      </td>
      <td>
        {employee.photoFileId && employee.photoFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <img
              src={`/server/cms_function/employees/${employee.id}/file/Photo`}
              alt="Employee Photo"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onClick={() => {
                // Open photo in a larger view
                const newWindow = window.open(`/server/cms_function/employees/${employee.id}/file/Photo`, '_blank');
                if (newWindow) {
                  newWindow.focus();
                }
              }}
              title="Click to view larger image"
            />
            <span style={{ display: 'none', fontSize: '12px', color: '#666' }}>
              {employee.photoFileName}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <span style={{ color: '#aaa', fontSize: '12px' }}>No photo</span>
          </div>
        )}
      </td>
      <td>{employee.employeeCode || '-'}</td>
      <td>{employee.employeeName || '-'}</td>
      <td>{employee.personalEmail || '-'}</td>
      <td>{employee.phone || '-'}</td>
      <td>{employee.contractor || '-'}</td>
      <td>{employee.employmentType || '-'}</td>
      <td>{formatDate(employee.dateOfJoining)}</td>
      <td>{formatDate(employee.dateOfExit)}</td>
      <td>{employee.overallExperience || '-'}</td>
      <td>{employee.relevantExperience || '-'}</td>
      <td>{employee.sourceOfHire || '-'}</td>
      <td>{employee.department || '-'}</td>
      <td>{employee.designation || '-'}</td>
      <td>{employee.pfNo || '-'}</td>
      <td>{employee.esicNo || '-'}</td>
      <td>{employee.location || '-'}</td>
      <td>{employee.gradeLevel || '-'}</td>
      <td>{employee.uanNo || '-'}</td>
      <td>{employee.aadhaarNumber || '-'}</td>
      <td>{employee.panNumber || '-'}</td>
      <td>{employee.actualBasic || '-'}</td>
      <td>{employee.actualHRA || '-'}</td>
      <td>{employee.actualDA || '-'}</td>
      <td>{employee.otherAllowance || '-'}</td>
      <td>{employee.totalSalary || '-'}</td>
      <td>{employee.skills || '-'}</td>
      <td>{employee.skillsType || '-'}</td>
      <td>{employee.ratePerHour || '-'}</td>
      <td>{formatDate(employee.dateOfBirth)}</td>
      <td>{employee.fathersName || '-'}</td>
      <td>{employee.age || '-'}</td>
      <td>{employee.emergencyContactNumber || '-'}</td>
      <td>{employee.gender || '-'}</td>
      <td>{employee.bloodGroup || '-'}</td>
      <td>{employee.maritalStatus || '-'}</td>
      <td>{employee.presentAddressLine1 || '-'}</td>
      <td>{employee.presentAddressLine2 || '-'}</td>
      <td>{employee.presentCity || '-'}</td>
      <td>{employee.presentState || '-'}</td>
      <td>{employee.presentPostalCode || '-'}</td>
      <td>{employee.presentCountry || '-'}</td>
      <td>{employee.permanentAddressLine1 || '-'}</td>
      <td>{employee.permanentAddressLine2 || '-'}</td>
      <td>{employee.permanentCity || '-'}</td>
      <td>{employee.permanentState || '-'}</td>
      <td>{employee.permanentPostalCode || '-'}</td>
      <td>{employee.permanentCountry || '-'}</td>
      <td>{employee.addedUser || '-'}</td>
      <td>{employee.modifiedUser || '-'}</td>
      <td>{employee.addedTime ? String(employee.addedTime).replace('T', ' ').slice(0, 19) : '-'}</td>
      <td>{employee.modifiedTime ? String(employee.modifiedTime).replace('T', ' ').slice(0, 19) : '-'}</td>
      <td>
        {employee.aadharCopyFileId && employee.aadharCopyFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'AadharCopy', employee.aadharCopyFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.aadharCopyFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'AadharCopy', employee.aadharCopyFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
      <td>
        {employee.educationalCertificatesFileId && employee.educationalCertificatesFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'EducationalCertificates', employee.educationalCertificatesFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.educationalCertificatesFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'EducationalCertificates', employee.educationalCertificatesFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
      <td>
        {employee.bankPassbookFileId && employee.bankPassbookFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'BankPassbook', employee.bankPassbookFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.bankPassbookFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'BankPassbook', employee.bankPassbookFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
      <td>
        {employee.experienceCertificateFileId && employee.experienceCertificateFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'ExperienceCertificate', employee.experienceCertificateFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.experienceCertificateFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'ExperienceCertificate', employee.experienceCertificateFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
      <td>
        {employee.pANCardFileId && employee.pANCardFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'PANCard', employee.pANCardFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.pANCardFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'PANCard', employee.pANCardFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
      <td>
        {employee.resumeFileId && employee.resumeFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={downloadLinkStyle}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'Resume', employee.resumeFileName, e);
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              title="Click to download file"
            >
              {employee.resumeFileName}
            </span>
            <i
              className="fas fa-download"
              style={{
                color: '#1976d2',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(employee.id, 'Resume', employee.resumeFileName, e);
              }}
              title="Download file"
            ></i>
          </div>
        ) : (
          <span style={{ color: '#aaa' }}>No file</span>
        )}
      </td>
    </tr>
  );
}

// Employee Management Component
function EmployeeManagement({ userRole = 'App Administrator', userEmail = null }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [fetchState, setFetchState] = useState('init');
  const [fetchError, setFetchError] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [massDeleteError, setMassDeleteError] = useState('');
 
  // Calculate if all employees are selected
  const allSelected = filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length;
  const someSelected = selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length;
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [exportError, setExportError] = useState('');
  const fileInputRef = useRef(null);
  const [employeeCodes, setEmployeeCodes] = useState([]);
  const [employeeCodeSearch, setEmployeeCodeSearch] = useState('');
  const [isEmployeeCodeDropdownOpen, setIsEmployeeCodeDropdownOpen] = useState(false);
  const [loadingEmployeeCodes, setLoadingEmployeeCodes] = useState(false);
  
  // Dropdown states for other fields
  const [employeeNames, setEmployeeNames] = useState([]);
  const [employeeNameSearch, setEmployeeNameSearch] = useState('');
  const [isEmployeeNameDropdownOpen, setIsEmployeeNameDropdownOpen] = useState(false);
  const [loadingEmployeeNames, setLoadingEmployeeNames] = useState(false);
  
  const [contractors, setContractors] = useState([]);
  const [contractorSearch, setContractorSearch] = useState('');
  const [isContractorDropdownOpen, setIsContractorDropdownOpen] = useState(false);
  const [loadingContractors, setLoadingContractors] = useState(false);
  
  
  
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employmentTypeSearch, setEmploymentTypeSearch] = useState('');
  const [isEmploymentTypeDropdownOpen, setIsEmploymentTypeDropdownOpen] = useState(false);
  const [loadingEmploymentTypes, setLoadingEmploymentTypes] = useState(false);
  
  const [skills, setSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  
  const [exitDates, setExitDates] = useState([]);
  const [exitDateSearch, setExitDateSearch] = useState('');
  const [isExitDateDropdownOpen, setIsExitDateDropdownOpen] = useState(false);
  const [loadingExitDates, setLoadingExitDates] = useState(false);
  
  const [genders, setGenders] = useState([]);
  const [genderSearch, setGenderSearch] = useState('');
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [loadingGenders, setLoadingGenders] = useState(false);
  const [skillTypes, setSkillTypes] = useState([]);
  const [skillTypeSearch, setSkillTypeSearch] = useState('');
  const [isSkillTypeDropdownOpen, setIsSkillTypeDropdownOpen] = useState(false);
  const [loadingSkillTypes, setLoadingSkillTypes] = useState(false);
  const [searchFields, setSearchFields] = useState({
    // Basic Information
    employeeCode: { enabled: false, selectedCode: '' },
    employeeName: { enabled: false, selectedName: '' },
    personalEmail: { enabled: false, value: '' },
    phone: { enabled: false, value: '' },
    contractor: { enabled: false, selectedContractor: '' },
    dateOfJoining: { enabled: false, value: '' },
    dateOfExit: { enabled: false, selectedExitDate: '' },
    employmentType: { enabled: false, selectedEmploymentType: '' },
    location: { enabled: false, value: '' },
    gradeLevel: { enabled: false, value: '' },
    reportingTo: { enabled: false, value: '' },
    function: { enabled: false, value: '' },
    skills: { enabled: false, selectedSkill: '' },
    skillsType: { enabled: false, selectedSkillType: '' },
   
    // Personal Information
    dateOfBirth: { enabled: false, value: '' },
    age: { enabled: false, value: '' },
    gender: { enabled: false, selectedGender: '' },
    bloodGroup: { enabled: false, value: '' },
    maritalStatus: { enabled: false, mode: 'is', value: '' },
    fathersName: { enabled: false, value: '' },
   
    // Contact Information
    primaryContactNumber: { enabled: false, value: '' },
    secondaryContactNumber: { enabled: false, value: '' },
    emergencyContactNumber: { enabled: false, value: '' },
   
    // Address Information - Present
    presentAddressLine1: { enabled: false, value: '' },
    presentAddressLine2: { enabled: false, value: '' },
    presentCity: { enabled: false, value: '' },
    presentState: { enabled: false, value: '' },
    presentPostalCode: { enabled: false, value: '' },
    presentCountry: { enabled: false, value: '' },
   
    // Address Information - Permanent
    permanentAddressLine1: { enabled: false, value: '' },
    permanentAddressLine2: { enabled: false, value: '' },
    permanentCity: { enabled: false, value: '' },
    permanentState: { enabled: false, value: '' },
    permanentPostalCode: { enabled: false, value: '' },
    permanentCountry: { enabled: false, value: '' },
   
    // Government IDs
    aadhaarNumber: { enabled: false, value: '' },
    panNumber: { enabled: false, value: '' },
    uanNo: { enabled: false, value: '' },
    pfNo: { enabled: false, value: '' },
    esicNo: { enabled: false, value: '' },
    drivingLicenseNumber: { enabled: false, value: '' },
    drivingLicenseExpiryDate: { enabled: false, value: '' },
   
    // Professional Information
    overallExperience: { enabled: false, value: '' },
    relevantExperience: { enabled: false, value: '' },
    sourceOfHire: { enabled: false, value: '' },
    skills: { enabled: false, mode: 'is', value: '' },
    skillsType: { enabled: false, mode: 'is', value: '' },
    ratePerHour: { enabled: false, value: '' },
  });
  const dropdownRef = useRef(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showAll, setShowAll] = useState(false); // Add state for showing all records

  // Add missing state variables for departments and designations
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [form, setForm] = useState({
    employeeCode: '',
    employeeName: '',
    personalEmail: '',
    phone: '',
    contractor: '',
    dateOfJoining: '',
    dateOfExit: '',
    employmentType: '',
    overallExperience: '',
    relevantExperience: '',
    sourceOfHire: '',
    department: '',
    designation: '',
    pfNo: '',
    esicNo: '',
    location: '',
    gradeLevel: '',
    uanNo: '',
    reportingTo: '',
    hrPartner: '',
    nationalHead: '',
    dateOfBirth: '',
    fathersName: '',
    age: '',
    emergencyContactNumber: '',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    presentAddressLine1: '',
    presentAddressLine2: '',
    presentCity: '',
    presentState: '',
    presentPostalCode: '',
    presentCountry: '',
    permanentAddressLine1: '',
    permanentAddressLine2: '',
    permanentCity: '',
    permanentState: '',
    permanentPostalCode: '',
    permanentCountry: '',
    // Add fileId and fileName fields for all document types to form state
    photoFileId: '',
    photoFileName: '',
    aadharCopyFileId: '',
    aadharCopyFileName: '',
    educationalCertificatesFileId: '',
    educationalCertificatesFileName: '',
    bankPassbookFileId: '',
    bankPassbookFileName: '',
    experienceCertificateFileId: '',
    experienceCertificateFileName: '',
    pANCardFileId: '',
    pANCardFileName: '',
    resumeFileId: '',
    resumeFileName: '',
    // Salary Info fields
    skills: '',
    skillsType: '',
    ratePerHour: '',
    actualBasic: '',
    actualHRA: '',
    actualDA: '',
    otherAllowance: '',
    totalSalary: '',
    aadhaarNumber: '',
    panNumber: '',
    employeeStatus: '',
    contractorSupervisor: '',
    function: '',
    category: '',
    costCenter: '',
    line: '',
    primaryContactNumber: '',
    secondaryContactNumber: '',
    busRoute: '',
    pickupPoint: '',
    drivingLicenseNumber: '',
    drivingLicenseExpiryDate: '',
    educationDetails: [
      { qualification: '', institutionName: '', fieldOfStudy: '', yearOfCompletion: '', percentageMarks: '' }
    ],
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  // Add refs for dropdowns at the top of EmployeeManagement

  // Add state for Same as Present Address
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Add handler for checkbox
  const handleSameAsPresentChange = (e) => {
    const checked = e.target.checked;
    setSameAsPresent(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        permanentAddressLine1: prev.presentAddressLine1,
        permanentAddressLine2: prev.presentAddressLine2,
        permanentCity: prev.presentCity,
        permanentState: prev.presentState,
        permanentPostalCode: prev.presentPostalCode,
        permanentCountry: prev.presentCountry,
      }));
    }
  };

  // Sync Permanent Address if sameAsPresent is checked and Present Address changes
  useEffect(() => {
    if (sameAsPresent) {
      setForm((prev) => ({
        ...prev,
        permanentAddressLine1: prev.presentAddressLine1,
        permanentAddressLine2: prev.presentAddressLine2,
        permanentCity: prev.presentCity,
        permanentState: prev.presentState,
        permanentPostalCode: prev.presentPostalCode,
        permanentCountry: prev.presentCountry,
      }));
    }
  }, [sameAsPresent, form.presentAddressLine1, form.presentAddressLine2, form.presentCity, form.presentState, form.presentPostalCode, form.presentCountry]);

  // Fetch employees with pagination
  const fetchEmployees = useCallback(() => {
    setFetchState('loading');
    setFetchError('');
   
    // If showAll is true, fetch all records without pagination
    const params = showAll ? {} : { page, perPage };
   
    // Add user role and email for contractor filtering
    if (userRole && userEmail) {
      params.userRole = userRole;
      params.userEmail = userEmail;
      console.log('Filtering employees for:', { userRole, userEmail });
    }
   
    console.log('EmployeeManagement API call params:', params);
    console.log('Full API URL:', `/server/cms_function/employees?${new URLSearchParams(params).toString()}`);
   
    axios
      .get('/server/cms_function/employees', { params, timeout: 5000 })
      .then((response) => {
        console.log('EmployeeManagement API response:', response.data);
        if (!response?.data?.data?.employees) {
          throw new Error('Unexpected API response structure');
        }
        const fetchedEmployees = response.data.data.employees || [];
        console.log('Fetched employees count:', fetchedEmployees.length);
        console.log('Sample employee:', fetchedEmployees[0]);
        if (!Array.isArray(fetchedEmployees)) {
          throw new Error('Employees data is not an array');
        }
        // Restrict view to specific contractor employees for specific user emails
        const shouldRestrictToNaps = (userEmail || '').toLowerCase() === 'afrindinu14@gmail.com';
        const shouldRestrictToSriBalaji = (userEmail || '').toLowerCase() === 'dinushaafrin@gmail.com';
        
        // Debug logging for contractor filtering
        console.log('=== EMPLOYEE FILTERING DEBUG ===');
        console.log('User email:', userEmail);
        console.log('Should restrict to NAPS:', shouldRestrictToNaps);
        console.log('Should restrict to Sri Balaji:', shouldRestrictToSriBalaji);
        console.log('Total fetched employees:', fetchedEmployees.length);
        
        // Log first few contractor names for debugging
        const contractorNames = fetchedEmployees.slice(0, 5).map(emp => ({
          employeeCode: emp.employeeCode,
          contractor: emp.contractor,
          contractorName: emp.contractorName
        }));
        console.log('Sample contractor names:', contractorNames);
        
        let filteredEmployees = fetchedEmployees;
        
        if (shouldRestrictToNaps) {
          filteredEmployees = fetchedEmployees.filter(emp => {
            const contractorName = ((emp && (emp.contractor || emp.contractorName)) || '').toString().toLowerCase();
            const matches = contractorName.includes('naps');
            console.log(`NAPS filter - Employee ${emp.employeeCode}: contractor="${contractorName}", matches=${matches}`);
            return matches;
          });
        }
        
        if (shouldRestrictToSriBalaji) {
          filteredEmployees = fetchedEmployees.filter(emp => {
            const rawContractor = ((emp && (emp.contractor || emp.contractorName)) || '').toString().toLowerCase();
            // Normalize: collapse multiple spaces, remove dots, trim
            const contractorName = rawContractor.replace(/\.+/g, '').replace(/\s+/g, ' ').trim();
            // Match broadly for any variation like 'Sri Balaji', 'Sri  Balaji', etc.
            const matches = contractorName.includes('sri balaji');
            console.log(`Sri Balaji filter - Employee ${emp.employeeCode}: contractor="${rawContractor}" => normalized="${contractorName}", matches=${matches}`);
            return matches;
          });
        }
        
        console.log('Filtered employees count:', filteredEmployees.length);
        console.log('=== END FILTERING DEBUG ===');

        setEmployees(filteredEmployees);
        setFilteredEmployees(filteredEmployees);
        // Pagination info
        const hasMore = response.data.data.hasMore;
        const total = response.data.data.total || 0;
        setTotalEmployees(total);
        // Calculate total pages based on total count and perPage
        if (total && perPage && !showAll) {
          setTotalPages(Math.ceil(total / perPage));
        } else {
          // Fallback: if no total available, use hasMore to estimate
          setTotalPages(hasMore ? page + 1 : page);
        }
        setFetchState('fetched');
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Failed to fetch employees. Please try again later.';
        setFetchError(errorMessage);
        setFetchState('error');
        console.error('Fetch employees error:', err);
      });
  }, [page, perPage, showAll, userRole, userEmail]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const columns = [
    { label: 'Select', field: null },
    { label: 'Edit', field: null },
    { label: '#', field: null },
    { label: 'Employee Status', field: 'employeeStatus' },
    { label: 'Photo File', field: 'photoFileName' },
    { label: 'Employee Code', field: 'employeeCode' },
    { label: 'Name', field: 'employeeName' },
    { label: 'Email', field: 'personalEmail' },
    { label: 'Phone', field: 'phone' },
    { label: 'Contractor', field: 'contractor' },
    { label: 'Employment Type', field: 'employmentType' },
    { label: 'Date of Joining', field: 'dateOfJoining' },
    { label: 'Date of Exit', field: 'dateOfExit' },
    { label: 'Overall Experience', field: 'overallExperience' },
    { label: 'Relevant Experience', field: 'relevantExperience' },
    { label: 'Source of Hire', field: 'sourceOfHire' },
    { label: 'Department', field: 'department' },
    { label: 'Designation', field: 'designation' },
    { label: 'PF No', field: 'pfNo' },
    { label: 'ESIC No', field: 'esicNo' },
    { label: 'Location', field: 'location' },
    { label: 'Grade Level', field: 'gradeLevel' },
    { label: 'UAN No', field: 'uanNo' },
    { label: 'Aadhaar Number', field: 'aadhaarNumber' },
    { label: 'PAN Number', field: 'panNumber' },
    { label: 'Actual Basic', field: 'actualBasic' },
    { label: 'Actual HRA', field: 'actualHRA' },
    { label: 'Actual DA', field: 'actualDA' },
    { label: 'Other Allowance', field: 'otherAllowance' },
    { label: 'Total Salary', field: 'totalSalary' },
    { label: 'Skills', field: 'skills' },
    { label: 'Skills Type', field: 'skillsType' },
    { label: 'Rate per Hour', field: 'ratePerHour' },
    { label: 'Date of Birth', field: 'dateOfBirth' },
    { label: "Father Name/Spouse Name", field: 'fathersName' },
    { label: 'Age', field: 'age' },
    { label: 'Emergency Contact', field: 'emergencyContactNumber' },
    { label: 'Gender', field: 'gender' },
    { label: 'Blood Group', field: 'bloodGroup' },
    { label: 'Marital Status', field: 'maritalStatus' },
    { label: 'Present Address Line 1', field: 'presentAddressLine1' },
    { label: 'Present Address Line 2', field: 'presentAddressLine2' },
    { label: 'Present City', field: 'presentCity' },
    { label: 'Present State', field: 'presentState' },
    { label: 'Present Postal Code', field: 'presentPostalCode' },
    { label: 'Present Country', field: 'presentCountry' },
    { label: 'Permanent Address Line 1', field: 'permanentAddressLine1' },
    { label: 'Permanent Address Line 2', field: 'permanentAddressLine2' },
    { label: 'Permanent City', field: 'permanentCity' },
    { label: 'Permanent State', field: 'permanentState' },
    { label: 'Permanent Postal Code', field: 'permanentPostalCode' },
    { label: 'Permanent Country', field: 'permanentCountry' },
    { label: 'Added User', field: 'addedUser' },
    { label: 'Modified User', field: 'modifiedUser' },
    { label: 'Added Time', field: 'addedTime' },
    { label: 'Modified Time', field: 'modifiedTime' },
    { label: 'Aadhaar file', field: 'aadharCopyFileName' },
    { label: 'Educational Certificates File', field: 'educationalCertificatesFileName' },
    { label: 'Bank Passbook File', field: 'bankPassbookFileName' },
    { label: 'Experience Certificate File', field: 'experienceCertificateFileName' },
    { label: 'PAN Card File', field: 'pANCardFileName' },
    { label: 'Resume File', field: 'resumeFileName' },
  ];

  // Define fields for the search dropdown
  const searchableFields = [
    // Basic Information
    { label: 'Employee Code', field: 'employeeCode' },
    { label: 'Name', field: 'employeeName' },
    { label: 'Email', field: 'personalEmail' },
    { label: 'Phone', field: 'phone' },
    { label: 'Contractor', field: 'contractor' },
    { label: 'Date of Joining', field: 'dateOfJoining' },
    { label: 'Date of Exit', field: 'dateOfExit' },
    { label: 'Employment Type', field: 'employmentType' },
    { label: 'Department', field: 'department' },
    { label: 'Designation', field: 'designation' },
    { label: 'Location', field: 'location' },
    { label: 'Grade Level', field: 'gradeLevel' },
    { label: 'Reporting To', field: 'reportingTo' },
    { label: 'Function', field: 'function' },
   
    // Personal Information
    { label: 'Date of Birth', field: 'dateOfBirth' },
    { label: 'Age', field: 'age' },
    { label: 'Gender', field: 'gender' },
    { label: 'Blood Group', field: 'bloodGroup' },
    { label: 'Marital Status', field: 'maritalStatus' },
    { label: 'Father Name/Spouse Name', field: 'fathersName' },
   
    // Contact Information
    { label: 'Primary Contact', field: 'primaryContactNumber' },
    { label: 'Secondary Contact', field: 'secondaryContactNumber' },
    { label: 'Emergency Contact', field: 'emergencyContactNumber' },
   
    // Address Information - Present
    { label: 'Present Address Line 1', field: 'presentAddressLine1' },
    { label: 'Present Address Line 2', field: 'presentAddressLine2' },
    { label: 'Present City', field: 'presentCity' },
    { label: 'Present State', field: 'presentState' },
    { label: 'Present Postal Code', field: 'presentPostalCode' },
    { label: 'Present Country', field: 'presentCountry' },
   
    // Address Information - Permanent
    { label: 'Permanent Address Line 1', field: 'permanentAddressLine1' },
    { label: 'Permanent Address Line 2', field: 'permanentAddressLine2' },
    { label: 'Permanent City', field: 'permanentCity' },
    { label: 'Permanent State', field: 'permanentState' },
    { label: 'Permanent Postal Code', field: 'permanentPostalCode' },
    { label: 'Permanent Country', field: 'permanentCountry' },
   
    // Government IDs
    { label: 'Aadhaar Number', field: 'aadhaarNumber' },
    { label: 'PAN Number', field: 'panNumber' },
    { label: 'UAN Number', field: 'uanNo' },
    { label: 'PF Number', field: 'pfNo' },
    { label: 'ESIC Number', field: 'esicNo' },
    { label: 'Driving License', field: 'drivingLicenseNumber' },
    { label: 'Driving License Expiry', field: 'drivingLicenseExpiryDate' },
   
    // Professional Information
    { label: 'Overall Experience', field: 'overallExperience' },
    { label: 'Relevant Experience', field: 'relevantExperience' },
    { label: 'Source of Hire', field: 'sourceOfHire' },
    { label: 'Skills', field: 'skills' },
    { label: 'Skills Type', field: 'skillsType' },
    { label: 'Rate Per Hour', field: 'ratePerHour' },
  ];

  // Define filtering modes
  const filterModes = [
    { value: 'is', label: 'is' },
    { value: 'is not', label: 'is not' },
    { value: 'is empty', label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ];

  // Apply search filter based on selected fields and modes
  const filteredData = useMemo(() => {
    const hasActiveFilters = Object.values(searchFields).some(
      field => field.enabled
    );

    if (!hasActiveFilters) {
      return employees;
    }

    return employees.filter((employee) => {
      if (!employee || typeof employee !== 'object') return false;
      return searchableFields.every(({ field }) => {
        const fieldData = searchFields[field];
        if (!fieldData.enabled) return true;

        // Special handling for dropdown fields
        if (field === 'employeeCode') {
          const { selectedCode } = fieldData;
          if (!selectedCode) return true;
          const matches = employee[field] === selectedCode;
          console.log(`Filtering employee ${employee.employeeName} (${employee.employeeCode}) by code ${selectedCode}:`, matches);
          return matches;
        } else if (field === 'employeeName') {
          const { selectedName } = fieldData;
          if (!selectedName) return true;
          return employee[field] === selectedName;
        } else if (field === 'contractor') {
          const { selectedContractor } = fieldData;
          if (!selectedContractor) return true;
          return employee[field] === selectedContractor;
        } else if (field === 'employmentType') {
          const { selectedEmploymentType } = fieldData;
          if (!selectedEmploymentType) return true;
          return employee[field] === selectedEmploymentType;
        } else if (field === 'skills') {
          const { selectedSkill } = fieldData;
          if (!selectedSkill) return true;
          if (!employee.skills) return false;
          
          if (Array.isArray(employee.skills)) {
            return employee.skills.includes(selectedSkill);
          } else if (typeof employee.skills === 'string') {
            // Handle skills stored as comma-separated string
            const skillsArray = employee.skills.split(',').map(skill => skill.trim());
            return skillsArray.includes(selectedSkill);
          }
          return false;
        } else if (field === 'dateOfExit') {
          const { selectedExitDate } = fieldData;
          if (!selectedExitDate) return true;
          return employee[field] === selectedExitDate;
        } else if (field === 'gender') {
          const { selectedGender } = fieldData;
          if (!selectedGender) return true;
          return employee[field] === selectedGender;
        } else if (field === 'skillsType') {
          const { selectedSkillType } = fieldData;
          if (!selectedSkillType) return true;
          return employee[field] === selectedSkillType;
        } else if (fieldData.value !== undefined && fieldData.checkbox === undefined) {
          // Input field filtering - search for text matches
          const { value } = fieldData;
          if (!value || value.trim() === '') return true;
          const employeeValue = employee[field];
          if (employeeValue == null || employeeValue === '') return false;
          return String(employeeValue).toLowerCase().includes(value.toLowerCase());
        } else if (fieldData.checkbox !== undefined) {
          // Checkbox filtering - show only employees with non-empty values for this field
          const { checkbox } = fieldData;
          if (!checkbox) return true;
          const employeeValue = employee[field];
          return employeeValue != null && employeeValue !== '' && String(employeeValue).trim() !== '';
        }

        // Check if this is one of the simplified fields that only shows email input
        const simplifiedFields = ['personalEmail', 'phone', 'dateOfJoining', 'dateOfBirth', 'location', 'gradeLevel', 'reportingTo', 'function', 'age', 'bloodGroup', 'maritalStatus', 'fathersName', 'primaryContactNumber', 'secondaryContactNumber', 'emergencyContactNumber', 'presentAddressLine1', 'presentAddressLine2', 'presentCity', 'presentState', 'presentPostalCode', 'presentCountry', 'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPostalCode', 'permanentCountry', 'aadhaarNumber', 'panNumber', 'uanNo', 'pfNo', 'esicNo', 'drivingLicenseNumber', 'drivingLicenseExpiryDate', 'overallExperience', 'relevantExperience', 'sourceOfHire', 'ratePerHour'];
        
        if (simplifiedFields.includes(field)) {
          // Simplified filtering for specified fields - just text search
          const { value } = fieldData;
          if (!value || value.trim() === '') return true;
          const employeeValue = employee[field];
          if (employeeValue == null || employeeValue === '') return false;
          return String(employeeValue).toLowerCase().includes(value.toLowerCase());
        }

        // Regular filtering for other fields
        const { mode, value } = fieldData;
        const employeeValue = employee[field] != null ? String(employee[field]).toLowerCase() : '';
        const isEmpty = !employeeValue;
        const lowerSearchValue = value.toLowerCase();

        if (mode === 'is') {
          return employeeValue.includes(lowerSearchValue);
        } else if (mode === 'is not') {
          return !employeeValue.includes(lowerSearchValue);
        } else if (mode === 'is empty') {
          return isEmpty;
        } else if (mode === 'is not empty') {
          return !isEmpty;
        }
        return true;
      });
    });
  }, [employees, searchFields]);

  useEffect(() => {
    setFilteredEmployees(filteredData);
  }, [filteredData]);

  // Fetch all employee codes for dropdown
  const fetchAllEmployeeCodes = useCallback(async () => {
    setLoadingEmployeeCodes(true);
    try {
      const params = { showAll: true }; // Fetch all employees without pagination
      
      // Add user role and email for contractor filtering
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueCodes = [...new Set(allEmployees
          .map(emp => emp.employeeCode)
          .filter(code => code && code.trim() !== '')
        )].sort();
        setEmployeeCodes(uniqueCodes);
        console.log('Fetched all employee codes:', uniqueCodes.length);
      }
    } catch (error) {
      console.error('Failed to fetch all employee codes:', error);
      // Fallback to current employees if available
      if (employees && employees.length > 0) {
        const uniqueCodes = [...new Set(employees
          .map(emp => emp.employeeCode)
          .filter(code => code && code.trim() !== '')
        )].sort();
        setEmployeeCodes(uniqueCodes);
      }
    } finally {
      setLoadingEmployeeCodes(false);
    }
  }, [userRole, userEmail, employees]);

  // Fetch all employee names for dropdown
  const fetchAllEmployeeNames = useCallback(async () => {
    setLoadingEmployeeNames(true);
    try {
      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueNames = [...new Set(allEmployees
          .map(emp => emp.employeeName)
          .filter(name => name && name.trim() !== '')
        )].sort();
        setEmployeeNames(uniqueNames);
      }
    } catch (error) {
      console.error('Failed to fetch employee names:', error);
    } finally {
      setLoadingEmployeeNames(false);
    }
  }, [userRole, userEmail]);

  // Fetch all contractors for dropdown
  const fetchAllContractors = useCallback(async () => {
    setLoadingContractors(true);
    try {
      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueContractors = [...new Set(allEmployees
          .map(emp => emp.contractor)
          .filter(contractor => contractor && contractor.trim() !== '')
        )].sort();
        setContractors(uniqueContractors);
      }
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    } finally {
      setLoadingContractors(false);
    }
  }, [userRole, userEmail]);



  // Fetch all employment types for dropdown
  const fetchAllEmploymentTypes = useCallback(async () => {
    console.log('Fetching employment types...');
    setLoadingEmploymentTypes(true);
    try {
      // Use the existing employee data if available, otherwise fetch all employees
      if (employees && employees.length > 0) {
        const uniqueEmploymentTypes = [...new Set(employees
          .map(emp => emp.employmentType)
          .filter(type => type && type.trim() !== '')
        )].sort();
        console.log('Unique employment types from existing data:', uniqueEmploymentTypes);
        setEmploymentTypes(uniqueEmploymentTypes);
        setLoadingEmploymentTypes(false);
        return;
      }

      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      console.log('Employment types response:', response.data);
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueEmploymentTypes = [...new Set(allEmployees
          .map(emp => emp.employmentType)
          .filter(type => type && type.trim() !== '')
        )].sort();
        console.log('Unique employment types:', uniqueEmploymentTypes);
        setEmploymentTypes(uniqueEmploymentTypes);
      } else {
        console.log('No employees data found for employment types');
      }
    } catch (error) {
      console.error('Failed to fetch employment types:', error);
    } finally {
      setLoadingEmploymentTypes(false);
    }
  }, [userRole, userEmail, employees]);

  // Fetch all skills for dropdown
  const fetchAllSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      // Use the existing employee data if available, otherwise fetch all employees
      if (employees && employees.length > 0) {
        const allSkills = [];
        employees.forEach(emp => {
          if (emp.skills) {
            if (Array.isArray(emp.skills)) {
              allSkills.push(...emp.skills);
            } else if (typeof emp.skills === 'string' && emp.skills.trim() !== '') {
              // Handle skills stored as comma-separated string
              const skillsArray = emp.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
              allSkills.push(...skillsArray);
            }
          }
        });
        const uniqueSkills = [...new Set(allSkills
          .filter(skill => skill && skill.trim() !== '')
        )].sort();
        console.log('Unique skills from existing data:', uniqueSkills);
        setSkills(uniqueSkills);
        setLoadingSkills(false);
        return;
      }

      // Fallback: fetch from server if no local data
      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const allSkills = [];
        allEmployees.forEach(emp => {
          if (emp.skills) {
            if (Array.isArray(emp.skills)) {
              allSkills.push(...emp.skills);
            } else if (typeof emp.skills === 'string' && emp.skills.trim() !== '') {
              // Handle skills stored as comma-separated string
              const skillsArray = emp.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
              allSkills.push(...skillsArray);
            }
          }
        });
        const uniqueSkills = [...new Set(allSkills
          .filter(skill => skill && skill.trim() !== '')
        )].sort();
        setSkills(uniqueSkills);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoadingSkills(false);
    }
  }, [userRole, userEmail, employees]);

  // Fetch all exit dates for dropdown
  const fetchAllExitDates = useCallback(async () => {
    console.log('Fetching exit dates...');
    setLoadingExitDates(true);
    try {
      // Use the existing employee data if available, otherwise fetch all employees
      if (employees && employees.length > 0) {
        const uniqueExitDates = [...new Set(employees
          .map(emp => emp.dateOfExit)
          .filter(date => date && date.trim() !== '')
        )].sort();
        console.log('Unique exit dates from existing data:', uniqueExitDates);
        setExitDates(uniqueExitDates);
        setLoadingExitDates(false);
        return;
      }

      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      console.log('Exit dates response:', response.data);
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueExitDates = [...new Set(allEmployees
          .map(emp => emp.dateOfExit)
          .filter(date => date && date.trim() !== '')
        )].sort();
        console.log('Unique exit dates:', uniqueExitDates);
        setExitDates(uniqueExitDates);
      } else {
        console.log('No employees data found for exit dates');
      }
    } catch (error) {
      console.error('Failed to fetch exit dates:', error);
    } finally {
      setLoadingExitDates(false);
    }
  }, [userRole, userEmail, employees]);

  // Fetch all genders for dropdown
  const fetchAllGenders = useCallback(async () => {
    console.log('Fetching genders...');
    setLoadingGenders(true);
    try {
      // Use the existing employee data if available, otherwise fetch all employees
      if (employees && employees.length > 0) {
        const uniqueGenders = [...new Set(employees
          .map(emp => emp.gender)
          .filter(gender => gender && gender.trim() !== '')
        )].sort();
        console.log('Unique genders from existing data:', uniqueGenders);
        setGenders(uniqueGenders);
        setLoadingGenders(false);
        return;
      }

      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      console.log('Genders response:', response.data);
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueGenders = [...new Set(allEmployees
          .map(emp => emp.gender)
          .filter(gender => gender && gender.trim() !== '')
        )].sort();
        console.log('Unique genders:', uniqueGenders);
        setGenders(uniqueGenders);
      } else {
        console.log('No employees data found for genders');
      }
    } catch (error) {
      console.error('Failed to fetch genders:', error);
    } finally {
      setLoadingGenders(false);
    }
  }, [userRole, userEmail, employees]);

  const fetchAllSkillTypes = useCallback(async () => {
    console.log('Fetching skill types...');
    setLoadingSkillTypes(true);
    try {
      // Use the existing employee data if available, otherwise fetch all employees
      if (employees && employees.length > 0) {
        const uniqueSkillTypes = [...new Set(employees
          .map(emp => emp.skillsType)
          .filter(skillType => skillType && skillType.trim() !== '')
        )].sort();
        console.log('Unique skill types from existing data:', uniqueSkillTypes);
        setSkillTypes(uniqueSkillTypes);
        setLoadingSkillTypes(false);
        return;
      }

      const params = { showAll: true };
      if (userRole && userEmail) {
        params.userRole = userRole;
        params.userEmail = userEmail;
      }
      
      const response = await axios.get('/server/cms_function/employees', { 
        params, 
        timeout: 10000 
      });
      
      console.log('Skill types response:', response.data);
      
      if (response?.data?.data?.employees) {
        const allEmployees = response.data.data.employees;
        const uniqueSkillTypes = [...new Set(allEmployees
          .map(emp => emp.skillsType)
          .filter(skillType => skillType && skillType.trim() !== '')
        )].sort();
        console.log('Unique skill types:', uniqueSkillTypes);
        setSkillTypes(uniqueSkillTypes);
      } else {
        console.log('No employees data found for skill types');
      }
    } catch (error) {
      console.error('Failed to fetch skill types:', error);
    } finally {
      setLoadingSkillTypes(false);
    }
  }, [userRole, userEmail, employees]);

  // Populate employee codes when employees are loaded (fallback)
  useEffect(() => {
    if (employees && employees.length > 0 && employeeCodes.length === 0) {
      const uniqueCodes = [...new Set(employees
        .map(emp => emp.employeeCode)
        .filter(code => code && code.trim() !== '')
      )].sort();
      setEmployeeCodes(uniqueCodes);
    }
  }, [employees, employeeCodes.length]);

  // Filter employee codes based on search input
  const filteredEmployeeCodes = useMemo(() => {
    if (!employeeCodeSearch.trim()) {
      return employeeCodes;
    }
    return employeeCodes.filter(code => 
      code.toLowerCase().includes(employeeCodeSearch.toLowerCase())
    );
  }, [employeeCodes, employeeCodeSearch]);

  // Filter employee names based on search input
  const filteredEmployeeNames = useMemo(() => {
    if (!employeeNameSearch.trim()) {
      return employeeNames;
    }
    return employeeNames.filter(name => 
      name.toLowerCase().includes(employeeNameSearch.toLowerCase())
    );
  }, [employeeNames, employeeNameSearch]);

  // Filter contractors based on search input
  const filteredContractors = useMemo(() => {
    if (!contractorSearch.trim()) {
      return contractors;
    }
    return contractors.filter(contractor => 
      contractor.toLowerCase().includes(contractorSearch.toLowerCase())
    );
  }, [contractors, contractorSearch]);



  // Filter employment types based on search input
  const filteredEmploymentTypes = useMemo(() => {
    if (!employmentTypeSearch.trim()) {
      return employmentTypes;
    }
    return employmentTypes.filter(type => 
      type.toLowerCase().includes(employmentTypeSearch.toLowerCase())
    );
  }, [employmentTypes, employmentTypeSearch]);

  // Filter skills based on search input
  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) {
      return skills;
    }
    return skills.filter(skill => 
      skill.toLowerCase().includes(skillSearch.toLowerCase())
    );
  }, [skills, skillSearch]);

  // Filter exit dates based on search input
  const filteredExitDates = useMemo(() => {
    if (!exitDateSearch.trim()) {
      return exitDates;
    }
    return exitDates.filter(date => 
      date.toLowerCase().includes(exitDateSearch.toLowerCase())
    );
  }, [exitDates, exitDateSearch]);

  // Filter genders based on search input
  const filteredGenders = useMemo(() => {
    if (!genderSearch.trim()) {
      return genders;
    }
    return genders.filter(gender => 
      gender.toLowerCase().includes(genderSearch.toLowerCase())
    );
  }, [genders, genderSearch]);

  // Filter skill types based on search input
  const filteredSkillTypes = useMemo(() => {
    if (!skillTypeSearch.trim()) {
      return skillTypes;
    }
    return skillTypes.filter(skillType => 
      skillType.toLowerCase().includes(skillTypeSearch.toLowerCase())
    );
  }, [skillTypes, skillTypeSearch]);

  const resetSearch = useCallback(() => {
    setEmployeeCodeSearch('');
    setIsEmployeeCodeDropdownOpen(false);
    setEmployeeNameSearch('');
    setIsEmployeeNameDropdownOpen(false);
    setContractorSearch('');
    setIsContractorDropdownOpen(false);
    setEmploymentTypeSearch('');
    setIsEmploymentTypeDropdownOpen(false);
    setSkillSearch('');
    setIsSkillDropdownOpen(false);
    setExitDateSearch('');
    setIsExitDateDropdownOpen(false);
    setGenderSearch('');
    setIsGenderDropdownOpen(false);
    setSkillTypeSearch('');
    setIsSkillTypeDropdownOpen(false);
    setSearchFields({
      // Basic Information
      employeeCode: { enabled: false, selectedCode: '' },
      employeeName: { enabled: false, selectedName: '' },
      personalEmail: { enabled: false, value: '' },
      phone: { enabled: false, value: '' },
      contractor: { enabled: false, selectedContractor: '' },
      dateOfJoining: { enabled: false, value: '' },
      dateOfExit: { enabled: false, selectedExitDate: '' },
      employmentType: { enabled: false, selectedEmploymentType: '' },
      location: { enabled: false, value: '' },
      gradeLevel: { enabled: false, value: '' },
      reportingTo: { enabled: false, value: '' },
      function: { enabled: false, value: '' },
      skills: { enabled: false, selectedSkill: '' },
      skillsType: { enabled: false, selectedSkillType: '' },
     
    // Personal Information
      dateOfBirth: { enabled: false, value: '' },
      age: { enabled: false, value: '' },
      gender: { enabled: false, selectedGender: '' },
      bloodGroup: { enabled: false, value: '' },
      maritalStatus: { enabled: false, mode: 'is', value: '' },
      fathersName: { enabled: false, value: '' },
     
      // Contact Information
      primaryContactNumber: { enabled: false, value: '' },
      secondaryContactNumber: { enabled: false, value: '' },
      emergencyContactNumber: { enabled: false, value: '' },
     
      // Address Information - Present
      presentAddressLine1: { enabled: false, value: '' },
      presentAddressLine2: { enabled: false, value: '' },
      presentCity: { enabled: false, value: '' },
      presentState: { enabled: false, value: '' },
      presentPostalCode: { enabled: false, value: '' },
      presentCountry: { enabled: false, value: '' },
     
      // Address Information - Permanent
      permanentAddressLine1: { enabled: false, value: '' },
      permanentAddressLine2: { enabled: false, value: '' },
      permanentCity: { enabled: false, value: '' },
      permanentState: { enabled: false, value: '' },
      permanentPostalCode: { enabled: false, value: '' },
      permanentCountry: { enabled: false, value: '' },
     
      // Government IDs
      aadhaarNumber: { enabled: false, value: '' },
      panNumber: { enabled: false, value: '' },
      uanNo: { enabled: false, value: '' },
      pfNo: { enabled: false, value: '' },
      esicNo: { enabled: false, value: '' },
      drivingLicenseNumber: { enabled: false, value: '' },
      drivingLicenseExpiryDate: { enabled: false, value: '' },
     
      // Professional Information
      overallExperience: { enabled: false, value: '' },
      relevantExperience: { enabled: false, value: '' },
      sourceOfHire: { enabled: false, value: '' },
      skills: { enabled: false, mode: 'is', value: '' },
      skillsType: { enabled: false, mode: 'is', value: '' },
      ratePerHour: { enabled: false, value: '' },
    });
    setPage(1);
    setShowAll(false);
  }, []);

  const toggleSearchDropdown = useCallback(() => {
    setShowSearchDropdown((prev) => !prev);
  }, []);

  const handleFieldToggle = useCallback((field) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        enabled: !prev[field].enabled,
        value: !prev[field].enabled ? prev[field].value : '',
      },
    }));
  }, []);

  const handleModeChange = useCallback((field, mode) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        mode,
        value: mode === 'is' || mode === 'is not' ? prev[field].value : '',
      },
    }));
  }, []);

  const handleSearchValueChange = useCallback((field, value) => {
    setSearchFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
      },
    }));
  }, []);

  const handleEmployeeCodeChange = useCallback((selectedCode) => {
    setSearchFields((prev) => ({
      ...prev,
      employeeCode: {
        ...prev.employeeCode,
        selectedCode,
      },
    }));
  }, []);

  const handleEmployeeCodeSearchChange = useCallback((searchValue) => {
    setEmployeeCodeSearch(searchValue);
  }, []);

  const handleEmployeeCodeDropdownToggle = useCallback(() => {
    setIsEmployeeCodeDropdownOpen(prev => {
      if (!prev) {
        // When opening dropdown, refresh employee codes
        fetchAllEmployeeCodes();
      }
      return !prev;
    });
  }, [fetchAllEmployeeCodes]);

  const handleEmployeeCodeSelect = useCallback((selectedCode) => {
    console.log('Employee Code selected:', selectedCode);
    setSearchFields((prev) => ({
      ...prev,
      employeeCode: {
        ...prev.employeeCode,
        selectedCode,
      },
    }));
    setIsEmployeeCodeDropdownOpen(false);
    setEmployeeCodeSearch('');
  }, []);

  // Employee Name handlers
  const handleEmployeeNameDropdownToggle = useCallback(() => {
    setIsEmployeeNameDropdownOpen(prev => {
      if (!prev) {
        fetchAllEmployeeNames();
      }
      return !prev;
    });
  }, [fetchAllEmployeeNames]);

  const handleEmployeeNameSelect = useCallback((selectedName) => {
    setSearchFields((prev) => ({
      ...prev,
      employeeName: {
        ...prev.employeeName,
        selectedName,
      },
    }));
    setIsEmployeeNameDropdownOpen(false);
    setEmployeeNameSearch('');
  }, []);

  // Contractor handlers
  const handleContractorDropdownToggle = useCallback(() => {
    setIsContractorDropdownOpen(prev => {
      if (!prev) {
        fetchAllContractors();
      }
      return !prev;
    });
  }, [fetchAllContractors]);

  const handleContractorSelect = useCallback((selectedContractor) => {
    setSearchFields((prev) => ({
      ...prev,
      contractor: {
        ...prev.contractor,
        selectedContractor,
      },
    }));
    setIsContractorDropdownOpen(false);
    setContractorSearch('');
  }, []);





  // Employment Type handlers
  const handleEmploymentTypeDropdownToggle = useCallback(() => {
    setIsEmploymentTypeDropdownOpen(prev => {
      if (!prev) {
        fetchAllEmploymentTypes();
      }
      return !prev;
    });
  }, [fetchAllEmploymentTypes]);

  const handleEmploymentTypeSelect = useCallback((selectedEmploymentType) => {
    setSearchFields((prev) => ({
      ...prev,
      employmentType: {
        ...prev.employmentType,
        selectedEmploymentType,
      },
    }));
    setIsEmploymentTypeDropdownOpen(false);
    setEmploymentTypeSearch('');
  }, []);

  // Skills handlers
  const handleSkillDropdownToggle = useCallback(() => {
    setIsSkillDropdownOpen(prev => {
      if (!prev) {
        fetchAllSkills();
      }
      return !prev;
    });
  }, [fetchAllSkills]);

  const handleSkillSelect = useCallback((selectedSkill) => {
    setSearchFields((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        selectedSkill,
      },
    }));
    setIsSkillDropdownOpen(false);
    setSkillSearch('');
  }, []);

  // Exit Date handlers
  const handleExitDateDropdownToggle = useCallback(() => {
    setIsExitDateDropdownOpen(prev => {
      if (!prev) {
        fetchAllExitDates();
      }
      return !prev;
    });
  }, [fetchAllExitDates]);

  const handleExitDateSelect = useCallback((selectedExitDate) => {
    setSearchFields((prev) => ({
      ...prev,
      dateOfExit: {
        ...prev.dateOfExit,
        selectedExitDate,
      },
    }));
    setIsExitDateDropdownOpen(false);
    setExitDateSearch('');
  }, []);

  // Gender handlers
  const handleGenderDropdownToggle = useCallback(() => {
    setIsGenderDropdownOpen(prev => {
      if (!prev) {
        fetchAllGenders();
      }
      return !prev;
    });
  }, [fetchAllGenders]);

  const handleGenderSelect = useCallback((selectedGender) => {
    setSearchFields((prev) => ({
      ...prev,
      gender: {
        ...prev.gender,
        selectedGender,
      },
    }));
    setIsGenderDropdownOpen(false);
    setGenderSearch('');
  }, []);

  // Skills Type handlers
  const handleSkillTypeDropdownToggle = useCallback(() => {
    setIsSkillTypeDropdownOpen(prev => {
      if (!prev) {
        fetchAllSkillTypes();
      }
      return !prev;
    });
  }, [fetchAllSkillTypes]);

  const handleSkillTypeSelect = useCallback((selectedSkillType) => {
    setSearchFields((prev) => ({
      ...prev,
      skillsType: {
        ...prev.skillsType,
        selectedSkillType,
      },
    }));
    setIsSkillTypeDropdownOpen(false);
    setSkillTypeSearch('');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEmployeeCodeDropdownOpen && !event.target.closest('[data-dropdown="employeeCode"]')) {
        setIsEmployeeCodeDropdownOpen(false);
        setEmployeeCodeSearch('');
      }
      if (isEmployeeNameDropdownOpen && !event.target.closest('[data-dropdown="employeeName"]')) {
        setIsEmployeeNameDropdownOpen(false);
        setEmployeeNameSearch('');
      }
      if (isContractorDropdownOpen && !event.target.closest('[data-dropdown="contractor"]')) {
        setIsContractorDropdownOpen(false);
        setContractorSearch('');
      }
      if (isEmploymentTypeDropdownOpen && !event.target.closest('[data-dropdown="employmentType"]')) {
        setIsEmploymentTypeDropdownOpen(false);
        setEmploymentTypeSearch('');
      }
      if (isSkillDropdownOpen && !event.target.closest('[data-dropdown="skills"]')) {
        setIsSkillDropdownOpen(false);
        setSkillSearch('');
      }
      if (isExitDateDropdownOpen && !event.target.closest('[data-dropdown="dateOfExit"]')) {
        setIsExitDateDropdownOpen(false);
        setExitDateSearch('');
      }
      if (isGenderDropdownOpen && !event.target.closest('[data-dropdown="gender"]')) {
        setIsGenderDropdownOpen(false);
        setGenderSearch('');
      }
      if (isSkillTypeDropdownOpen && !event.target.closest('[data-dropdown="skillsType"]')) {
        setIsSkillTypeDropdownOpen(false);
        setSkillTypeSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmployeeCodeDropdownOpen, isEmployeeNameDropdownOpen, isContractorDropdownOpen, isEmploymentTypeDropdownOpen, isSkillDropdownOpen, isExitDateDropdownOpen, isGenderDropdownOpen, isSkillTypeDropdownOpen]);

  // Helper function to create dropdown UI
  const createDropdownUI = (field, label, data, searchValue, setSearchValue, isOpen, setIsOpen, onSelect, loading, filteredData) => {
    // Get the correct selected value based on field type
    const getSelectedValue = () => {
      const fieldData = searchFields[field];
      if (field === 'employeeCode') return fieldData.selectedCode;
      if (field === 'employeeName') return fieldData.selectedName;
      if (field === 'contractor') return fieldData.selectedContractor;
      if (field === 'employmentType') return fieldData.selectedEmploymentType;
      if (field === 'skills') return fieldData.selectedSkill;
      if (field === 'dateOfExit') return fieldData.selectedExitDate;
      if (field === 'gender') return fieldData.selectedGender;
      if (field === 'skillsType') return fieldData.selectedSkillType;
      return '';
    };

    const selectedValue = getSelectedValue();

    return (
      <div className="dropdown-container" style={{ position: 'relative' }} data-dropdown={field}>
        <div
          onClick={() => setIsOpen(prev => {
            if (!prev && data.length === 0) {
              console.log(`Opening ${field} dropdown, data length:`, data.length);
              // Fetch data when opening if not loaded
              if (field === 'employeeName') fetchAllEmployeeNames();
              else if (field === 'contractor') fetchAllContractors();
              else if (field === 'employmentType') {
                console.log('Calling fetchAllEmploymentTypes...');
                fetchAllEmploymentTypes();
              }
              else if (field === 'skills') fetchAllSkills();
              else if (field === 'dateOfExit') {
                console.log('Calling fetchAllExitDates...');
                fetchAllExitDates();
              }
              else if (field === 'gender') {
                console.log('Calling fetchAllGenders...');
                fetchAllGenders();
              }
              else if (field === 'skillsType') {
                console.log('Calling fetchAllSkillTypes...');
                fetchAllSkillTypes();
              }
            }
            return !prev;
          })}
          style={{
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '32px'
          }}
        >
          <span style={{ color: selectedValue ? '#000' : '#6b7280' }}>
            {selectedValue || `Select ${label}`}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxHeight: '200px',
            overflow: 'hidden'
          }}>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={selectedValue ? selectedValue : `Search ${label.toLowerCase()}...`}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
              autoFocus
            />
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Loading {label.toLowerCase()}...
                </div>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <div
                    key={item}
                    onClick={() => onSelect(item)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: selectedValue === item ? '#e3f2fd' : 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedValue !== item) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedValue !== item) {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  No {label.toLowerCase()} found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Validate employee data (similar to validateForm but for imports)
  const validateImportedEmployee = useCallback((emp, rowIndex) => {
    const errors = [];
    if (!emp.employeeCode) errors.push('Employee Code is required.');
    if (!emp.employeeName) errors.push('Employee Name is required.');
    if (emp.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.personalEmail)) {
      errors.push('Invalid email format.');
    }
    if (emp.phone != null && !/^\d{10}$/.test(String(emp.phone))) {
      errors.push('Phone must be a 10-digit number if provided.');
    }
    if (emp.dateOfJoining && !/^\d{4}-\d{2}-\d{2}$/.test(emp.dateOfJoining)) {
      errors.push('Date of Joining must be in YYYY-MM-DD format.');
    }
    if (emp.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(emp.dateOfBirth)) {
      errors.push('Date of Birth must be in YYYY-MM-DD format.');
    }
    if (emp.emergencyContactNumber != null && !/^\d{10}$/.test(String(emp.emergencyContactNumber))) {
      errors.push('Emergency Contact Number must be a 10-digit number if provided.');
    }
    // Age validation - must be 18 or above
    if (emp.age != null) {
      const ageNum = parseInt(emp.age);
      if (isNaN(ageNum) || ageNum < 1) {
        errors.push('Age must be a valid positive number.');
      } else if (ageNum < 18) {
        errors.push('Employee must be 18 years or older.');
      }
    }
    if (emp.esicNo != null && !/^[A-Za-z0-9]{10}$/.test(String(emp.esicNo))) {
      errors.push('ESIC No must be 10 digits (alphanumeric).');
    }
    if (emp.pfNo != null && !/^[A-Za-z0-9]{15}$/.test(String(emp.pfNo))) {
      errors.push('PF No must be 15 digits (alphanumeric).');
    }
    if (emp.uanNo != null && !/^\d+$/.test(String(emp.uanNo))) {
      errors.push('UAN No must be a number if provided.');
    }
    if (errors.length > 0) {
      return `Row ${rowIndex}: ${errors.join(', ')}`;
    }
    return null;
  }, []);

  // Import Excel file
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

        const numericFields = ['phone', 'pfNo', 'esicNo', 'uanNo', 'age', 'emergencyContactNumber'];
        // Track employee codes to detect duplicates
        const employeeCodes = new Set();
        const duplicateCodes = new Set();

        const newEmployees = jsonData.map((row, index) => {
          const safeToString = (value, isNumeric = false) => {
            if (value == null || value === '') return isNumeric ? null : '';
            if (isNumeric) {
              const num = Number(value);
              return isNaN(num) ? null : num;
            }
            return String(value);
          };

          // Check for duplicate employee codes
          const employeeCode = safeToString(row['Employee Code']);
          if (employeeCode && employeeCodes.has(employeeCode)) {
            duplicateCodes.add(employeeCode);
            console.warn(`Duplicate Employee Code found: ${employeeCode} at row ${index + 2}`);
          }
          if (employeeCode) {
            employeeCodes.add(employeeCode);
          }

          // Calculate age from date of birth if provided
          const dateOfBirth = safeToString(row['Date of Birth']);
          let calculatedAge = safeToString(row['Age'], true);
         
          // If date of birth is provided but age is not, calculate age
          if (dateOfBirth && !calculatedAge) {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
           
            if (!isNaN(birthDate.getTime())) {
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
             
              // Adjust age if birthday hasn't occurred this year
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
             
              calculatedAge = age > 0 ? age : null;
            }
          }

           const emp = {
             employeeCode: safeToString(row['Employee Code']),
             employeeName: safeToString(row['Name']),
             personalEmail: safeToString(row['Email']) || null,
             phone: safeToString(row['Phone'], true),
             contractor: safeToString(row['Contractor']),
             dateOfJoining: safeToString(row['Date of Joining']),
             dateOfExit: safeToString(row['Date of Exit']),
             overallExperience: safeToString(row['Overall Experience']),
             relevantExperience: safeToString(row['Relevant Experience']),
             sourceOfHire: safeToString(row['Source of Hire']),
             department: safeToString(row['Department']),
             designation: safeToString(row['Designation']),
             pfNo: safeToString(row['PF No'], true),
             esicNo: safeToString(row['ESIC No'], true),
             location: safeToString(row['Location']),
             gradeLevel: safeToString(row['Grade Level']),
             uanNo: safeToString(row['UAN No'], true),
             dateOfBirth: dateOfBirth,
             fathersName: safeToString(row["Father Name/Spouse Name"]),
             age: calculatedAge,
             emergencyContactNumber: safeToString(row['Emergency Contact'], true),
             gender: safeToString(row['Gender']),
             bloodGroup: safeToString(row['Blood Group']),
             maritalStatus: safeToString(row['Marital Status']),
             presentAddressLine1: safeToString(row['Present Address Line 1']),
             presentAddressLine2: safeToString(row['Present Address Line 2']),
             presentCity: safeToString(row['Present City']),
             presentState: safeToString(row['Present State']),
             presentPostalCode: safeToString(row['Present Postal Code']),
             presentCountry: safeToString(row['Present Country']),
             permanentAddressLine1: safeToString(row['Permanent Address Line 1']),
             permanentAddressLine2: safeToString(row['Permanent Address Line 2']),
             permanentCity: safeToString(row['Permanent City']),
             permanentState: safeToString(row['Permanent State']),
             permanentPostalCode: safeToString(row['Permanent Postal Code']),
             permanentCountry: safeToString(row['Permanent Country']),
             aadhaarNumber: safeToString(row['Aadhaar Number']),
             panNumber: safeToString(row['PAN Number']),
           };

          // Check for duplicate employee codes
          if (duplicateCodes.has(emp.employeeCode)) {
            const error = `Row ${index + 2}: Duplicate Employee Code '${emp.employeeCode}' found. Each employee must have a unique code.`;
            console.error(error);
            throw new Error(error);
          }

          // Debug: Log employee data for failed rows (rows 33+)
          if (index + 2 >= 33) {
            console.log(`Row ${index + 2} employee data:`, emp);
          }

          const validationError = validateImportedEmployee(emp, index + 2);
          if (validationError) {
            console.error(`Row ${index + 2} validation error:`, validationError);
            throw new Error(validationError);
          }

          return emp;
        });

        // Log duplicate codes summary
        if (duplicateCodes.size > 0) {
          console.warn(`Found ${duplicateCodes.size} duplicate Employee Codes:`, Array.from(duplicateCodes));
        }

        // Check for existing employee codes in database
        console.log('Checking for existing employee codes in database...');
        let existingCodes = new Set();
        try {
          const existingCodesResponse = await axios.get('/server/cms_function/employees?perPage=1000');
          const existingEmployees = existingCodesResponse.data.data.employees || [];
          existingCodes = new Set(existingEmployees.map(emp => emp.employeeCode));
          console.log(`Found ${existingCodes.size} existing employee codes in database`);
        } catch (error) {
          console.warn('Could not check existing employee codes:', error);
        }
       
        // Filter out employees with existing codes
        const employeesToImport = newEmployees.filter((emp, index) => {
          if (existingCodes.has(emp.employeeCode)) {
            console.warn(`Row ${index + 2}: Employee Code '${emp.employeeCode}' already exists in database. Skipping.`);
            return false;
          }
          return true;
        });

        console.log(`Importing ${employeesToImport.length} out of ${newEmployees.length} employees (${newEmployees.length - employeesToImport.length} skipped due to existing codes)`);

        Promise.all(
          employeesToImport.map((emp, index) =>
            axios.post('/server/cms_function/employees', emp, { timeout: 5000 })
              .then(response => {
                if (!response?.data?.data?.employee) {
                  throw new Error(`Unexpected API response structure for row ${index + 2}`);
                }
                return response.data.data.employee;
              })
              .catch(err => {
                const errorMessage = err.response?.data?.message || err.message || `Failed to import row ${index + 2}`;
                console.error(`Import error for employee at row ${index + 2}:`, emp, err);
                console.error(`Full error details for row ${index + 2}:`, {
                  error: err,
                  response: err.response?.data,
                  employee: emp
                });
                return { error: errorMessage, row: index + 2, employee: emp };
              })
          )
        )
          .then(results => {
            const successfulImports = results.filter(result => !result?.error);
            const failedImports = results.filter(result => result?.error);
            console.log('Import results summary:', {
              total: newEmployees.length,
              successful: successfulImports.length,
              failed: failedImports.length,
              failedDetails: failedImports
            });

            if (successfulImports.length === 0) {
              setImportError('Failed to import any employees. See errors below.');
            } else {
              fetchEmployees(); // Refetch employees after import
              if (failedImports.length > 0) {
                // Show first few errors in detail, then summarize the rest
                const firstFewErrors = failedImports.slice(0, 5).map(f => `Row ${f.row}: ${f.error}`);
                const remainingCount = failedImports.length - 5;
                const errorSummary = remainingCount > 0
                  ? `${firstFewErrors.join('; ')}; ... and ${remainingCount} more rows failed`
                  : firstFewErrors.join('; ');
               
                setImportError(
                  `Imported ${successfulImports.length} out of ${newEmployees.length} employees. Failed rows: ${errorSummary}`
                );
              }
            }
          })
          .catch(err => {
            setImportError(err.message || 'An error occurred while importing employees.');
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
  }, [validateImportedEmployee, fetchEmployees]);

  // Export to Excel with all stored data
  const handleExport = useCallback(() => {
    if (filteredEmployees.length === 0) {
      setExportError('No data to export.');
      return;
    }

    setExporting(true);
    setExportError('');

    try {
      const requiredFields = ['employeeCode', 'employeeName', 'phone', 'department', 'aadhaarNumber'];
      const invalidEmployees = filteredEmployees.filter(emp =>
        !emp || typeof emp !== 'object' || requiredFields.some(field => emp[field] == null)
      );
      if (invalidEmployees.length > 0) {
        console.warn('Some employees have missing required fields:', invalidEmployees);
        setExportError('Some employees have missing required fields. Export may be incomplete.');
      }

      const exportData = filteredEmployees.map(emp => ({
        'Employee Code': emp.employeeCode || '',
        'Name': emp.employeeName || '',
        'Email': emp.personalEmail || '',
        'Phone': emp.phone || '',
        'Contractor': emp.contractor || '',
        'Date of Joining': emp.dateOfJoining || '',
        'Date of Exit': emp.dateOfExit || '',
        'Employment Type': emp.employmentType || '',
        'Overall Experience': emp.overallExperience || '',
        'Relevant Experience': emp.relevantExperience || '',
        'Source of Hire': emp.sourceOfHire || '',
        'Department': emp.department || '',
        'Designation': emp.designation || '',
        'PF No': emp.pfNo || '',
        'ESIC No': emp.esicNo || '',
        'Location': emp.location || '',
        'Grade Level': emp.gradeLevel || '',
        'UAN No': emp.uanNo || '',
        'Aadhaar Number': emp.aadhaarNumber || '',
        'PAN Number': emp.panNumber || '',
        'Date of Birth': emp.dateOfBirth || '',
        "Father Name/Spouse Name": emp.fathersName || '',
        'Age': emp.age || '',
        'Emergency Contact': emp.emergencyContactNumber || '',
        'Gender': emp.gender || '',
        'Blood Group': emp.bloodGroup || '',
        'Marital Status': emp.maritalStatus || '',
        'Present Address Line 1': emp.presentAddressLine1 || '',
        'Present Address Line 2': emp.presentAddressLine2 || '',
        'Present City': emp.presentCity || '',
        'Present State': emp.presentState || '',
        'Present Postal Code': emp.presentPostalCode || '',
        'Present Country': emp.presentCountry || '',
        'Permanent Address Line 1': emp.permanentAddressLine1 || '',
        'Permanent Address Line 2': emp.permanentAddressLine2 || '',
        'Permanent City': emp.permanentCity || '',
        'Permanent State': emp.permanentState || '',
        'Permanent Postal Code': emp.permanentPostalCode || '',
        'Permanent Country': emp.permanentCountry || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      XLSX.writeFile(workbook, 'employees_export.xlsx');
    } catch (err) {
      const errorMessage = err.message || 'Failed to export data to Excel. Please try again.';
      setExportError(errorMessage);
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [filteredEmployees]);





  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown]);

  // Options for select fields in the form
  const employmentTypeOptions = [
    { value: '', label: '-Select-' },
    { value: 'Permanent', label: 'Permanent' },
    { value: 'Temporary', label: 'Temporary' },
  ];

  const [departmentOptions, setDepartmentOptions] = useState([{ value: '', label: '-Select-' }]);

  // Fetch departments from API
  const fetchDepartments = useCallback(() => {
    axios
      .get('/server/department_function/departments')
      .then((res) => {
        const departmentsData = res.data.data.departments || [];
        const options = [{ value: '', label: '-Select-' }].concat(
          departmentsData.map((d) => ({
            value: d.departmentName,
            label: d.departmentName,
          }))
        );
        setDepartmentOptions(options);
        // Also update the departments array for dropdown filtering
        setDepartments(departmentsData.map(d => d.departmentName));
      })
      .catch((err) => {
        console.error('Failed to fetch departments:', err);
        setDepartmentOptions([{ value: '', label: '-Select-' }]);
        setDepartments([]);
      });
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const [designationOptions, setDesignationOptions] = useState([{ value: '', label: '-Select-' }]);

  // Fetch designations from API
  const fetchDesignations = useCallback(() => {
    axios
      .get('/server/Designation_function/designations')
      .then((res) => {
        const designationsData = res.data.data.designations || [];
        const options = [{ value: '', label: '-Select-' }].concat(
          designationsData.map((d) => ({
            value: d.designationName,
            label: d.designationName,
          }))
        );
        setDesignationOptions(options);
        // Also update the designations array for dropdown filtering
        setDesignations(designationsData.map(d => d.designationName));
      })
      .catch((err) => {
        console.error('Failed to fetch designations:', err);
        setDesignationOptions([{ value: '', label: '-Select-' }]);
        setDesignations([]);
      });
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const gradeLevelOptions = [
    { value: '', label: '-Select-' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Mid-Level', label: 'Mid-Level' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead' },
  ];

  const reportingToOptions = [
    { value: '', label: '-Select-' },
    { value: 'Manager A', label: 'Manager A' },
    { value: 'Manager B', label: 'Manager B' },
    { value: 'Manager C', label: 'Manager C' },
  ];

  const hrPartnerOptions = [
    { value: '', label: '-Select-' },
    { value: 'HR A', label: 'HR A' },
    { value: 'HR B', label: 'HR B' },
    { value: 'HR C', label: 'HR C' },
  ];

  const nationalHeadOptions = [
    { value: '', label: '-Select-' },
    { value: 'Head A', label: 'Head A' },
    { value: 'Head B', label: 'Head B' },
    { value: 'Head C', label: 'Head C' },
  ];

  const genderOptions = [
    { value: '', label: '-Select-' },
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const bloodGroupOptions = [
    { value: '', label: '-Select-' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  const maritalStatusOptions = [
    { value: '', label: '-Select-' },
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
  ];

  const countryOptions = [
    { value: '', label: '-Select-' },
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'USA' },
    { value: 'UK', label: 'UK' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
  ];


  const [ageAutoCalculated, setAgeAutoCalculated] = useState(false);
  const [ageValid, setAgeValid] = useState(false);

  // Function to calculate age from date of birth
  const calculateAge = useCallback((dateOfBirth) => {
    if (!dateOfBirth) return '';
   
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
   
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) return '';
   
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
   
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
   
    return age > 0 ? age.toString() : '';
  }, []);

  // Function to validate age (must be 18 or above)
  const validateAge = useCallback((age) => {
    if (!age) return { isValid: true, message: '' };
   
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1) {
      return { isValid: false, message: 'Age must be a valid positive number.' };
    }
   
    if (ageNum < 18) {
      return { isValid: false, message: 'Employee must be 18 years or older.' };
    }
   
    return { isValid: true, message: '' };
  }, []);

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name}=${value}`);
   
    // If date of birth is changed, automatically calculate age
    if (name === 'dateOfBirth') {
      const calculatedAge = calculateAge(value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        age: calculatedAge
      }));
     
      // Set flag to indicate age was auto-calculated
      setAgeAutoCalculated(!!calculatedAge);
     
      // Validate the calculated age
      if (calculatedAge) {
        const ageValidation = validateAge(calculatedAge);
        if (!ageValidation.isValid) {
          setFormError(ageValidation.message);
          setAgeValid(false);
        } else {
          setFormError('');
          setAgeValid(true);
        }
      } else {
        setFormError('');
        setAgeValid(false);
      }
    }
    // If age is manually changed, validate it
    else if (name === 'age') {
      setForm((prev) => ({ ...prev, [name]: value }));
     
      // Clear auto-calculated flag when manually changed
      setAgeAutoCalculated(false);
     
      if (value) {
        const ageValidation = validateAge(value);
        if (!ageValidation.isValid) {
          setFormError(ageValidation.message);
          setAgeValid(false);
        } else {
          setFormError('');
          setAgeValid(true);
        }
      } else {
        setFormError('');
        setAgeValid(false);
      }
    }
    // Auto-calculate TotalSalary when ActualBasic or ActualHRA changes
    else if (name === 'actualBasic' || name === 'actualHRA') {
      setForm((prev) => {
        const updatedForm = { ...prev, [name]: value };
        
        // Calculate TotalSalary = ActualBasic + ActualHRA
        const actualBasic = name === 'actualBasic' ? parseFloat(value) || 0 : parseFloat(prev.actualBasic) || 0;
        const actualHRA = name === 'actualHRA' ? parseFloat(value) || 0 : parseFloat(prev.actualHRA) || 0;
        const totalSalary = actualBasic + actualHRA;
        
        return {
          ...updatedForm,
          totalSalary: totalSalary > 0 ? totalSalary.toString() : ''
        };
      });
      setFormError('');
    }
    // For all other fields
    else {
      setForm((prev) => ({ ...prev, [name]: value }));
      setFormError('');
    }
  }, [calculateAge, validateAge]);

  const handleSelectEmployee = useCallback((id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      // If all are selected, deselect all
      setSelectedEmployees([]);
    } else {
      // If not all are selected, select all
      const allIds = filteredEmployees.map(employee => employee.id);
      setSelectedEmployees(allIds);
    }
  }, [allSelected, filteredEmployees]);

  const handleMassDelete = useCallback(() => {
    if (selectedEmployees.length === 0) {
      setMassDeleteError('Please select at least one employee to delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedEmployees.length} employee(s)?`)) {
      return;
    }

    setDeletingMultiple(true);
    setMassDeleteError('');

    Promise.all(
      selectedEmployees.map((id) =>
        axios.delete(`/server/cms_function/employees/${id}`, { timeout: 5000 }).catch((err) => {
          const errorMessage = err.response?.data?.message || `Failed to delete employee (ID: ${id})`;
          console.error(`Mass delete error for ID ${id}:`, err);
          return { error: errorMessage, id };
        })
      )
    )
      .then((results) => {
        const failedDeletions = results.filter((result) => result?.error);
        if (failedDeletions.length > 0) {
          setMassDeleteError(
            'Failed to delete some employees: ' +
            failedDeletions.map((f) => `ID ${f.id}: ${f.error}`).join('; ')
          );
        }
        fetchEmployees(); // Refetch employees after mass delete
        setSelectedEmployees([]);
      })
      .catch((err) => {
        setMassDeleteError('An unexpected error occurred while deleting employees.');
        console.error('Mass delete error:', err);
      })
      .finally(() => setDeletingMultiple(false));
  }, [selectedEmployees, fetchEmployees]);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!form.employeeCode.trim()) errors.push('Employee Code is required.');
    if (!form.employeeName.trim()) errors.push('Employee Name is required.');
    // Email is optional; validate only if provided
    if (form.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalEmail)) {
      errors.push('Invalid email format.');
    }
    if (!form.phone.trim()) errors.push('Phone is required.');
    if (form.phone && form.phone.trim() && !/^\d{10}$/.test(form.phone)) {
      errors.push('Phone must be a 10-digit number.');
    }
    // Date of Joining is optional; validate format only if provided
    if (form.dateOfJoining && form.dateOfJoining.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfJoining)) {
      errors.push('Date of Joining must be in YYYY-MM-DD format.');
    }
    if (!form.department.trim()) errors.push('Department is required.');
    if (form.dateOfBirth && form.dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      errors.push('Date of Birth must be in YYYY-MM-DD format.');
    }
    if (form.emergencyContactNumber && form.emergencyContactNumber.trim() && !/^\d{10}$/.test(form.emergencyContactNumber)) {
      errors.push('Emergency Contact Number must be a 10-digit number if provided.');
    }
    // Age validation - must be 18 or above
    if (form.age && form.age.trim()) {
      const ageNum = parseInt(form.age);
      if (isNaN(ageNum) || ageNum < 1) {
        errors.push('Age must be a valid positive number.');
      } else if (ageNum < 18) {
        errors.push('Employee must be 18 years or older.');
      }
    }
    if (form.esicNo && form.esicNo.trim() && !/^[A-Za-z0-9]{10}$/.test(form.esicNo)) {
      errors.push('ESIC No must be 10 digits (alphanumeric).');
    }
    if (form.pfNo && form.pfNo.trim() && !/^[A-Za-z0-9]{15}$/.test(form.pfNo)) {
      errors.push('PF No must be 15 digits (alphanumeric).');
    }
    if (form.uanNo && form.uanNo.trim() && !/^\d{12}$/.test(form.uanNo)) {
      errors.push('UAN No must be a 12-digit number if provided.');
    }
    if (!form.aadhaarNumber.trim()) errors.push('Aadhaar Number is required.');
    if (form.aadhaarNumber && form.aadhaarNumber.trim() && !/^\d{12}$/.test(form.aadhaarNumber)) {
      errors.push('Aadhaar Number must be a 12-digit number.');
    }
    if (form.drivingLicenseNumber && form.drivingLicenseNumber.trim() && !/^\d{16}$/.test(form.drivingLicenseNumber)) {
      errors.push('Driving License Number must be a 16-digit number if provided.');
    }
    // PAN is optional; validate only if provided
    if (form.panNumber && form.panNumber.trim()) {
      if (!/^.{10}$/.test(form.panNumber)) {
        errors.push('PAN Number must be exactly 10 characters.');
      } else if (form.panNumber[3].toUpperCase() !== 'P') {
        errors.push('PAN Number: The fourth character must be "P".');
      }
    }
    if (errors.length > 0) {
      setFormError(errors.join(' '));
      return false;
    }
    return true;
  }, [form]);

  const saveEmployee = useCallback(
    async (e) => {
      console.log('Save employee function called');
      e.preventDefault();
      console.log('Form validation result:', validateForm());
      if (!validateForm()) return;
      console.log('Starting employee save process');
      setSubmitting(true);

      const requiredFields = ['employeeCode', 'employeeName', 'phone', 'department', 'aadhaarNumber'];
      const cleanedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          value && typeof value === 'string' && value.trim() === '' && !requiredFields.includes(key) ? null : (typeof value === 'string' ? value.trim() : value)
        ])
      );

      // Upload pending files if any
      const pendingFiles = form._pendingFiles || {};
      console.log('Form state before upload:', form);
      console.log('Form keys:', Object.keys(form));
      console.log('Pending files to upload:', pendingFiles);
      console.log('Pending files keys:', Object.keys(pendingFiles));
      const uploadErrors = {};
      const uploadedFileInfo = {};
      for (const key of Object.keys(pendingFiles)) {
        const file = pendingFiles[key];
        console.log('Processing file upload for key:', key, 'file:', file);
        if (!file) {
          console.log('No file found for key:', key);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        console.log('FormData created for key:', key, 'file name:', file.name, 'file size:', file.size);
       
        const uploadUrl = isEditing
          ? `/server/cms_function/employees/${editingEmployeeId}/upload/${key}`
          : `/server/cms_function/employees/upload/${key}`;
        console.log('Upload URL:', uploadUrl);
       
        try {
          console.log('Starting upload request for key:', key);
          const resp = await axios.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 20000,
          });
          console.log('Upload response for key:', key, 'response:', resp.data);
          console.log('Upload response structure:', {
            hasData: !!resp.data,
            hasFileId: !!(resp.data && resp.data.fileId),
            hasFileName: !!(resp.data && resp.data.fileName),
            fileId: resp.data?.fileId,
            fileName: resp.data?.fileName,
            fullResponse: resp.data
          });
         
          if (resp.data && resp.data.fileId) {
            // Normalize the field names to match the form structure
            const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1); // Convert 'Photo' to 'photo'
            uploadedFileInfo[`${normalizedKey}FileId`] = resp.data.fileId;
            uploadedFileInfo[`${normalizedKey}FileName`] = resp.data.fileName;
            console.log('File uploaded successfully for key:', key, 'normalizedKey:', normalizedKey, 'fileId:', resp.data.fileId, 'fileName:', resp.data.fileName);
          } else {
            console.error('Upload response missing fileId for key:', key, 'response:', resp.data);
            // Try alternative response structures
            if (resp.data && resp.data.id) {
              const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
              uploadedFileInfo[`${normalizedKey}FileId`] = resp.data.id;
              uploadedFileInfo[`${normalizedKey}FileName`] = resp.data.name || resp.data.fileName || 'Unknown';
              console.log('Using alternative response structure for key:', key, 'normalizedKey:', normalizedKey, 'fileId:', resp.data.id, 'fileName:', resp.data.name || resp.data.fileName);
            }
          }
        } catch (err) {
          console.error('Upload error for key:', key, 'error:', err);
          console.error('Error response:', err.response?.data);
          console.error('Error status:', err.response?.status);
          uploadErrors[key] = err.response?.data?.message || 'Upload failed.';
        }
      }
      if (Object.keys(uploadErrors).length > 0) {
        console.error('Upload errors found:', uploadErrors);
        setForm(f => ({ ...f, _uploadErrors: uploadErrors }));
        setSubmitting(false);
        return;
      }
     
      console.log('All files uploaded successfully. Uploaded file info:', uploadedFileInfo);

      // Merge uploaded file info into cleanedForm
      Object.assign(cleanedForm, uploadedFileInfo);

      // Debug log for update
      if (isEditing) {
        console.log('Updating employee:', editingEmployeeId, cleanedForm);
      } else {
        console.log('Creating new employee:', cleanedForm);
      }

      const request = isEditing
        ? axios.put(`/server/cms_function/employees/${editingEmployeeId}`, cleanedForm, { timeout: 5000 })
        : axios.post('/server/cms_function/employees', cleanedForm, { timeout: 5000 });

      request
        .then((response) => {
          console.log('Save employee response:', response);
          if (!response?.data?.data?.employee) {
            throw new Error('Unexpected API response structure');
          }
         
          // For new employees, update the form with the uploaded file information before resetting
          if (!isEditing && Object.keys(uploadedFileInfo).length > 0) {
            // Get the newly created employee ID from the response
            const newEmployeeId = response.data.data.employee.id;
           
            // Update the form state to show the uploaded files
            console.log('Updating form state with uploaded file info:', uploadedFileInfo);
            console.log('Previous form state before update:', form);
           
            // Update the form state with uploaded file information
            setForm(prevForm => {
              const newFormState = {
                ...prevForm,
                ...uploadedFileInfo,
                _pendingFiles: {},
                _uploadErrors: {}
              };
              console.log('New form state after update:', newFormState);
              console.log('Form state keys that contain FileId:', Object.keys(newFormState).filter(key => key.includes('FileId')));
              console.log('Form state keys that contain FileName:', Object.keys(newFormState).filter(key => key.includes('FileName')));
              return newFormState;
            });
           
            // Show a brief success message with file info
            const fileNames = Object.keys(uploadedFileInfo)
              .filter(key => key.endsWith('FileName'))
              .map(key => uploadedFileInfo[key])
              .filter(Boolean);
           
            if (fileNames.length > 0) {
              setFormError(`Employee created successfully! Uploaded files: ${fileNames.join(', ')}`);
              // Clear the success message after 3 seconds
              setTimeout(() => setFormError(''), 3000);
            }
           
            // Don't close the form immediately - let user see the uploaded files
            // User can manually close the form or it will auto-close after 5 seconds
            setTimeout(() => {
              setShowForm(false);
              setIsEditing(false);
              setEditingEmployeeId(null);
              fetchEmployees(); // Refetch employees after saving
            }, 5000);
          } else {
            // For editing, proceed as before
            fetchEmployees(); // Refetch employees after saving
            setForm({
              employeeCode: '',
              employeeName: '',
              personalEmail: '',
              phone: '',
              contractor: '',
              dateOfJoining: '',
              dateOfExit: '',
              employmentType: '',
              overallExperience: '',
              relevantExperience: '',
              sourceOfHire: '',
              department: '',
              designation: '',
              pfNo: '',
              esicNo: '',
              location: '',
              gradeLevel: '',
              uanNo: '',
              reportingTo: '',
              hrPartner: '',
              nationalHead: '',
              dateOfBirth: '',
              fathersName: '',
              age: '',
              emergencyContactNumber: '',
              gender: '',
              bloodGroup: '',
              maritalStatus: '',
              presentAddressLine1: '',
              presentAddressLine2: '',
              presentCity: '',
              presentState: '',
              presentPostalCode: '',
              presentCountry: '',
              permanentAddressLine1: '',
              permanentAddressLine2: '',
              permanentCity: '',
              permanentState: '',
              permanentPostalCode: '',
              permanentCountry: '',
              // Clear all file-related fields
              photoFileId: '',
              photoFileName: '',
              aadharCopyFileId: '',
              aadharCopyFileName: '',
              educationalCertificatesFileId: '',
              educationalCertificatesFileName: '',
              bankPassbookFileId: '',
              bankPassbookFileName: '',
              experienceCertificateFileId: '',
              experienceCertificateFileName: '',
              pANCardFileId: '',
              pANCardFileName: '',
              resumeFileId: '',
              resumeFileName: '',
              // Salary Info fields
              skills: '',
              skillsType: '',
              ratePerHour: '',
              aadhaarNumber: '',
              panNumber: '',
              employeeStatus: '',
              contractorSupervisor: '',
              function: '',
              category: '',
              costCenter: '',
              line: '',
              primaryContactNumber: '',
              secondaryContactNumber: '',
              busRoute: '',
              pickupPoint: '',
              drivingLicenseNumber: '',
              drivingLicenseExpiryDate: '',
              qualification: '',
              institutionName: '',
              fieldOfStudy: '',
              yearOfCompletion: '',
              percentageMarks: '',
              _pendingFiles: {},
              _uploadErrors: {},
            });
            setShowForm(false);
            setIsEditing(false);
            setEditingEmployeeId(null);
          }
        })
        .catch((err) => {
          console.error('Save employee error:', err);
          const serverError = err.response?.data?.message || (isEditing ? 'Failed to update employee.' : 'Failed to add employee.');
          setFormError(serverError);
        })
        .finally(() => setSubmitting(false));
    },
    [form, isEditing, editingEmployeeId, validateForm, fetchEmployees]
  );

  const removeEmployee = useCallback((id) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    setFilteredEmployees((prev) => prev.filter((emp) => emp.id !== id));
    setSelectedEmployees((prev) => prev.filter((empId) => empId !== id));
  }, []);

  const editEmployee = useCallback(async (employee) => {
    try {
      const { data } = await axios.get(`/server/cms_function/employees/${employee.id}`, { timeout: 5000 });
      const freshEmployee = data?.data?.employee;
      if (!freshEmployee) {
        throw new Error('Failed to fetch employee details');
      }
      const sanitize = (value) => value || ''; // Placeholder if not using DOMPurify
     
      // Check if age was calculated from date of birth
      const hasDateOfBirth = freshEmployee.dateOfBirth;
      const hasAge = freshEmployee.age;
      const shouldShowAutoCalculated = hasDateOfBirth && hasAge;
     
      setAgeAutoCalculated(shouldShowAutoCalculated);
      setAgeValid(shouldShowAutoCalculated);
      setForm({
        employeeCode: sanitize(freshEmployee.employeeCode),
        employeeName: sanitize(freshEmployee.employeeName),
        personalEmail: sanitize(freshEmployee.personalEmail),
        phone: sanitize(freshEmployee.phone),
        contractor: sanitize(freshEmployee.contractor),
        dateOfJoining: sanitize(freshEmployee.dateOfJoining),
        dateOfExit: sanitize(freshEmployee.dateOfExit),
        employmentType: sanitize(freshEmployee.employmentType),
        overallExperience: sanitize(freshEmployee.overallExperience),
        relevantExperience: sanitize(freshEmployee.relevantExperience),
        sourceOfHire: sanitize(freshEmployee.sourceOfHire),
        department: sanitize(freshEmployee.department),
        designation: sanitize(freshEmployee.designation),
        pfNo: sanitize(freshEmployee.pfNo),
        esicNo: sanitize(freshEmployee.esicNo),
        location: sanitize(freshEmployee.location),
        gradeLevel: sanitize(freshEmployee.gradeLevel),
        uanNo: sanitize(freshEmployee.uanNo),
        reportingTo: sanitize(freshEmployee.reportingTo),
        hrPartner: sanitize(freshEmployee.hrPartner),
        nationalHead: sanitize(freshEmployee.nationalHead),
        dateOfBirth: sanitize(freshEmployee.dateOfBirth),
        fathersName: sanitize(freshEmployee.fathersName),
        age: sanitize(freshEmployee.age),
        emergencyContactNumber: sanitize(freshEmployee.emergencyContactNumber),
        gender: sanitize(freshEmployee.gender),
        bloodGroup: sanitize(freshEmployee.bloodGroup),
        maritalStatus: sanitize(freshEmployee.maritalStatus),
        presentAddressLine1: sanitize(freshEmployee.presentAddressLine1),
        presentAddressLine2: sanitize(freshEmployee.presentAddressLine2),
        presentCity: sanitize(freshEmployee.presentCity),
        presentState: sanitize(freshEmployee.presentState),
        presentPostalCode: sanitize(freshEmployee.presentPostalCode),
        presentCountry: sanitize(freshEmployee.presentCountry),
        permanentAddressLine1: sanitize(freshEmployee.permanentAddressLine1),
        permanentAddressLine2: sanitize(freshEmployee.permanentAddressLine2),
        permanentCity: sanitize(freshEmployee.permanentCity),
        permanentState: sanitize(freshEmployee.permanentState),
        permanentPostalCode: sanitize(freshEmployee.permanentPostalCode),
        permanentCountry: sanitize(freshEmployee.permanentCountry),
        // Add fileId and fileName fields for all document types to form state
        photoFileId: sanitize(freshEmployee.photoFileId),
        photoFileName: sanitize(freshEmployee.photoFileName),
        aadharCopyFileId: sanitize(freshEmployee.aadharCopyFileId),
        aadharCopyFileName: sanitize(freshEmployee.aadharCopyFileName),
        educationalCertificatesFileId: sanitize(freshEmployee.educationalCertificatesFileId),
        educationalCertificatesFileName: sanitize(freshEmployee.educationalCertificatesFileName),
        bankPassbookFileId: sanitize(freshEmployee.bankPassbookFileId),
        bankPassbookFileName: sanitize(freshEmployee.bankPassbookFileName),
        experienceCertificateFileId: sanitize(freshEmployee.experienceCertificateFileId),
        experienceCertificateFileName: sanitize(freshEmployee.experienceCertificateFileName),
        pANCardFileId: sanitize(freshEmployee.pANCardFileId),
        pANCardFileName: sanitize(freshEmployee.pANCardFileName),
        resumeFileId: sanitize(freshEmployee.resumeFileId),
        resumeFileName: sanitize(freshEmployee.resumeFileName),
        // Salary Info fields
        skills: sanitize(freshEmployee.skills),
        skillsType: sanitize(freshEmployee.skillsType),
        ratePerHour: sanitize(freshEmployee.ratePerHour),
        actualBasic: sanitize(freshEmployee.actualBasic),
        actualHRA: sanitize(freshEmployee.actualHRA),
        actualDA: sanitize(freshEmployee.actualDA),
        otherAllowance: sanitize(freshEmployee.otherAllowance),
        totalSalary: sanitize(freshEmployee.totalSalary),
        aadhaarNumber: sanitize(freshEmployee.aadhaarNumber),
        panNumber: sanitize(freshEmployee.panNumber),
        employeeStatus: sanitize(freshEmployee.employeeStatus),
        contractorSupervisor: sanitize(freshEmployee.contractorSupervisor),
        function: sanitize(freshEmployee.function),
        category: sanitize(freshEmployee.category),
        costCenter: sanitize(freshEmployee.costCenter),
        line: sanitize(freshEmployee.line),
        primaryContactNumber: sanitize(freshEmployee.primaryContactNumber),
        secondaryContactNumber: sanitize(freshEmployee.secondaryContactNumber),
        busRoute: sanitize(freshEmployee.busRoute),
        pickupPoint: sanitize(freshEmployee.pickupPoint),
        drivingLicenseNumber: sanitize(freshEmployee.drivingLicenseNumber),
        drivingLicenseExpiryDate: sanitize(freshEmployee.drivingLicenseExpiryDate),
        educationDetails: freshEmployee.educationDetails && freshEmployee.educationDetails.length > 0 
          ? freshEmployee.educationDetails.map(edu => ({
              qualification: sanitize(edu.qualification),
              institutionName: sanitize(edu.institutionName),
              fieldOfStudy: sanitize(edu.fieldOfStudy),
              yearOfCompletion: sanitize(edu.yearOfCompletion),
              percentageMarks: sanitize(edu.percentageMarks)
            }))
          : [
              { qualification: '', institutionName: '', fieldOfStudy: '', yearOfCompletion: '', percentageMarks: '' }
            ],
      });
      setIsEditing(true);
      setEditingEmployeeId(freshEmployee.id);
      setShowForm(true);
      // Debug log for edit
      console.log('Editing employee:', freshEmployee.id, freshEmployee);
    } catch (error) {
      console.error('Failed to fetch fresh employee data:', error);
      // Fallback to previous behavior
      const sanitize = (value) => value || '';
      setForm({
        employeeCode: sanitize(employee.employeeCode),
        employeeName: sanitize(employee.employeeName),
        personalEmail: sanitize(employee.personalEmail),
        phone: sanitize(employee.phone),
        contractor: sanitize(employee.contractor),
        dateOfJoining: sanitize(employee.dateOfJoining),
        dateOfExit: sanitize(employee.dateOfExit),
        employmentType: sanitize(employee.employmentType),
        overallExperience: sanitize(employee.overallExperience),
        relevantExperience: sanitize(employee.relevantExperience),
        sourceOfHire: sanitize(employee.sourceOfHire),
        department: sanitize(employee.department),
        designation: sanitize(employee.designation),
        pfNo: sanitize(employee.pfNo),
        esicNo: sanitize(employee.esicNo),
        location: sanitize(employee.location),
        gradeLevel: sanitize(employee.gradeLevel),
        uanNo: sanitize(employee.uanNo),
        reportingTo: sanitize(employee.reportingTo),
        hrPartner: sanitize(employee.hrPartner),
        nationalHead: sanitize(employee.nationalHead),
        dateOfBirth: sanitize(employee.dateOfBirth),
        fathersName: sanitize(employee.fathersName),
        age: sanitize(employee.age),
        emergencyContactNumber: sanitize(employee.emergencyContactNumber),
        gender: sanitize(employee.gender),
        bloodGroup: sanitize(employee.bloodGroup),
        maritalStatus: sanitize(employee.maritalStatus),
        presentAddressLine1: sanitize(employee.presentAddressLine1),
        presentAddressLine2: sanitize(employee.presentAddressLine2),
        presentCity: sanitize(employee.presentCity),
        presentState: sanitize(employee.presentState),
        presentPostalCode: sanitize(employee.presentPostalCode),
        presentCountry: sanitize(employee.presentCountry),
        permanentAddressLine1: sanitize(employee.permanentAddressLine1),
        permanentAddressLine2: sanitize(employee.permanentAddressLine2),
        permanentCity: sanitize(employee.permanentCity),
        permanentState: sanitize(employee.permanentState),
        permanentPostalCode: sanitize(employee.permanentPostalCode),
        permanentCountry: sanitize(employee.permanentCountry),
        photoFileId: sanitize(employee.photoFileId),
        photoFileName: sanitize(employee.photoFileName),
        aadharCopyFileId: sanitize(employee.aadharCopyFileId),
        aadharCopyFileName: sanitize(employee.aadharCopyFileName),
        educationalCertificatesFileId: sanitize(employee.educationalCertificatesFileId),
        educationalCertificatesFileName: sanitize(employee.educationalCertificatesFileName),
        bankPassbookFileId: sanitize(employee.bankPassbookFileId),
        bankPassbookFileName: sanitize(employee.bankPassbookFileName),
        experienceCertificateFileId: sanitize(employee.experienceCertificateFileId),
        experienceCertificateFileName: sanitize(employee.experienceCertificateFileName),
        pANCardFileId: sanitize(employee.pANCardFileId),
        pANCardFileName: sanitize(employee.pANCardFileName),
        resumeFileId: sanitize(employee.resumeFileId),
        resumeFileName: sanitize(employee.resumeFileName),
        skills: sanitize(employee.skills),
        skillsType: sanitize(employee.skillsType),
        ratePerHour: sanitize(employee.ratePerHour),
        aadhaarNumber: sanitize(employee.aadhaarNumber),
        panNumber: sanitize(employee.panNumber),
        employeeStatus: sanitize(employee.employeeStatus),
        contractorSupervisor: sanitize(employee.contractorSupervisor),
        function: sanitize(employee.function),
        category: sanitize(employee.category),
        costCenter: sanitize(employee.costCenter),
        line: sanitize(employee.line),
        primaryContactNumber: sanitize(employee.primaryContactNumber),
        secondaryContactNumber: sanitize(employee.secondaryContactNumber),
        busRoute: sanitize(employee.busRoute),
        pickupPoint: sanitize(employee.pickupPoint),
        drivingLicenseNumber: sanitize(employee.drivingLicenseNumber),
        drivingLicenseExpiryDate: sanitize(employee.drivingLicenseExpiryDate),
        educationDetails: employee.educationDetails && employee.educationDetails.length > 0 
          ? employee.educationDetails.map(edu => ({
              qualification: sanitize(edu.qualification),
              institutionName: sanitize(edu.institutionName),
              fieldOfStudy: sanitize(edu.fieldOfStudy),
              yearOfCompletion: sanitize(edu.yearOfCompletion),
              percentageMarks: sanitize(edu.percentageMarks)
            }))
          : [
              { qualification: '', institutionName: '', fieldOfStudy: '', yearOfCompletion: '', percentageMarks: '' }
            ],
      });
      setIsEditing(true);
      setEditingEmployeeId(employee.id);
      setShowForm(true);
      // Debug log for edit (fallback)
      console.log('Editing employee (fallback):', employee.id, employee);
    }
  }, []);

  const toggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
    setFormError('');
    setAgeAutoCalculated(false);
    setAgeValid(false);
   
    // Scroll to top when opening form
    if (!showForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setForm({
      employeeCode: '',
      employeeName: '',
      personalEmail: '',
      phone: '',
      contractor: '',
      dateOfJoining: '',
      dateOfExit: '',
      employmentType: '',
      overallExperience: '',
      relevantExperience: '',
      sourceOfHire: '',
      department: '',
      designation: '',
      pfNo: '',
      esicNo: '',
      location: '',
      gradeLevel: '',
      uanNo: '',
      reportingTo: '',
      hrPartner: '',
      nationalHead: '',
      dateOfBirth: '',
      fathersName: '',
      age: '',
      emergencyContactNumber: '',
      gender: '',
      bloodGroup: '',
      maritalStatus: '',
      presentAddressLine1: '',
      presentAddressLine2: '',
      presentCity: '',
      presentState: '',
      presentPostalCode: '',
      presentCountry: '',
      permanentAddressLine1: '',
      permanentAddressLine2: '',
      permanentCity: '',
      permanentState: '',
      permanentPostalCode: '',
      permanentCountry: '',
      // Clear all file-related fields
      photoFileId: '',
      photoFileName: '',
      aadharCopyFileId: '',
      aadharCopyFileName: '',
      educationalCertificatesFileId: '',
      educationalCertificatesFileName: '',
      bankPassbookFileId: '',
      bankPassbookFileName: '',
      experienceCertificateFileId: '',
      experienceCertificateFileName: '',
      pANCardFileId: '',
      pANCardFileName: '',
      resumeFileId: '',
      resumeFileName: '',
      // Clear search fields
      skills: '',
      skillsType: '',
      ratePerHour: '',
      aadhaarNumber: '',
      panNumber: '',
      employeeStatus: '',
      contractorSupervisor: '',
      function: '',
      category: '',
      costCenter: '',
      line: '',
      primaryContactNumber: '',
      secondaryContactNumber: '',
      busRoute: '',
      pickupPoint: '',
      drivingLicenseNumber: '',
      drivingLicenseExpiryDate: '',
      educationDetails: [
        { qualification: '', institutionName: '', fieldOfStudy: '', yearOfCompletion: '', percentageMarks: '' }
      ],
    });
    setIsEditing(false);
    setEditingEmployeeId(null);
  }, []);

  // Add this near other options
  const [contractorOptions, setContractorOptions] = useState([{ value: '', label: '-Select-' }]);


  // Fetch contractors from API
  useEffect(() => {
    axios
      .get('/server/Contracters_function/contractors')
      .then((res) => {
        const contractors = res.data.data.contractors || [];
        const options = [{ value: '', label: '-Select-' }].concat(
          contractors.map((c) => ({
            value: c.ContractorName,
            label: c.ContractorName,
          }))
        );
        setContractorOptions(options);
      })
      .catch((err) => {
        console.error('Failed to fetch contractors:', err);
        setContractorOptions([{ value: '', label: '-Select-' }]);
      });
  }, []);


  // Debug useEffect to monitor form state changes
  useEffect(() => {
    if (showForm && !isEditing) {
      console.log('Form state changed:', form);
      console.log('Form file fields:', {
        photoFileId: form.photoFileId,
        photoFileName: form.photoFileName,
        aadharCopyFileId: form.aadharCopyFileId,
        aadharCopyFileName: form.aadharCopyFileName,
        // Add other file fields as needed
      });
    }
  }, [form, showForm, isEditing]);

  // Add at the top of EmployeeManagement component:
  const [skillsOptions, setSkillsOptions] = useState([
    { value: '', label: '-Select-' },
    { value: 'test', label: 'test' },
    { value: 'test2', label: 'test2' },
  ]);
  const [skillsTypeOptions, setSkillsTypeOptions] = useState([
    { value: '', label: '-Select-' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Soft Skills', label: 'Soft Skills' },
    { value: 'Management', label: 'Management' },
  ]);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [addSkillError, setAddSkillError] = useState('');
  const [showRemoveSkillModal, setShowRemoveSkillModal] = useState(false);
  const [showAddSkillTypeModal, setShowAddSkillTypeModal] = useState(false);
  const [newSkillType, setNewSkillType] = useState('');
  const [addSkillTypeError, setAddSkillTypeError] = useState('');
  const [showRemoveSkillTypeModal, setShowRemoveSkillTypeModal] = useState(false);

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      setAddSkillError('Skill is required.');
      return;
    }
    if (skillsOptions.some(opt => opt.value.toLowerCase() === newSkill.trim().toLowerCase())) {
      setAddSkillError('Skill already exists.');
      return;
    }
    setSkillsOptions(prev => [...prev, { value: newSkill.trim(), label: newSkill.trim() }]);
    setForm(prev => ({ ...prev, skills: newSkill.trim() }));
    setShowAddSkillModal(false);
    setNewSkill('');
    setAddSkillError('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsOptions(prev => prev.filter(opt => opt.value !== skillToRemove));
    // Clear the form field if it matches the removed skill
    if (form.skills === skillToRemove) {
      setForm(prev => ({ ...prev, skills: '' }));
    }
    setShowRemoveSkillModal(false);
  };

  const handleAddSkillType = () => {
    if (!newSkillType.trim()) {
      setAddSkillTypeError('Skill Type is required.');
      return;
    }
    if (skillsTypeOptions.some(opt => opt.value.toLowerCase() === newSkillType.trim().toLowerCase())) {
      setAddSkillTypeError('Skill Type already exists.');
      return;
    }
    setSkillsTypeOptions(prev => [...prev, { value: newSkillType.trim(), label: newSkillType.trim() }]);
    setForm(prev => ({ ...prev, skillsType: newSkillType.trim() }));
    setShowAddSkillTypeModal(false);
    setNewSkillType('');
    setAddSkillTypeError('');
  };

  const handleRemoveSkillType = (skillTypeToRemove) => {
    setSkillsTypeOptions(prev => prev.filter(opt => opt.value !== skillTypeToRemove));
    // Clear the form field if it matches the removed skill type
    if (form.skillsType === skillTypeToRemove) {
      setForm(prev => ({ ...prev, skillsType: '' }));
    }
    setShowRemoveSkillTypeModal(false);
  };


  // Education functions
  const handleEducationChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      educationDetails: prev.educationDetails.map((edu, idx) =>
        idx === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const handleAddEducation = () => {
    setForm(prev => ({
      ...prev,
      educationDetails: [...prev.educationDetails, {
        qualification: '',
        institutionName: '',
        fieldOfStudy: '',
        yearOfCompletion: '',
        percentageMarks: ''
      }]
    }));
  };

  const handleRemoveEducation = (index) => {
    setForm(prev => ({
      ...prev,
      educationDetails: prev.educationDetails.filter((_, idx) => idx !== index)
    }));
  };

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

  // Create dynamic columns array based on selection state
  const dynamicColumns = useMemo(() => {
    if (selectedEmployees.length === 0) {
      // When no employees are selected, exclude the Edit column
      return columns.filter(col => col.label !== 'Edit');
    }
    return columns;
  }, [selectedEmployees.length]);

  // State for expandable menus
  const [expandedMenus, setExpandedMenus] = useState({});

  // Toggle expandable menus
  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // User info
  const userAvatar = "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150";
  const userName = userRole === 'App Administrator' ? 'Admin User' : 'App User';

  // Header notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const recentActivities = [
    { icon: '👥', title: 'New Employee Added', description: 'John Doe has been added to the system', time: '2 minutes ago' },
    { icon: '📝', title: 'Employee Updated', description: 'Jane Smith\'s information has been updated', time: '5 minutes ago' },
    { icon: '🗑️', title: 'Employee Removed', description: 'Mike Johnson has been removed from the system', time: '10 minutes ago' },
    { icon: '📊', title: 'Report Generated', description: 'Monthly employee report has been generated', time: '1 hour ago' }
  ];

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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

          {/* Employee Management Content */}
          <main className="cms-dashboard-content">
            <div
              className="employee-card-container"
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
            <div className="employee-header-actions">
              <div className="employee-title-section">
                <h2 className="employee-title">
                  <Users size={28} />
                  Employee Directory
                </h2>
                <p className="employee-subtitle">
                  Manage your employee's details efficiently
                </p>
              </div>
              {/* Contractor Filter Indicator */}
              {userRole === 'App User' && userEmail && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  border: '1px solid #2196f3',
                  fontSize: '14px',
                  color: '#1976d2'
                }}>
                  <i className="fas fa-filter" style={{ marginRight: '6px' }}></i>
                  Showing employees for contractor: <strong>{userEmail}</strong>
                </div>
              )}
            </div>
            {/* Toolbar Buttons */}
            <div className="employee-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <button
                className="toolbar-btn import-btn"
                onClick={() => fileInputRef.current.click()}
                disabled={importing}
                title="Import employees from Excel"
                type="button"
                style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-file-import" style={{ color: '#232323' }}></i>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleImport}
              />
              <button
                className="toolbar-btn export-btn"
                onClick={handleExport}
                disabled={exporting}
                title="Export filtered employees to Excel"
                type="button"
                style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-file-export" style={{ color: '#232323' }}></i>
              </button>
              <button
                className="toolbar-btn filter-btn"
                onClick={toggleSearchDropdown}
                aria-expanded={showSearchDropdown}
                aria-controls="search-dropdown"
                type="button"
                title={showSearchDropdown ? "Hide filter options" : "Show filter options"}
                style={{
                  background: showSearchDropdown ? '#1976d2' : '#fff',
                  color: showSearchDropdown ? '#fff' : '#232323',
                  border: 'none',
                  fontWeight: 600,
                  padding: '8px',
                  borderRadius: '8px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fas fa-filter" style={{ color: showSearchDropdown ? '#fff' : '#232323' }}></i>
              </button>
              <button
                className="toolbar-btn"
                onClick={() => {
                  setPage(1);
                  setShowAll(false);
                  fetchEmployees();
                }}
                disabled={fetchState === 'loading'}
                title="Refresh data"
                type="button"
                style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 600, padding: '8px', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="fas fa-sync-alt" style={{ color: '#232323' }}></i>
              </button>
              <button
                className="toolbar-btn"
                onClick={toggleForm}
                type="button"
                title="Add new employee"
                style={{ background: '#fff', color: '#232323', border: 'none', fontWeight: 700, fontSize: '1.2rem', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(60,72,88,0.10)' }}
              >
                <i className="fas fa-plus" style={{ color: '#232323', fontSize: '1.5rem' }}></i>
              </button>
             
              {/* Delete button for selected employees - moved after + button */}
              {selectedEmployees.length > 0 && (
                <button
                  className="toolbar-btn"
                  onClick={handleMassDelete}
                  disabled={deletingMultiple}
                  title="Delete selected employees"
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

          {/* Filter Sidebar */}
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
                          {field === 'employeeCode' ? (
                            createDropdownUI(
                              'employeeCode', 'Employee Code', employeeCodes, 
                              employeeCodeSearch, setEmployeeCodeSearch,
                              isEmployeeCodeDropdownOpen, setIsEmployeeCodeDropdownOpen,
                              handleEmployeeCodeSelect, loadingEmployeeCodes, filteredEmployeeCodes
                            )
                          ) : field === 'employeeName' ? (
                            createDropdownUI(
                              'employeeName', 'Employee Name', employeeNames,
                              employeeNameSearch, setEmployeeNameSearch,
                              isEmployeeNameDropdownOpen, setIsEmployeeNameDropdownOpen,
                              handleEmployeeNameSelect, loadingEmployeeNames, filteredEmployeeNames
                            )
                          ) : field === 'contractor' ? (
                            createDropdownUI(
                              'contractor', 'Contractor', contractors,
                              contractorSearch, setContractorSearch,
                              isContractorDropdownOpen, setIsContractorDropdownOpen,
                              handleContractorSelect, loadingContractors, filteredContractors
                            )
                          ) : field === 'employmentType' ? (
                            createDropdownUI(
                              'employmentType', 'Employment Type', employmentTypes,
                              employmentTypeSearch, setEmploymentTypeSearch,
                              isEmploymentTypeDropdownOpen, setIsEmploymentTypeDropdownOpen,
                              handleEmploymentTypeSelect, loadingEmploymentTypes, filteredEmploymentTypes
                            )
                          ) : field === 'skills' ? (
                            createDropdownUI(
                              'skills', 'Skills', skills,
                              skillSearch, setSkillSearch,
                              isSkillDropdownOpen, setIsSkillDropdownOpen,
                              handleSkillSelect, loadingSkills, filteredSkills
                            )
                          ) : field === 'dateOfExit' ? (
                            createDropdownUI(
                              'dateOfExit', 'Exit Date', exitDates,
                              exitDateSearch, setExitDateSearch,
                              isExitDateDropdownOpen, setIsExitDateDropdownOpen,
                              handleExitDateSelect, loadingExitDates, filteredExitDates
                            )
                          ) : field === 'gender' ? (
                            createDropdownUI(
                              'gender', 'Gender', genders,
                              genderSearch, setGenderSearch,
                              isGenderDropdownOpen, setIsGenderDropdownOpen,
                              handleGenderSelect, loadingGenders, filteredGenders
                            )
                          ) : field === 'skillsType' ? (
                            createDropdownUI(
                              'skillsType', 'Skills Type', skillTypes,
                              skillTypeSearch, setSkillTypeSearch,
                              isSkillTypeDropdownOpen, setIsSkillTypeDropdownOpen,
                              handleSkillTypeSelect, loadingSkillTypes, filteredSkillTypes
                            )
                          ) : searchFields[field].checkbox !== undefined ? (
                            <input
                              type="text"
                              value={searchFields[field].value || ''}
                              onChange={(e) => setSearchFields(prev => ({
                                ...prev,
                                [field]: { ...prev[field], value: e.target.value }
                              }))}
                              placeholder={`Search ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            />
                          ) : ['personalEmail', 'phone', 'dateOfJoining', 'dateOfBirth', 'location', 'gradeLevel', 'reportingTo', 'function', 'age', 'bloodGroup', 'maritalStatus', 'fathersName', 'primaryContactNumber', 'secondaryContactNumber', 'emergencyContactNumber', 'presentAddressLine1', 'presentAddressLine2', 'presentCity', 'presentState', 'presentPostalCode', 'presentCountry', 'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPostalCode', 'permanentCountry', 'aadhaarNumber', 'panNumber', 'uanNo', 'pfNo', 'esicNo', 'drivingLicenseNumber', 'drivingLicenseExpiryDate', 'overallExperience', 'relevantExperience', 'sourceOfHire', 'ratePerHour'].includes(field) ? (
                            <input
                              type="email"
                              value={searchFields[field].value}
                              onChange={(e) => handleSearchValueChange(field, e.target.value)}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px',
                                backgroundColor: 'white'
                              }}
                            />
                          ) : (
                            <>
                              <select
                                value={searchFields[field].mode}
                                onChange={(e) => handleModeChange(field, e.target.value)}
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  backgroundColor: 'white'
                                }}
                              >
                                {filterModes.map((mode) => (
                                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={searchFields[field].value}
                                onChange={(e) => handleSearchValueChange(field, e.target.value)}
                                placeholder={`Enter ${label.toLowerCase()}`}
                                style={{
                                  padding: '6px 8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  backgroundColor: 'white'
                                }}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={resetSearch}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowSearchDropdown(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {importError && (
            <div className="error-message" style={{ margin: '10px 0', color: 'red' }}>
              {importError}
            </div>
          )}
          {exportError && (
            <div className="error-message" style={{ margin: '10px 0', color: 'red' }}>
              {exportError}
            </div>
          )}
          {massDeleteError && (
            <div className="error-message" style={{ margin: '10px 0', color: 'red' }}>
              {massDeleteError}
            </div>
          )}

          {Object.values(searchFields).some(field => field.enabled) && (
            <div className="filter-summary" style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>
              <strong>Active Filters: </strong>
              {searchableFields
                .filter(({ field }) => searchFields[field].enabled)
                .map(({ label, field }) => (
                  <span key={field} style={{ marginRight: '10px' }}>
                    {field === 'employeeCode' ? (
                      `${label}: ${searchFields[field].selectedCode}`
                    ) : field === 'employeeName' ? (
                      `${label}: ${searchFields[field].selectedName}`
                    ) : field === 'contractor' ? (
                      `${label}: ${searchFields[field].selectedContractor}`
                    ) : field === 'employmentType' ? (
                      `${label}: ${searchFields[field].selectedEmploymentType}`
                    ) : field === 'skills' ? (
                      `${label}: ${searchFields[field].selectedSkill}`
                    ) : field === 'dateOfExit' ? (
                      `${label}: ${searchFields[field].selectedExitDate}`
                    ) : field === 'gender' ? (
                      `${label}: ${searchFields[field].selectedGender}`
                    ) : field === 'skillsType' ? (
                      `${label}: ${searchFields[field].selectedSkillType}`
                    ) : ['personalEmail', 'phone', 'dateOfJoining', 'dateOfBirth', 'location', 'gradeLevel', 'reportingTo', 'function', 'age', 'bloodGroup', 'maritalStatus', 'fathersName', 'primaryContactNumber', 'secondaryContactNumber', 'emergencyContactNumber', 'presentAddressLine1', 'presentAddressLine2', 'presentCity', 'presentState', 'presentPostalCode', 'presentCountry', 'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPostalCode', 'permanentCountry', 'aadhaarNumber', 'panNumber', 'uanNo', 'pfNo', 'esicNo', 'drivingLicenseNumber', 'drivingLicenseExpiryDate', 'overallExperience', 'relevantExperience', 'sourceOfHire', 'ratePerHour'].includes(field) ? (
                      `${label}: "${searchFields[field].value}"`
                    ) : searchFields[field].value !== undefined && searchFields[field].checkbox === undefined ? (
                      `${label}: "${searchFields[field].value}"`
                    ) : searchFields[field].checkbox !== undefined ? (
                      `${label}: Has Data`
                    ) : (
                      <>
                        {label} {searchFields[field].mode}
                        {searchFields[field].mode === 'is' || searchFields[field].mode === 'is not' ? ` "${searchFields[field].value}"` : ''}
                      </>
                    )}
                  </span>
                ))}
            </div>
          )}

          {/* Employee Form - Display above table when open */}
          {showForm && (
            <div className="employee-form-page">
              <div className="employee-form-container">
                <div className="employee-form-header">
                  <h1 style={{ paddingLeft: '20px' }}>
                    {isEditing ? 'Edit Employee' : 'Add New Employee'}
                  </h1>
            <button
                    className="close-btn"
                    onClick={toggleForm}
                    title="Close form"
                  >
                    <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="employee-form-content">
              <div className="employee-form-card">
                {/* Employee Info Card */}
                <div className="form-section-card employee-info">
                  <h2 className="section-title">Employee Info </h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Employee Code *</label>
                      <input className="input" type="text" name="employeeCode" value={form.employeeCode} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Employee Name</label>
                      <input className="input" type="text" name="employeeName" value={form.employeeName} onChange={onChange} />
                    </div>
                  </div>
                </div>
               
                {/* Work Info Card */}
                <div className="form-section-card work-info">
                  <h2 className="section-title">Work Info</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Contractor</label>
                      <select className="input" name="contractor" value={form.contractor} onChange={onChange}>
                        {contractorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Joining *</label>
                      <input className="input" type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Contractor Supervisor</label>
                      <input 
                        className="input" 
                        name="contractorSupervisor" 
                        value={form.contractorSupervisor} 
                        onChange={onChange}
                        placeholder="Enter contractor supervisor name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Employment Type</label>
                      <input className="input" type="text" name="employmentType" value={form.employmentType} onChange={onChange} placeholder="Enter employment type" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="department">Department *</label>
                      <input 
                        className="input" 
                        id="department"
                        name="department" 
                        value={form.department} 
                        onChange={onChange}
                        placeholder="Enter department name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="designation">Designation *</label>
                      <input 
                        className="input" 
                        id="designation"
                        name="designation" 
                        value={form.designation} 
                        onChange={onChange}
                        placeholder="Enter designation name"
                      />
                    </div>
                  <div className="form-group">
                      <label>Date of Exit</label>
                      <input className="input" type="date" name="dateOfExit" value={form.dateOfExit} onChange={onChange} />
                  </div>
                    </div>
                  </div>
                 
                  {/* Personal Info Card */}
                  <div className="form-section-card personal-info">
                    <h2 className="section-title">Personal Info</h2>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input className="input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <input className="input" name="age" value={form.age} onChange={onChange} readOnly={ageAutoCalculated} />
                      </div>
                      <div className="form-group">
                        <label>Gender</label>
                        <select className="input" name="gender" value={form.gender} onChange={onChange}>
                          <option value="">-Select-</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Blood Group</label>
                        <select className="input" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                          <option value="">-Select-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Marital Status</label>
                        <select className="input" name="maritalStatus" value={form.maritalStatus} onChange={onChange}>
                          <option value="">-Select-</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Father Name/Spouse Name</label>
                        <input className="input" name="fathersName" value={form.fathersName} onChange={onChange} />
                      </div>
                    </div>
                  </div>
                 
                  {/* Contact Info Card */}
                  <div className="form-section-card contact-info">
                    <h2 className="section-title">Contact Info</h2>
                    <div className="form-grid">
                  <div className="form-group">
                        <label>Email *</label>
                        <input className="input" type="email" name="personalEmail" value={form.personalEmail} onChange={onChange} />
                  </div>
                  <div className="form-group">
                        <label>Phone *</label>
                        <input className="input" name="phone" value={form.phone} onChange={onChange} />
                  </div>
                  <div className="form-group">
                        <label>Primary Contact Number</label>
                        <input className="input" name="primaryContactNumber" value={form.primaryContactNumber} onChange={onChange} />
                  </div>
                      <div className="form-group">
                        <label>Secondary Contact Number</label>
                        <input className="input" name="secondaryContactNumber" value={form.secondaryContactNumber} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Emergency Contact Number</label>
                        <input className="input" name="emergencyContactNumber" value={form.emergencyContactNumber} onChange={onChange} />
                      </div>
                </div>
                </div>
               
                  {/* Address Details Card */}
                  <div className="form-section-card address-details">
                    <h2 className="section-title">Address Details</h2>
                   
                    {/* Present Address */}
                    <div className="address-block">
                      <h4>Present Address</h4>
                  <div className="form-grid">
                  <div className="form-group">
                          <label>Address Line 1</label>
                          <input className="input" name="presentAddressLine1" value={form.presentAddressLine1} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>Address Line 2</label>
                          <input className="input" name="presentAddressLine2" value={form.presentAddressLine2} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>City</label>
                          <input className="input" name="presentCity" value={form.presentCity} onChange={onChange} />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <input className="input" name="presentState" value={form.presentState} onChange={onChange} />
                        </div>
                        <div className="form-group">
                          <label>Postal Code</label>
                          <input className="input" name="presentPostalCode" value={form.presentPostalCode} onChange={onChange} />
                        </div>
                        <div className="form-group">
                          <label>Country</label>
                          <input className="input" name="presentCountry" value={form.presentCountry} onChange={onChange} />
                        </div>
                      </div>
                    </div>
                   
                    {/* Permanent Address */}
                    <div className="address-block">
                      <h4>Permanent Address</h4>
                      <div className="checkbox-group">
                    <input
                          type="checkbox"
                          id="sameAsPresent"
                          checked={sameAsPresent}
                          onChange={handleSameAsPresentChange}
                        />
                        <label htmlFor="sameAsPresent">Same as Present Address</label>
                  </div>
                      <div className="form-grid">
                  <div className="form-group">
                          <label>Address Line 1</label>
                          <input className="input" name="permanentAddressLine1" value={form.permanentAddressLine1} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>Address Line 2</label>
                          <input className="input" name="permanentAddressLine2" value={form.permanentAddressLine2} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>City</label>
                          <input className="input" name="permanentCity" value={form.permanentCity} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>State</label>
                          <input className="input" name="permanentState" value={form.permanentState} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>Postal Code</label>
                          <input className="input" name="permanentPostalCode" value={form.permanentPostalCode} onChange={onChange} />
                  </div>
                  <div className="form-group">
                          <label>Country</label>
                          <input className="input" name="permanentCountry" value={form.permanentCountry} onChange={onChange} />
                  </div>
                  </div>
                </div>
                </div>
               
                {/* Identity Info Card */}

                <div className="form-section-card identity-info">
                  <h2 className="section-title">Identity Info</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Aadhaar Number *</label>
                      <input className="input" name="aadhaarNumber" value={form.aadhaarNumber} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>PAN Number *</label>
                      <input className="input" name="panNumber" value={form.panNumber} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>UAN Number</label>
                      <input className="input" name="uanNo" value={form.uanNo} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>PF Number</label>
                      <input className="input" name="pfNo" value={form.pfNo} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>ESIC Number</label>
                      <input className="input" name="esicNo" value={form.esicNo} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Driving License Number</label>
                      <input className="input" name="drivingLicenseNumber" value={form.drivingLicenseNumber} onChange={onChange} />
                    </div>
                    <div className="form-group">
                      <label>Driving License Expiry Date</label>
                      <input className="input" type="date" name="drivingLicenseExpiryDate" value={form.drivingLicenseExpiryDate} onChange={onChange} />
                    </div>
                  </div>
                </div>
               
                {/* Education Details Card */}
                <div className="form-section-card education-details">
                  <h2 className="section-title">Education Details</h2>
                  {form.educationDetails && form.educationDetails.length > 0 && form.educationDetails.map((edu, idx) => (
                    <div className="form-grid" key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 16, padding: 16, position: 'relative' }}>
                      <div className="form-group">
                        <label>Qualification</label>
                        <input className="input" name={`qualification-${idx}`} value={edu.qualification} onChange={e => handleEducationChange(idx, 'qualification', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Institution Name</label>
                        <input className="input" name={`institutionName-${idx}`} value={edu.institutionName} onChange={e => handleEducationChange(idx, 'institutionName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Field of Study</label>
                        <input className="input" name={`fieldOfStudy-${idx}`} value={edu.fieldOfStudy} onChange={e => handleEducationChange(idx, 'fieldOfStudy', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Year of Completion</label>
                        <input className="input" name={`yearOfCompletion-${idx}`} value={edu.yearOfCompletion} onChange={e => handleEducationChange(idx, 'yearOfCompletion', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Percentage/Marks</label>
                        <input className="input" name={`percentageMarks-${idx}`} value={edu.percentageMarks} onChange={e => handleEducationChange(idx, 'percentageMarks', e.target.value)} />
                      </div>
                      {form.educationDetails.length > 1 && (
                        <button type="button" className="btn btn-danger" style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => handleRemoveEducation(idx)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary" onClick={handleAddEducation} style={{ marginTop: 8 }}>
                    + Add Qualification
                  </button>
                </div>
               
                {/* Salary Info Card */}
                <div className="form-section-card salary-info">
                  <h2 className="section-title">Salary Info</h2>
                  <div className="form-grid">
                      <div className="form-group">
                        <label>Rate Per Hour</label>
                        <input className="input" name="ratePerHour" value={form.ratePerHour} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Actual Basic</label>
                        <input className="input" name="actualBasic" value={form.actualBasic} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Actual HRA</label>
                        <input className="input" name="actualHRA" value={form.actualHRA} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Actual DA</label>
                        <input className="input" name="actualDA" value={form.actualDA} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Other Allowance</label>
                        <input className="input" name="otherAllowance" value={form.otherAllowance} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Salary (Auto-calculated)</label>
                        <input className="input" name="totalSalary" value={form.totalSalary} readOnly style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }} />
                      </div>
                  <div className="form-group">
                    <label>Skills</label>
                    <select 
                      className="input" 
                      name="skills" 
                      value={form.skills} 
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setShowAddSkillModal(true);
                        } else if (e.target.value === '__remove__') {
                          setShowRemoveSkillModal(true);
                        } else {
                          onChange(e);
                        }
                      }}
                    >
                      {skillsOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      <option value="__add_new__">+ Add New</option>
                      <option value="__remove__">- Remove</option>
                    </select>
                  </div>
                  <div className="form-group">
                        <label>Skills Type</label>
                    <select 
                      className="input" 
                      name="skillsType" 
                      value={form.skillsType} 
                      onChange={e => {
                        if (e.target.value === '__add_new_skill_type__') {
                          setShowAddSkillTypeModal(true);
                        } else if (e.target.value === '__remove_skill_type__') {
                          setShowRemoveSkillTypeModal(true);
                        } else {
                          onChange(e);
                        }
                      }}
                    >
                          {skillsTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                          <option value="__add_new_skill_type__">+ Add New</option>
                          <option value="__remove_skill_type__">- Remove</option>
                    </select>
                  </div>
                  <div className="form-group">
                        <label>Overall Experience</label>
                        <input className="input" name="overallExperience" value={form.overallExperience} onChange={onChange} />
                  </div>
                      <div className="form-group">
                        <label>Relevant Experience</label>
                        <input className="input" name="relevantExperience" value={form.relevantExperience} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Source of Hire</label>
                        <input className="input" name="sourceOfHire" value={form.sourceOfHire} onChange={onChange} />
                      </div>
                </div>
                </div>
               
                  {/* Additional Info Card */}
                  <div className="form-section-card additional-info">
                    <h2 className="section-title">Additional Info</h2>
                  <div className="form-grid">
                      <div className="form-group">
                        <label>Location</label>
                        <input className="input" name="location" value={form.location} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Grade Level</label>
                        <input className="input" name="gradeLevel" value={form.gradeLevel} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Reporting To</label>
                        <input className="input" name="reportingTo" value={form.reportingTo} onChange={onChange} />
                      </div>
                      {/* Removed HR Partner and National Head fields as requested */}
                      <div className="form-group">
                        <label>Function</label>
                        <input className="input" name="function" value={form.function} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <input className="input" name="category" value={form.category} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Cost Center</label>
                        <input className="input" name="costCenter" value={form.costCenter} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Line</label>
                        <input className="input" name="line" value={form.line} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Bus Route</label>
                        <input className="input" name="busRoute" value={form.busRoute} onChange={onChange} />
                      </div>
                      <div className="form-group">
                        <label>Pickup Point</label>
                        <input className="input" name="pickupPoint" value={form.pickupPoint} onChange={onChange} />
                      </div>
                  <div className="form-group">
                    <label>Employee Status</label>
                    <select className="input" name="employeeStatus" value={form.employeeStatus} onChange={onChange}>
                      <option value="">-Select-</option>
                      <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                      <option value="Resigned">Resigned</option>
                      <option value="Terminated">Terminated</option>
                          <option value="Absconding">Absconding</option>
                          <option value="Deceased">Deceased</option>
                    </select>
                  </div>
                </div>
                </div>
               
                {/* Employee Files */}
                {console.log('Rendering EmployeeFilesSection with form:', form)}
                <EmployeeFilesSection
                  employeeId={isEditing ? editingEmployeeId : null}
                  employee={form}
                  pendingFiles={form._pendingFiles || {}}
                  setPendingFiles={pendingFiles => setForm(f => ({ ...f, _pendingFiles: pendingFiles }))}
                  uploadErrors={form._uploadErrors || {}}
                  setUploadErrors={uploadErrors => setForm(f => ({ ...f, _uploadErrors: uploadErrors }))}
                  uploading={submitting}
                  isNewEmployee={!isEditing}
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting} onClick={saveEmployee}>
                    {isEditing ? 'Update Employee' : 'Submit'}
                    {submitting && <span className="btn-primary__loader ml-5"></span>}
                  </button>
                  <button type="button" className="btn btn-danger" onClick={toggleForm}>
                    Cancel
                  </button>
                  {/* Show Close Form button when employee is successfully created */}
                  {!isEditing && Object.keys(form).some(key => key.endsWith('FileId') && form[key]) && (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        setShowForm(false);
                        setIsEditing(false);
                        setEditingEmployeeId(null);
                        fetchEmployees();
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      Close Form
                    </button>
                  )}
                </div>
                {formError && <div className="error-message">{formError}</div>}
                  </div>
              </div>
            </div>
          </div>
        )}

          {/* Table Container - Only show when form is closed */}
          {!showForm && (
            <>
              <div className="employee-table-container" style={{ marginTop: 32 }}>
                {(fetchState === 'loading' || importing) ? (
                  <div className="dF aI-center jC-center h-inh">
                    <div className="loader-lg"></div>
                  </div>
                ) : fetchState === 'error' ? (
                  <div className="error-message">{fetchError}</div>
                ) : (
                  <table className={`employee-table ${selectedEmployees.length === 0 ? 'edit-column-hidden' : ''}`} style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        {dynamicColumns.map((column, index) => {
                          return (
                            <th key={index} style={{ color: '#232323', fontWeight: 700, fontSize: '1rem', borderBottom: '2px solid #e3e8ee', background: '#f5f5f5' }}>
                              {column.label === 'Select' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                      if (input) {
                                        input.indeterminate = someSelected;
                                      }
                                    }}
                                    onChange={handleSelectAll}
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      cursor: 'pointer',
                                      accentColor: '#dc3545',
                                    }}
                                    title={allSelected ? 'Deselect all' : 'Select all'}
                                  />
                                </div>
                              ) : (
                                column.label
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length ? (
                        filteredEmployees.map((employee, index) => (
                          <EmployeeRow
                            key={employee.id}
                            employee={employee}
                            index={index}
                            removeEmployee={removeEmployee}
                            editEmployee={editEmployee}
                            isSelected={selectedEmployees.includes(employee.id)}
                            onSelect={handleSelectEmployee}
                            selectedEmployees={selectedEmployees}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={dynamicColumns.length} className="text-center">
                            No employees found. Adjust your search or add a new employee.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px 0' }}>
                <button
                  className="toolbar-btn mr-2"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || showAll}
                >
                  Previous
                </button>
                <span style={{ margin: '0 10px' }}>
                  {showAll ? 'Showing All Records' : `Page ${page} of ${totalPages}`}
                </span>
                <button
                  className="toolbar-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || showAll}
                >
                  Next
                </button>
                <button
                  className="toolbar-btn ml-2"
                  onClick={() => {
                    setShowAll(!showAll);
                    setPage(1);
                  }}
                  style={{ backgroundColor: showAll ? '#28a745' : '#6c757d', color: 'white' }}
                >
                  {showAll ? 'Show Paginated' : 'Show All'}
                </button>
                {!showAll && (
                        <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(parseInt(e.target.value));
                      setPage(1);
                    }}
                    style={{ marginLeft: 10, padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={200}>200 per page</option>
                        </select>
                )}
                <span style={{ marginLeft: 20, fontSize: 14, color: '#555' }}>
                  Showing {employees.length} of {totalEmployees || '?'} employees
                </span>
              </div>
                      </>
                    )}
                  </div>
        </main>
       
        {showAddSkillModal && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999 }}>
            <div className="modal-content" style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 400, position: 'relative' }}>
              <button
                style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
                onClick={() => { setShowAddSkillModal(false); setAddSkillError(''); setNewSkill(''); }}
                title="Close"
              >
                ×
              </button>
              <h2 style={{ marginTop: 0 }}>Add Skills</h2>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="new-skill-input">Skill <span style={{ color: 'red' }}>*</span></label>
                <input
                  id="new-skill-input"
                  className="input"
                  value={newSkill}
                  onChange={e => { setNewSkill(e.target.value); setAddSkillError(''); }}
                  style={{ width: '100%', marginTop: 8 }}
                />
                {addSkillError && <div style={{ color: 'red', marginTop: 8 }}>{addSkillError}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={handleAddSkill}>Add</button>
                <button className="btn btn-secondary" onClick={() => { setShowAddSkillModal(false); setAddSkillError(''); setNewSkill(''); }}>Reset</button>
              </div>
            </div>
          </div>
        )}
        {showAddSkillTypeModal && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999 }}>
            <div className="modal-content" style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 400, position: 'relative' }}>
              <button
                style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
                onClick={() => { setShowAddSkillTypeModal(false); setAddSkillTypeError(''); setNewSkillType(''); }}
                title="Close"
              >
                ×
              </button>
              <h2 style={{ marginTop: 0 }}>Add Skills Type</h2>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="new-skill-type-input">Skill Type <span style={{ color: 'red' }}>*</span></label>
                <input
                  id="new-skill-type-input"
                  className="input"
                  value={newSkillType}
                  onChange={e => { setNewSkillType(e.target.value); setAddSkillTypeError(''); }}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Enter skill type"
                />
                {addSkillTypeError && <div style={{ color: 'red', marginTop: 8 }}>{addSkillTypeError}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={handleAddSkillType}>Add</button>
                <button className="btn btn-secondary" onClick={() => { setShowAddSkillTypeModal(false); setAddSkillTypeError(''); setNewSkillType(''); }}>Reset</button>
              </div>
            </div>
          </div>
        )}
        {showRemoveSkillModal && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999 }}>
            <div className="modal-content" style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 400, position: 'relative' }}>
              <button
                style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
                onClick={() => setShowRemoveSkillModal(false)}
                title="Close"
              >
                ×
              </button>
              <h2 style={{ marginTop: 0 }}>Remove Skill</h2>
              <div style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label>Select Skill to Remove:</label>
                  <div style={{ marginTop: 8, maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {skillsOptions.filter(opt => opt.value !== '').map(opt => (
                      <div
                        key={opt.value}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => handleRemoveSkill(opt.value)}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <span>{opt.label}</span>
                        <i className="fas fa-trash" style={{ color: '#ef4444', fontSize: '14px' }}></i>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRemoveSkillModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showRemoveSkillTypeModal && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999 }}>
            <div className="modal-content" style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 400, position: 'relative' }}>
              <button
                style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
                onClick={() => setShowRemoveSkillTypeModal(false)}
                title="Close"
              >
                ×
              </button>
              <h2 style={{ marginTop: 0 }}>Remove Skill Type</h2>
              <div style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label>Select Skill Type to Remove:</label>
                  <div style={{ marginTop: 8, maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {skillsTypeOptions.filter(opt => opt.value !== '').map(opt => (
                      <div
                        key={opt.value}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => handleRemoveSkillType(opt.value)}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <span>{opt.label}</span>
                        <i className="fas fa-trash" style={{ color: '#ef4444', fontSize: '14px' }}></i>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRemoveSkillTypeModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
  );
}

// Refactored EmployeeFilesSection with improved UI and deferred upload logic
function EmployeeFilesSection({ employeeId, employee, pendingFiles, setPendingFiles, uploadErrors, setUploadErrors, uploading, isNewEmployee }) {
  // Document types and their display names and accepted types
  const docTypes = [
    { key: 'Photo', fieldKey: 'photo', label: 'Photo', accept: '.jpg,.jpeg,.png', hint: 'JPG/PNG, max 5MB' },
    { key: 'AadharCopy', fieldKey: 'aadharCopy', label: 'Aadhaar file', accept: '.pdf,.jpg,.jpeg,.png', hint: 'PDF/JPG/PNG, max 5MB' },
    { key: 'EducationalCertificates', fieldKey: 'educationalCertificates', label: 'Educational Certificates', accept: '.pdf', hint: 'PDF, max 5MB' },
    { key: 'BankPassbook', fieldKey: 'bankPassbook', label: 'Bank Passbook', accept: '.pdf,.jpg,.jpeg,.png', hint: 'PDF/JPG/PNG, max 5MB' },
    { key: 'ExperienceCertificate', fieldKey: 'experienceCertificate', label: 'Experience Certificate', accept: '.pdf,.doc,.docx', hint: 'PDF/DOC/DOCX, max 5MB' },
    { key: 'PANCard', fieldKey: 'pANCard', label: 'PAN Card', accept: '.pdf,.jpg,.jpeg,.png', hint: 'PDF/JPG/PNG, max 5MB' },
    { key: 'Resume', fieldKey: 'resume', label: 'Resume', accept: '.pdf,.doc,.docx', hint: 'PDF/DOC/DOCX, max 5MB' },
  ];

  // Remove a pending file
  const removePendingFile = (key) => {
    setPendingFiles({ ...pendingFiles, [key]: undefined });
    setUploadErrors({ ...uploadErrors, [key]: undefined });
  };

  // Select a new file
  const handleFileSelect = (key, file) => {
    console.log('File selected:', { key, file, fileName: file.name, fileSize: file.size, fileType: file.type });
    console.log('Current pending files before update:', pendingFiles);
    const newPendingFiles = { ...pendingFiles, [key]: file };
    console.log('New pending files after update:', newPendingFiles);
    setPendingFiles(newPendingFiles);
    setUploadErrors({ ...uploadErrors, [key]: undefined });
  };

  // Reliable blob-based download (mirrors table downloader behavior)
  const downloadEmployeeFile = async (docKey, fileName, event) => {
    if (!employeeId) {
      console.warn('Download requested without employeeId');
      return;
    }
    const originalText = event?.target?.textContent;
    try {
      const downloadUrl = `/server/cms_function/employees/${employeeId}/file/${docKey}`;

      if (event?.target) {
        event.target.textContent = 'Downloading...';
        event.target.style.pointerEvents = 'none';
      }

      const axiosOk = await downloadBlobWithAxios(downloadUrl, fileName);
      if (!axiosOk) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 100);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      if (event?.target) {
        event.target.textContent = originalText;
        event.target.style.pointerEvents = 'auto';
      }
    }
  };

  return (
    <table className="employee-files-table" style={{ width: '100%', marginTop: 10 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Document</th>
          <th style={{ textAlign: 'left' }}>File</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {docTypes.map(({ key, fieldKey, label, accept, hint }) => {
          // Check form state directly for file information
          // Normalize the key to match the form structure (e.g., 'Photo' -> 'photo')
          const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
         
          // Get file info from form state using normalized key
          const fileId = employee[`${normalizedKey}FileId`];
          const fileName = employee[`${normalizedKey}FileName`];
          const pendingFile = pendingFiles?.[key];
          const error = uploadErrors?.[key];

          // Debug logging for file display
          if (key === 'Photo') {
            console.log(`File display debug for ${key}:`, {
              key,
              fieldKey,
              normalizedKey,
              fileId,
              fileName,
              pendingFile,
              error,
              employeeId,
              isNewEmployee,
              formStateKeys: Object.keys(employee).filter(key => key.includes('FileId') || key.includes('FileName'))
            });
          }

          // For Photo, display image preview if fileName exists and no pending file
          const isPhoto = key === 'Photo';
          const photoUrl = isPhoto && fileId && employeeId ? `/server/cms_function/employees/${employeeId}/file/${key}` : null;

          return (
            <tr key={key}>
              <td>
                <span title={hint}>{label}</span>
                <div style={{ fontSize: 11, color: '#888' }}>{hint}</div>
              </td>
              <td>
                {pendingFile ? (
                  <div className="dF aI-center">
                    <span style={{ marginRight: 8 }}>{pendingFile.name}</span>
                    <button
                      type="button"
                      className="btn btn-icon btn-danger-icon"
                      title="Remove selected file"
                      onClick={() => removePendingFile(key)}
                      disabled={uploading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (fileId && fileName) ? (
                  <div className="dF aI-center" style={{ alignItems: 'center' }}>
                    {isPhoto && photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Uploaded Photo"
                        style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 8, borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    ) : null}
                    <span style={{ color: '#333', fontWeight: '500' }}>{fileName}</span>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {isNewEmployee ? 'File uploaded successfully!' : 'File available'}
                    </div>
                  </div>
                ) : (
                  <span style={{ color: '#aaa' }}>No file uploaded</span>
                )}
                {/* Debug info */}
                {key === 'Photo' && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    Debug: pendingFile={!!pendingFile}, fileId={!!fileId}, fileName={!!fileName},
                    fileIdValue={fileId}, fileNameValue={fileName}
                  </div>
                )}
                {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}
              </td>
              <td>
                {pendingFile ? null : fileId && fileName && employeeId ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-icon"
                      title="Download"
                      onClick={(e) => downloadEmployeeFile(key, fileName, e)}
                      style={{ marginRight: 8 }}
                      disabled={uploading}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    <label className="btn btn-icon" title="Replace file" style={{ marginRight: 8 }}>
                      <i className="fas fa-exchange-alt"></i>
                      <input
                        type="file"
                        accept={isPhoto ? '.jpg,.jpeg,.png' : accept}
                        style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={e => {
                          console.log('File input change event for key:', key, 'files:', e.target.files, 'event:', e);
                          if (e.target.files && e.target.files[0]) {
                            console.log('File selected in input for key:', key, 'file:', e.target.files[0]);
                            handleFileSelect(key, e.target.files[0]);
                            e.target.value = '';
                          } else {
                            console.log('No file selected for key:', key);
                          }
                        }}
                        onClick={e => {
                          console.log('File input clicked for key:', key);
                        }}
                        onFocus={e => {
                          console.log('File input focused for key:', key);
                        }}
                      />
                    </label>
                  </>
                ) : (
                                      <label className="btn btn-icon" title="Upload file">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <input
                        type="file"
                        accept={isPhoto ? '.jpg,.jpeg,.png' : accept}
                        style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={e => {
                          console.log('File input change event for new upload key:', key, 'files:', e.target.files, 'event:', e);
                          if (e.target.files && e.target.files[0]) {
                            console.log('File selected in input for new upload key:', key, 'file:', e.target.files[0]);
                            handleFileSelect(key, e.target.files[0]);
                            e.target.value = '';
                          } else {
                            console.log('No file selected for new upload key:', key);
                          }
                        }}
                        onClick={e => {
                          console.log('File input clicked for new upload key:', key);
                        }}
                        onFocus={e => {
                          console.log('File input focused for new upload key:', key);
                        }}
                      />
                    </label>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Dropdown options for Salary Info
const skillsOptions = [
  { value: '', label: '-Select-' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Java', label: 'Java' },
  { value: 'SQL', label: 'SQL' },
  { value: 'React', label: 'React' },
  { value: 'Node.js', label: 'Node.js' },
  { value: 'C#', label: 'C#' },
  { value: 'HTML/CSS', label: 'HTML/CSS' },
  { value: 'Angular', label: 'Angular' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Leadership', label: 'Leadership' },
];
const skillsTypeOptions = [
  { value: '', label: '-Select-' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Soft', label: 'Soft' },
  { value: 'Management', label: 'Management' },
  { value: 'Language', label: 'Language' },
];

export default EmployeeManagement;