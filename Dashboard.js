import { Link } from 'react-router-dom';
import './App.css'; // For sidebar styling (Home page look)
import './Dashboard.css'; // For main content styling (original Dashboard look)
import Button from './Button';
import cmsLogo from './assets/cms new logo fixed.png';
import cmsCenterLogo from './assets/cmsheadinglogo.png';
import sspowerLogo from './assets/SSPowerLogo.png';
import contractorImage from './assets/contractor.jfif';
import { useEffect, useRef, useState } from 'react';
import { Users, Calendar, FileText, AlertTriangle, FolderOpen, ClipboardList, Building, Handshake, Landmark, Clock, Map, BarChart3, User, TrendingUp, TrendingDown, Activity, Plus, CheckCircle, Bell, Settings, LayoutDashboard, Home as HomeIcon, Award, Target, Zap, Star, Trophy, Shield, Flame, Heart, Gift, Sparkles, Crown, Medal, Rocket, CloudLightning as Lightning, Filter, ChevronDown, AlertOctagon, CreditCard, FileSignature, Search, Clock3 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

// Attendance data for pie chart - will be populated from API

// Attendance trend data for last 7 days - will be populated from API

const shiftData = [
  { shift: 'Morning', contractors: 85, color: '#FFD93D' },
  { shift: 'Evening', contractors: 65, color: '#6BCF7F' },
  { shift: 'Night', contractors: 45, color: '#4D96FF' },
  { shift: 'Rotating', contractors: 25, color: '#9B59B6' },
];



const clTrendData = {
  addition: [
    { month: 'Jan', value: 12, target: 15 },
    { month: 'Feb', value: 18, target: 15 },
    { month: 'Mar', value: 8, target: 15 },
    { month: 'Apr', value: 22, target: 15 },
    { month: 'May', value: 16, target: 15 },
    { month: 'Jun', value: 25, target: 15 },
  ],
  attrition: [
    { month: 'Jan', value: 5, benchmark: 8 },
    { month: 'Feb', value: 3, benchmark: 8 },
    { month: 'Mar', value: 12, benchmark: 8 },
    { month: 'Apr', value: 7, benchmark: 8 },
    { month: 'May', value: 4, benchmark: 8 },
    { month: 'Jun', value: 6, benchmark: 8 },
  ]
};

// Contractor scoring matrix based on user requirements
const contractorScoringMatrix = {
  cir: {
    0: { score: 100, remark: 'Zero tolerance maintained' },
    1: { score: 80, remark: 'Minor lapses, immediate corrective action' },
    2: { score: 80, remark: 'Minor lapses, immediate corrective action' },
    3: { score: 60, remark: 'Needs improvement, recurring issues' },
    4: { score: 60, remark: 'Needs improvement, recurring issues' },
    5: { score: 40, remark: 'Serious concern, high risk' },
    6: { score: 40, remark: 'Serious concern, high risk' }
  },
  ehs: {
    0: { score: 100, remark: 'Fully compliant' },
    1: { score: 100, remark: 'Fully compliant' },
    2: { score: 80, remark: 'Minor lapses, manageable' },
    3: { score: 80, remark: 'Minor lapses, manageable' },
    4: { score: 60, remark: 'Compliance gaps visible' },
    5: { score: 60, remark: 'Compliance gaps visible' },
    6: { score: 40, remark: 'Significant non-compliance' },
    7: { score: 40, remark: 'Significant non-compliance' }
  }
};

// Helper function to get score and remark for CIR count
const getCIRScore = (cirCount) => {
  if (cirCount >= 7) {
    return { score: 20, remark: 'Unacceptable, severe risk' };
  }
  return contractorScoringMatrix.cir[cirCount] || { score: 20, remark: 'Unacceptable, severe risk' };
};

// Helper function to get score and remark for EHS violations
const getEHSScore = (ehsCount) => {
  if (ehsCount >= 8) {
    return { score: 20, remark: 'High safety/environment risk' };
  }
  return contractorScoringMatrix.ehs[ehsCount] || { score: 20, remark: 'High safety/environment risk' };
};

function Dashboard({ userRole, userEmail }) {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContractorDropdown, setShowContractorDropdown] = useState(false);
  const [contractors, setContractors] = useState(['All']);
  const [searchTerm, setSearchTerm] = useState('');
  /*const [gamificationScore, setGamificationScore] = useState(1250);
  const [achievements, setAchievements] = useState([
    { id: 1, name: 'Safety Champion', icon: '🛡️', unlocked: true },
    { id: 2, name: 'Efficiency Master', icon: '⚡', unlocked: true },
    { id: 3, name: 'Team Builder', icon: '🤝', unlocked: false },
  ]);*/
  const [animatedStats, setAnimatedStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
  });


 
  // Employee count state
  const [totalEmployees, setTotalEmployees] = useState(0);
 
  // Attendance data state
  const [todayAttendance, setTodayAttendance] = useState({
    present: 0,
    absent: 0,
    total: 0
  });
 
  // Critical incidents count state
  const [criticalIncidentsCount, setCriticalIncidentsCount] = useState(0);
 
  // EHS violations count state
  const [ehsViolationsCount, setEhsViolationsCount] = useState(0);
 
  // Shift distribution state
  const [shiftDistribution, setShiftDistribution] = useState({});
  const [dailyShiftData, setDailyShiftData] = useState([]);
 
  // Attendance pie chart state
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Current month YYYY-MM
  const [attendancePieData, setAttendancePieData] = useState([]); // Start with empty array
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
 
  // Contractor filter state
  const [selectedContractor, setSelectedContractor] = useState('all'); // 'all' means show all contractors
  const [selectedContractorTrend, setSelectedContractorTrend] = useState('all'); // Separate state for trend chart
  const [selectedContractorShift, setSelectedContractorShift] = useState('all'); // Separate state for General Shift chart
  const [selectedShift, setSelectedShift] = useState('all'); // For shift chart shift filter
  const [contractorList, setContractorList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [attendanceTrendData, setAttendanceTrendData] = useState([]);
 
  // CL Addition Trend state
  const [clAdditionTrendData, setClAdditionTrendData] = useState([]);
  const [isClAdditionLoading, setIsClAdditionLoading] = useState(false);
  const [selectedContractorForCLAddition, setSelectedContractorForCLAddition] = useState('all');
  const [contractorBreakdownData, setContractorBreakdownData] = useState({});
 
  // Interactive chart state
  const [selectedChartMonth, setSelectedChartMonth] = useState(null);
  const [monthEmployeeDetails, setMonthEmployeeDetails] = useState([]);
  const [showMonthDetails, setShowMonthDetails] = useState(false);
  const [isLoadingMonthDetails, setIsLoadingMonthDetails] = useState(false);
 
  // CL Attrition Trend state
  const [clAttritionTrendData, setClAttritionTrendData] = useState([]);
  const [isClAttritionLoading, setIsClAttritionLoading] = useState(false);
  const [selectedContractorForCLAttrition, setSelectedContractorForCLAttrition] = useState('all');
 
 
  // Contractor Heatmap state - renamed to scoring table state
  const [contractorScoringData, setContractorScoringData] = useState([]);
  const [isScoringLoading, setIsScoringLoading] = useState(false);
 
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
 
  // Tooltip state for contractor information
  const [showContractorTooltip, setShowContractorTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [contractorEmployeeData, setContractorEmployeeData] = useState([]);
  const [selectedContractorForDetails, setSelectedContractorForDetails] = useState(null);
  const [contractorViewMode, setContractorViewMode] = useState('overview'); // 'overview' or 'employees'
  const [showAllEmployees, setShowAllEmployees] = useState(false);
 
  // Tooltip state for present employees
  const [showPresentTooltip, setShowPresentTooltip] = useState(false);
  const [presentTooltipPosition, setPresentTooltipPosition] = useState({ x: 0, y: 0 });
  const [presentEmployeesData, setPresentEmployeesData] = useState([]);
 
  // New state for contractor-wise view
  const [presentViewMode, setPresentViewMode] = useState('contractors'); // 'contractors' or 'employees'
  const [selectedPresentContractor, setSelectedPresentContractor] = useState(null);
  const [contractorEmployeeCounts, setContractorEmployeeCounts] = useState([]);

  // Tooltip state for absent employees
  const [showAbsentTooltip, setShowAbsentTooltip] = useState(false);
  const [absentTooltipPosition, setAbsentTooltipPosition] = useState({ x: 0, y: 0 });
  const [absentEmployeesData, setAbsentEmployeesData] = useState([]);
  const [absentContractorEmployeeCounts, setAbsentContractorEmployeeCounts] = useState([]);
  
  // New state for absent contractor-wise view
  const [absentViewMode, setAbsentViewMode] = useState('contractors'); // 'contractors' or 'employees'
  const [selectedAbsentContractor, setSelectedAbsentContractor] = useState(null);

  // Chart refs
  const diversityChartRef = useRef(null);
  const attendanceChartRef = useRef(null);
  const shiftChartRef = useRef(null);

  const clAdditionChartRef = useRef(null);
  const clAttritionChartRef = useRef(null);

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

  const modulesToShow = userRole === 'App Administrator' ? allModules : modulesForUser;

  const toggleMenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Animated counter effect
  useEffect(() => {
    const animateValue = (start, end, duration, callback) => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        callback(value);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    animateValue(0, totalEmployees, 2000, (value) => setAnimatedStats(prev => ({ ...prev, total: value })));
    animateValue(0, todayAttendance.present, 2000, (value) => setAnimatedStats(prev => ({ ...prev, present: value })));
    animateValue(0, todayAttendance.absent, 2000, (value) => setAnimatedStats(prev => ({ ...prev, absent: value })));
  }, [totalEmployees, todayAttendance]);

  // Enhanced chart creation with animations
  useEffect(() => {
    // Add a small delay to ensure data is properly set
    const timeoutId = setTimeout(() => {
    try {
      // Check if Chart.js is available
      if (!window.Chart || !shiftChartRef.current) {
        console.warn('Chart prerequisites not ready yet. Retrying chart init...');
        // Trigger a retry after a short delay
        setTimeout(() => {
          try {
            if (window.Chart && shiftChartRef.current) {
              // Force a reflow and recreate charts by dispatching a resize event
              window.dispatchEvent(new Event('resize'));
            }
          } catch (e) {}
        }, 300);
        return;
      }

        console.log('Chart useEffect triggered with attendancePieData:', attendancePieData);

      // Destroy existing chart if it exists
      if (diversityChartRef.current && diversityChartRef.current.chart) {
        console.log('Destroying existing chart from ref');
        diversityChartRef.current.chart.destroy();
        diversityChartRef.current.chart = null;
      }

      // Attendance Pie Chart with animations
      if (diversityChartRef.current && attendancePieData) {
        // Ensure we have valid data structure
        const chartData = attendancePieData.length > 0 ? attendancePieData : [
          { name: 'Present', value: 0, color: '#4ECDC4' },
          { name: 'Absent', value: 0, color: '#FF6B6B' }
        ];
       
        // Check if we have any non-zero values
        const hasData = chartData.some(d => d.value > 0);
        console.log('Chart data check:', { hasData, data: chartData });
       
        // For zero data, we need to show a minimal donut structure
        let displayData = chartData;
        if (!hasData) {
          console.log('No data found, creating chart with minimal values to show structure');
          // Set minimal values to ensure the donut segments are visible
          displayData = [
            { name: 'Present', value: 0.1, color: '#4ECDC4' },
            { name: 'Absent', value: 0.1, color: '#FF6B6B' }
          ];
        }
       
        console.log('Creating chart with data:', displayData);
        console.log('Chart canvas element:', diversityChartRef.current);
        console.log('Chart canvas dimensions:', {
          width: diversityChartRef.current.width,
          height: diversityChartRef.current.height,
          clientWidth: diversityChartRef.current.clientWidth,
          clientHeight: diversityChartRef.current.clientHeight
        });
       
        // Clear any existing chart on the canvas
        const existingChart = window.Chart.getChart(diversityChartRef.current);
        if (existingChart) {
          console.log('Destroying existing chart');
          existingChart.destroy();
        }
       
      const chart = new window.Chart(diversityChartRef.current, {
        type: 'doughnut',
        data: {
          labels: displayData.map(d => d.name),
          datasets: [{
            data: displayData.map(d => d.value),
            backgroundColor: displayData.map(d => d.color),
            borderWidth: 3,
            borderColor: '#fff',
            hoverBorderWidth: 5,
            hoverOffset: 10,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: hasData ? 2000 : 0, // No animation for zero data
          },
          cutout: '60%', // Make it a donut chart
          radius: hasData ? '70%' : '50%', // Smaller radius for zero data
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: { size: 12, weight: 'bold' },
                generateLabels: function(chart) {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    const dataset = data.datasets[0];
                    // Use original chartData for accurate legend display
                    const total = chartData?.reduce((a, b) => a + b.value, 0) || 0;
                   
                    return data.labels.map((label, i) => {
                      const originalValue = chartData[i]?.value || 0;
                      const percentage = total > 0 ? ((originalValue / total) * 100).toFixed(1) : '0';
                      return {
                        text: `${label}: ${originalValue} (${percentage}%)`,
                        fillStyle: dataset.backgroundColor[i],
                        strokeStyle: dataset.borderColor,
                        lineWidth: dataset.borderWidth,
                        pointStyle: 'circle',
                        hidden: false,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            title: {
              display: true,
              text: 'Monthly Attendance Distribution (Muster Reports)',
              font: { size: 16, weight: 'bold' },
              color: '#2c3e50'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  // Use original chartData for accurate tooltip display
                  const total = chartData?.reduce((a, b) => a + b.value, 0) || 0;
                  const originalValue = chartData[context.dataIndex]?.value || 0;
                  const percentage = total > 0 ? ((originalValue / total) * 100).toFixed(1) : '0';
                  return `${context.label}: ${originalValue} (${percentage}%)`;
                }
              }
            }
          }
        },
        plugins: [{
          id: 'percentageDisplay',
          afterDatasetsDraw: function(chart) {
            const ctx = chart.ctx;
            const data = chart.data;
            const dataset = data.datasets[0];
            // Use original chartData for accurate percentage calculation
            const total = chartData?.reduce((a, b) => a + b.value, 0) || 0;
           
            if (total > 0) {
              chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((element, index) => {
                  const originalValue = chartData[index]?.value || 0;
                  const percentage = ((originalValue / total) * 100).toFixed(1);
                 
                  // Position the percentage text in the center of each segment
                  const position = element.tooltipPosition();
                  const x = position.x;
                  const y = position.y;
                 
                  ctx.save();
                  ctx.fillStyle = '#fff';
                  ctx.font = 'bold 14px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(percentage + '%', x, y);
                  ctx.restore();
                });
              });
            } else {
              // Show "0%" in the center when all values are zero
              const centerX = chart.width / 2;
              const centerY = chart.height / 2;
             
              ctx.save();
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('0%', centerX, centerY);
              ctx.restore();
            }
          }
        }]
      });
     
      // Store chart reference for cleanup
      diversityChartRef.current.chart = chart;
      console.log('Chart created successfully:', chart);
      console.log('Chart data:', chart.data);
      console.log('Chart datasets:', chart.data.datasets);
    } else {
      console.log('Chart creation skipped - conditions not met:', {
        hasRef: !!diversityChartRef.current,
        hasData: !!attendancePieData,
        dataLength: attendancePieData?.length || 0
      });
    }

    // Attendance Trend Line Chart
    if (window.Chart && attendanceChartRef.current) {
      // Create test data if no real data
      const trendLabels = attendanceTrendData.length > 0 ? attendanceTrendData.map(d => d.day) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const trendValues = attendanceTrendData.length > 0 ? attendanceTrendData.map(d => d.present) : [45, 52, 38, 61, 48, 42, 35];
     
      console.log('Creating attendance trend chart with:', { trendLabels, trendValues });
     
      const chart = new window.Chart(attendanceChartRef.current, {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Attendance % (Present + Half-day)',
            data: trendValues,
            borderColor: '#FF8C42',
            backgroundColor: 'rgba(255, 140, 66, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#FF8C42',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            title: {
              display: true,
              text: `Last 7 Days Attendance Percentage ${selectedContractorTrend !== 'all' ? `(${selectedContractorTrend})` : '(All Contractors)'}`,
              font: { size: 16, weight: 'bold' },
              color: '#2c3e50'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(0,0,0,0.1)' },
              title: {
                display: true,
                text: 'Attendance Percentage (%)'
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            },
            x: {
              grid: { display: false },
              title: {
                display: true,
                text: 'Days'
              }
            }
          }
        }
      });
     
      // Store chart reference for cleanup
      attendanceChartRef.current.chart = chart;
    }

    // Daily Shift Column Bar Chart
    if (window.Chart && shiftChartRef.current) {
      console.log('Creating shift chart with data:', { dailyShiftData, shiftDistribution });
      console.log('Shift chart ref element:', shiftChartRef.current);
      console.log('Chart.js available:', !!window.Chart);
     
      // Destroy existing chart if it exists
      if (shiftChartRef.current.chart) {
        console.log('Destroying existing shift chart');
        shiftChartRef.current.chart.destroy();
        shiftChartRef.current.chart = null;
      }
     
      // Define colors first
      const colors = [
        '#FFD93D', // Yellow
        '#6BCF7F', // Green
        '#4D96FF', // Blue
        '#9B59B6', // Purple
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Light Blue
        '#96CEB4'  // Light Green
      ];

      // Create L-shaped graph data for General shift
      let chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let chartDatasets = [];

      console.log('Creating L-shaped General shift chart');
      console.log('Daily shift data:', dailyShiftData);
      console.log('Shift distribution data:', shiftDistribution);

      // Check if any employees are assigned to shifts
      const totalAssignedEmployees = Object.values(shiftDistribution).reduce((sum, shift) => sum + (shift.assigned || 0), 0);
      const hasAssignedEmployees = totalAssignedEmployees > 0;
     
      console.log('Total assigned employees:', totalAssignedEmployees);
      console.log('Has assigned employees:', hasAssignedEmployees);
     
      // Create L-shaped pattern data (only used when employees are assigned)
      // Get employee counts for each day of the week using real-time data only
      const generalShiftData = chartLabels.map((day, index) => {
        // Find the day data in dailyShiftData
        const dayData = dailyShiftData.find(d => d.date === day);
        if (dayData && dayData.shifts) {
          // Look for General shift or any shift that might represent general employees
          const generalCount = dayData.shifts['General'] ||
                              dayData.shifts['General Shift'] ||
                              dayData.shifts['general'] ||
                              Object.values(dayData.shifts).reduce((sum, count) => sum + count, 0); // Sum all shifts if no General found
          console.log(`📊 Real-time employee count for ${day}:`, generalCount);
          return generalCount;
        }
       
        // No real data available for this day - show 0
        console.log(`⚠️ No real-time data available for ${day}, showing 0`);
          return 0;
      });

      console.log('📊 Real-time General shift data for chart:', generalShiftData);

      // Create single dataset for General shift with real-time data
      chartDatasets.push({
        label: 'General',
        data: generalShiftData,
        backgroundColor: '#4ECDC4', // Teal color for General shift
        borderColor: '#4ECDC4',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 40,
        maxBarThickness: 50,
      });

      console.log('Final chart data:', { chartLabels, chartDatasets });

      const chart = new window.Chart(shiftChartRef.current, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: chartDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2000,
            delay: (context) => context.dataIndex * 100,
            easing: 'easeInOutQuart'
          },
          barPercentage: 0.8,
          categoryPercentage: 0.9,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'General Shift - Daily Employee Count (Real-time Data)',
              font: { size: 16, weight: 'bold' },
              color: '#2c3e50'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y} employees`;
                },
                afterLabel: function(context) {
                  try {
                    const dayLabel = context.label; // 'Mon', 'Tue', ...
                    const dayData = (Array.isArray(dailyShiftData) ? dailyShiftData : []).find(d => d.date === dayLabel);
                    const names = (dayData && dayData.presentEmployees && (dayData.presentEmployees['General'] || dayData.presentEmployees['General Shift'])) || [];
                    if (!names || names.length === 0) return 'No present employees';
                    const list = names.slice(0, 10).join(', ');
                    return names.length > 10 ? `${list}, …` : list;
                  } catch (e) {
                    return '';
                  }
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              title: {
                display: true,
                text: 'Days',
                font: { size: 12, weight: 'bold' }
              },
              ticks: {
                font: { size: 11 }
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Employees',
                font: { size: 12, weight: 'bold' }
              },
              ticks: {
                stepSize: 1,
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(0,0,0,0.1)',
                drawBorder: false
              }
            }
          }
        }
      });
     
      // Store chart reference for cleanup
      shiftChartRef.current.chart = chart;
      // Ensure proper sizing on first render
      try { chart.resize(); } catch (e) {}
    }

    // CL charts are now created separately via createCLCharts function
    } catch (error) {
      console.error('Error creating charts:', error);
    }
    }, 100); // 100ms delay

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [attendancePieData, attendanceTrendData, dailyShiftData, shiftDistribution, selectedShift, selectedContractor, selectedContractorShift, clAdditionTrendData, clAttritionTrendData]);

  // Debug effect to monitor attendancePieData changes
  useEffect(() => {
    console.log('attendancePieData changed:', attendancePieData);
  }, [attendancePieData]);

  // Debug effect to monitor shift data changes
  useEffect(() => {
    console.log('shiftDistribution changed:', shiftDistribution);
    console.log('dailyShiftData changed:', dailyShiftData);
  }, [shiftDistribution, dailyShiftData]);

  // Fetch contractor list for attendance filter and CL Addition Trend
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        console.log('Fetching contractor list for filters...');
       
        // First try to get contractors from the contractors API
        const response = await fetch('/server/Contracters_function/contractors');
        const data = await response.json();
       
        console.log('Contractors API response:', data);
       
        let contractorNames = [];
       
        if (data.status === 'success' && data.data && data.data.contractors) {
          console.log('Contractor list fetched from API:', data.data.contractors);
          console.log('Sample contractor data:', data.data.contractors.slice(0, 3));
         
          // Extract contractor names from the contractor objects
          contractorNames = data.data.contractors.map(contractor =>
            contractor.ContractorName || contractor.OrganizationName || contractor.NameoftheSiteManager || contractor.NameofSiteIncharge || 'Unknown Contractor'
          ).filter(name => name && name !== 'Unknown Contractor');
         
          console.log('Extracted contractor names from API:', contractorNames);
        }
       
        // Also fetch contractors from employee data for real-time contractor list
        try {
          console.log('Fetching real-time contractor list from employee data...');
          const timestamp = new Date().getTime();
          const employeesResponse = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          const employeesData = await employeesResponse.json();
         
          if (employeesData.status === 'success' && employeesData.data && employeesData.data.employees) {
            const employees = employeesData.data.employees;
            console.log(`📊 Total employees found for contractor list: ${employees.length}`);
           
            // Extract unique contractors from employee data
            const employeeContractors = [...new Set(
              employees
                .map(emp => emp.contractor)
                .filter(contractor => contractor && contractor.trim() !== '')
            )];
           
            console.log('🏢 Contractors from employee data:', employeeContractors);
            console.log('🔍 Contractors from API before merge:', contractorNames);
           
            // Merge with API contractors and remove duplicates with better deduplication
            const allContractors = [...contractorNames, ...employeeContractors];
            console.log('🔗 All contractors before deduplication:', allContractors);
           
            // Advanced deduplication: remove duplicates and similar names
            const uniqueContractors = [];
            allContractors.forEach(contractor => {
              if (!contractor || contractor.trim() === '') return;
             
              const normalizedContractor = contractor.trim();
              const isDuplicate = uniqueContractors.some(existing => {
                const normalizedExisting = existing.trim();
                // Check for exact match or if one contains the other (case insensitive)
                return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                       normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                       normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
              });
             
              if (!isDuplicate) {
                uniqueContractors.push(normalizedContractor);
              }
            });
           
            contractorNames = uniqueContractors;
            console.log('✅ Final unique contractors after deduplication:', contractorNames);
          }
        } catch (employeeError) {
          console.warn('Could not fetch contractors from employee data:', employeeError);
        }
         
        console.log('Final contractor list for filters:', contractorNames);
        setContractorList(contractorNames);
      } catch (error) {
        console.error('Error fetching contractors:', error);
        setContractorList([]);
      }
    };

    fetchContractors();
  }, []);

  // Fetch shift list for shift filter
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        console.log('Fetching shift list for shift filter...');
        const response = await fetch('/server/Shift_function/shifts');
        const data = await response.json();
       
        console.log('Shifts API response for shift filter:', data);
       
        if (data.status === 'success' && data.data && data.data.shifts) {
          const shifts = data.data.shifts.map(shift => shift.shiftName).filter(Boolean);
          const uniqueShifts = [...new Set(shifts)]; // Remove duplicates
          console.log('Shift list fetched for shift filter:', uniqueShifts);
          setShiftList(uniqueShifts);
        } else {
          console.log('No shifts found for shift filter');
          setShiftList([]);
        }
      } catch (error) {
        console.error('Error fetching shifts for shift filter:', error);
        setShiftList([]);
      }
    };

    fetchShifts();
  }, []);

  // Function to fetch employees under a specific contractor
  const fetchEmployeesByContractor = async (contractorName) => {
    try {
      console.log(`=== FETCHING EMPLOYEES FOR CONTRACTOR: ${contractorName} ===`);
      console.log('Making API call to: /server/cms_function/employees');
     
      const response = await fetch(`/server/cms_function/employees?userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
     
      const data = await response.json();
      console.log('Raw API response:', data);
     
      // Check if response has the expected structure
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
        console.log('All employees fetched:', employees.length);
        console.log('Sample employee data structure:', employees[0]);
        console.log('All employee codes from employee management:', employees.map(emp => emp.employeeCode));
        console.log('Sample employee contractor data:', employees.slice(0, 5).map(emp => ({
          employeeCode: emp.employeeCode,
          contractor: emp.contractor,
          contractorName: emp.contractorName
        })));
       
        // Filter employees by contractor - use the correct field name 'contractor'
        const employeesUnderContractor = employees.filter(employee => {
          // Use the correct field name 'contractor' from the employee data structure
          const employeeContractor = employee.contractor;
         
          // More robust comparison with multiple fallback options
          let isMatch = false;
         
          if (employeeContractor && contractorName) {
            // Direct match
            isMatch = employeeContractor === contractorName;
           
            // Case-insensitive match
            if (!isMatch && typeof employeeContractor === 'string' && typeof contractorName === 'string') {
              isMatch = employeeContractor.toLowerCase().trim() === contractorName.toLowerCase().trim();
            }
           
            // Partial match (in case of slight variations)
            if (!isMatch && typeof employeeContractor === 'string' && typeof contractorName === 'string') {
              const empContractorLower = employeeContractor.toLowerCase().trim();
              const contractorNameLower = contractorName.toLowerCase().trim();
              isMatch = empContractorLower.includes(contractorNameLower) ||
                       contractorNameLower.includes(empContractorLower);
            }
          }
         
          if (isMatch) {
            console.log(`✓ Employee ${employee.employeeCode} belongs to contractor ${contractorName} (employee contractor: ${employeeContractor})`);
          } else {
            console.log(`✗ Employee ${employee.employeeCode} does not belong to contractor ${contractorName} (employee contractor: ${employeeContractor})`);
          }
         
          return isMatch;
        });
       
        console.log(`Found ${employeesUnderContractor.length} employees under contractor ${contractorName}`);
        console.log('Employee codes under contractor:', employeesUnderContractor.map(emp => emp.employeeCode));
       
        return employeesUnderContractor.map(emp => emp.employeeCode);
      } else {
        console.log('No employee data found - unexpected response structure');
        console.log('Response structure:', {
          status: data?.status,
          hasData: !!data?.data,
          hasEmployees: !!data?.data?.employees,
          dataKeys: data ? Object.keys(data) : 'data is null/undefined'
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching employees by contractor:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return [];
    }
  };

  // Function to fetch contractor data for tooltip
  const fetchContractorDataForTooltip = async () => {
    try {
      console.log('Fetching contractor data for tooltip...');
      console.log('User role:', userRole, 'User email:', userEmail);
     
      // Fetch employees with proper user role and email parameters
      const response = await fetch(`/server/cms_function/employees?userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}&returnAll=true`);
      const data = await response.json();
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
        console.log('Fetched employees for tooltip:', employees.length, 'for user role:', userRole);
        console.log('Sample employee data structure:', employees[0]);
        console.log('Employee code fields available:', employees.slice(0, 3).map(emp => ({
          employeeCode: emp.employeeCode,
          EmployeeCode: emp.EmployeeCode,
          id: emp.id,
          allKeys: Object.keys(emp)
        })));
       
        // Group employees by contractor
        const contractorGroups = {};
        employees.forEach(employee => {
          const contractor = employee.contractor || employee.contractorName || 'Unknown';
          if (!contractorGroups[contractor]) {
            contractorGroups[contractor] = [];
          }
          contractorGroups[contractor].push({
            employeeCode: employee.employeeCode || employee.EmployeeCode || employee.id || 'N/A',
            employeeName: employee.employeeName || employee.EmployeeName || employee.name || 'N/A',
            contractor: contractor
          });
        });
       
        // Convert to array format for display
        const contractorData = Object.entries(contractorGroups).map(([contractorName, employees]) => ({
          contractorName,
          employeeCount: employees.length,
          employees: employees
        }));
       
        console.log('Contractor data for tooltip:', contractorData);
        console.log('Setting contractor data with length:', contractorData.length);
        setContractorEmployeeData(contractorData);
        return contractorData;
      } else {
        console.log('No employee data found for tooltip. Response:', data);
        // Check if it's a permission issue
        if (data.status === 'failure' && data.message && data.message.includes('permission')) {
          console.log('Permission denied for tooltip data');
        }
        setContractorEmployeeData([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching contractor data for tooltip:', error);
      setContractorEmployeeData([]);
      return [];
    }
  };

  // Function to handle contractor click for details
  const handleContractorDetailsClick = (contractor) => {
    setSelectedContractorForDetails(contractor);
    setContractorViewMode('employees');
    setShowAllEmployees(false);
  };

  // Function to go back to contractor overview
  const handleBackToContractorOverview = () => {
    setContractorViewMode('overview');
    setSelectedContractorForDetails(null);
    setShowAllEmployees(false);
  };

  // Function to handle Show All button
  const handleShowAllEmployees = () => {
    setShowAllEmployees(true);
  };

  // Function to close contractor tooltip
  const handleCloseContractorTooltip = () => {
    setShowContractorTooltip(false);
    setContractorViewMode('overview');
    setSelectedContractorForDetails(null);
    setShowAllEmployees(false);
  };

  // Function to fetch present employees data
  const fetchPresentEmployeesData = async () => {
    try {
      console.log('Fetching present employees data...');
     
      const today = new Date().toISOString().split('T')[0];
      const presentEmployeeDetails = [];
      const employeesWithFirstIN = new Set();
     
      // Fetch attendance data for today from API
      try {
        const attendanceResponse = await fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`);
        const attendanceData = await attendanceResponse.json();
       
        if (attendanceData && attendanceData.data && attendanceData.data.length > 0) {
          attendanceData.data.forEach(record => {
            if (record.FirstIN && record.FirstIN.trim() !== '') {
              employeesWithFirstIN.add(record.EmployeeID);
              presentEmployeeDetails.push({
                employeeId: record.EmployeeID,
                firstIn: record.FirstIN,
                lastOut: record.LastOUT || 'Still Present',
                hours: record.Hours || 'N/A'
              });
            }
          });
        }
      } catch (apiError) {
        console.warn('Failed to fetch API attendance data:', apiError);
      }

      // Process imported Excel data from localStorage for today
      try {
        const importedDataStr = localStorage.getItem('importedAttendanceData');
        if (importedDataStr) {
          const importedData = JSON.parse(importedDataStr) || [];
          console.log('Found imported data:', importedData.length, 'records');
          
          const toYMD = (s) => {
            if (!s) return '';
            // Expect DD-MM-YYYY from import; convert to YYYY-MM-DD
            const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (m) return `${m[3]}-${m[2]}-${m[1]}`;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            const d = new Date(s);
            return isNaN(d) ? '' : d.toISOString().slice(0,10);
          };
          
          const todaysImported = importedData.filter(r => toYMD(r.Date) === today);
          console.log('Today\'s imported records:', todaysImported.length);
          
          if (todaysImported.length > 0) {
            const mergedByEmp = {};
            
            // Seed with existing API data
            presentEmployeeDetails.forEach(p => {
              mergedByEmp[p.employeeId] = { ...p };
            });
            
            // Merge imported data
            todaysImported.forEach(r => {
              const empId = r.EmployeeID || r.EmployeeId || r.employeeId;
              if (!empId) return;
              
              const firstIn = r.FirstIN || '';
              const lastOut = r.LastOUT || '';
              
              if (firstIn && firstIn.trim() !== '') {
                employeesWithFirstIN.add(String(empId));
                
                const existing = mergedByEmp[empId];
                if (!existing) {
                  mergedByEmp[empId] = {
                    employeeId: String(empId),
                    firstIn: firstIn || '',
                    lastOut: lastOut || (firstIn ? 'Still Present' : ''),
                    hours: r.TotalHours || 'N/A'
                  };
                } else {
                  // Prefer earliest firstIn and latest lastOut
                  if (firstIn && (!existing.firstIn || firstIn < existing.firstIn)) existing.firstIn = firstIn;
                  if (lastOut && (!existing.lastOut || lastOut > existing.lastOut)) existing.lastOut = lastOut;
                }
              }
            });
            
            // Replace list with merged data
            const mergedList = Object.values(mergedByEmp);
            presentEmployeeDetails.length = 0;
            mergedList.forEach(x => presentEmployeeDetails.push(x));
            
            console.log('Merged present employee details:', presentEmployeeDetails.length);
          }
        }
      } catch (e) {
        console.warn('Failed to process imported Excel data:', e);
      }
      
      // If we have any present employees (from API or imported data), process them
      if (presentEmployeeDetails.length > 0) {
        // Fetch employee details to get names
        const employeeResponse = await fetch(`/server/cms_function/employees?userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}`);
        const employeeData = await employeeResponse.json();
       
        if (employeeData.status === 'success' && employeeData.data && employeeData.data.employees) {
          const allEmployees = employeeData.data.employees;
         
          // Match present employees with their details
          console.log('DEBUG: Matching present employees with employee details');
          console.log('Present employee IDs:', presentEmployeeDetails.map(p => p.employeeId));
          console.log('Available employee codes:', allEmployees.slice(0, 5).map(emp => ({
            employeeCode: emp.employeeCode,
            EmployeeCode: emp.EmployeeCode,
            id: emp.id
          })));
          
          const presentEmployees = presentEmployeeDetails.map(presentEmp => {
            const employeeDetails = allEmployees.find(emp =>
              emp.employeeCode === presentEmp.employeeId ||
              emp.employeeCode === String(presentEmp.employeeId) ||
              emp.EmployeeCode === presentEmp.employeeId ||
              emp.EmployeeCode === String(presentEmp.employeeId) ||
              emp.id === presentEmp.employeeId ||
              emp.id === String(presentEmp.employeeId)
            );
            
            if (!employeeDetails) {
              console.log(`DEBUG: No employee details found for ID: ${presentEmp.employeeId}`);
            } else {
              console.log(`DEBUG: Found employee details for ID: ${presentEmp.employeeId} -> ${employeeDetails.employeeName}`);
            }
           
            return {
              employeeCode: presentEmp.employeeId || employeeDetails?.employeeCode || employeeDetails?.EmployeeCode || employeeDetails?.id || 'N/A',
              employeeName: employeeDetails ? (employeeDetails.employeeName || employeeDetails.EmployeeName || employeeDetails.name || 'N/A') : 'N/A',
              firstIn: presentEmp.firstIn,
              lastOut: presentEmp.lastOut,
              hours: presentEmp.hours,
              contractor: employeeDetails ? (employeeDetails.contractor || employeeDetails.contractorName || 'Unknown') : 'Unknown'
            };
          });
         
          console.log('Present employees data:', presentEmployees);
          // Exclude Unknown contractors from tooltip list and counts
          const filteredPresentEmployees = presentEmployees.filter(emp => {
            const name = (emp.contractor || '').trim().toLowerCase();
            return name && name !== 'unknown' && name !== 'unknown contractor';
          });
          setPresentEmployeesData(filteredPresentEmployees);
          // Also update main Present Today count to exclude Unknown contractors
          const filteredPresentCount = filteredPresentEmployees.length;
          setTodayAttendance(prev => ({
            present: filteredPresentCount,
            total: prev.total,
            absent: prev.total ? Math.max(0, prev.total - filteredPresentCount) : prev.absent
          }));
         
          // Group employees by contractor (excluding Unknown)
          const contractorGroups = {};
          filteredPresentEmployees.forEach(emp => {
            const contractor = emp.contractor;
            if (!contractorGroups[contractor]) {
              contractorGroups[contractor] = [];
            }
            contractorGroups[contractor].push(emp);
          });
         
          // Create contractor count data
          const contractorCounts = Object.entries(contractorGroups).map(([contractorName, employees]) => ({
            contractorName,
            employeeCount: employees.length,
            employees: employees
          }));
         
          setContractorEmployeeCounts(contractorCounts);
          console.log('Contractor employee counts:', contractorCounts);
         
          return presentEmployees;
        } else {
          console.log('No employee details found');
          setPresentEmployeesData([]);
          setContractorEmployeeCounts([]);
          return [];
        }
      } else {
        console.log('No present employees found for today');
        setPresentEmployeesData([]);
        setContractorEmployeeCounts([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching present employees data:', error);
      setPresentEmployeesData([]);
      setContractorEmployeeCounts([]);
      return [];
    }
  };

  // Function to handle contractor selection and switch to employee view
  const handleContractorClick = (contractorName) => {
    setSelectedPresentContractor(contractorName);
    setPresentViewMode('employees');
  };

  // Function to go back to contractor view
  const handleBackToContractors = () => {
    setPresentViewMode('contractors');
    setSelectedPresentContractor(null);
  };

  // Function to close present tooltip and reset view
  const handleClosePresentTooltip = () => {
    setShowPresentTooltip(false);
    setPresentViewMode('contractors');
    setSelectedPresentContractor(null);
  };

  // Function to fetch absent employees data
  const fetchAbsentEmployeesData = async () => {
    try {
      console.log('Fetching absent employees data...');
     
      const today = new Date().toISOString().split('T')[0];
      const employeesWithFirstIN = new Set();
     
      // Fetch attendance data for today from API
      try {
        const attendanceResponse = await fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`);
        const attendanceData = await attendanceResponse.json();
       
        if (attendanceData && attendanceData.data && attendanceData.data.length > 0) {
          attendanceData.data.forEach(record => {
            if (record.FirstIN && record.FirstIN.trim() !== '') {
              employeesWithFirstIN.add(record.EmployeeID);
            }
          });
        }
      } catch (apiError) {
        console.warn('Failed to fetch API attendance data:', apiError);
      }

      // Process imported Excel data for today to identify present employees
      try {
        const importedDataStr = localStorage.getItem('importedAttendanceData');
        if (importedDataStr) {
          const importedData = JSON.parse(importedDataStr) || [];
          console.log('Found imported data for absent calc:', importedData.length, 'records');
          
          const toYMD = (s) => {
            if (!s) return '';
            const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (m) return `${m[3]}-${m[2]}-${m[1]}`;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            const d = new Date(s);
            return isNaN(d) ? '' : d.toISOString().slice(0,10);
          };
          
          const todaysImported = importedData.filter(r => toYMD(r.Date) === today);
          console.log('Today\'s imported records for absent calc:', todaysImported.length);
          
          todaysImported.forEach(r => {
            const empId = r.EmployeeID || r.EmployeeId || r.employeeId;
            if (empId && r.FirstIN && String(r.FirstIN).trim() !== '') {
              employeesWithFirstIN.add(String(empId));
            }
          });
        }
      } catch (e) {
        console.warn('Failed to process imported data for absent calc:', e);
      }
      
      console.log('Total present employees found:', employeesWithFirstIN.size);
      console.log('Present employee IDs:', Array.from(employeesWithFirstIN));
       
      // Fetch all employees to get the complete list
      const employeeResponse = await fetch(`/server/cms_function/employees?returnAll=true&userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}`);
      const employeeData = await employeeResponse.json();
     
      if (employeeData.status === 'success' && employeeData.data && employeeData.data.employees) {
        const allEmployees = employeeData.data.employees;
        console.log('Total employees in system:', allEmployees.length);
        console.log('DEBUG: Present employee IDs in set:', Array.from(employeesWithFirstIN));
        console.log('DEBUG: Sample employee data for matching:', allEmployees.slice(0, 3).map(emp => ({
          employeeCode: emp.employeeCode,
          EmployeeCode: emp.EmployeeCode,
          id: emp.id,
          employeeName: emp.employeeName
        })));
       
        // Find absent employees (employees not in the present list)
        const absentEmployees = allEmployees.filter(emp => {
          const empId = emp.employeeCode || emp.EmployeeCode || emp.id;
          const isPresent = employeesWithFirstIN.has(empId) || 
                           employeesWithFirstIN.has(String(empId)) ||
                           employeesWithFirstIN.has(emp.employeeCode) ||
                           employeesWithFirstIN.has(emp.EmployeeCode);
          if (!isPresent) {
            console.log('Absent employee found:', empId, emp.employeeName);
          }
          return !isPresent;
        }).map(emp => ({
          employeeCode: emp.employeeCode || emp.EmployeeCode || emp.id || 'N/A',
          employeeName: emp.employeeName || emp.EmployeeName || emp.name || 'N/A',
          contractor: emp.contractor || emp.contractorName || 'Unknown'
        }));
       
        console.log('Absent employees data:', absentEmployees);
        setAbsentEmployeesData(absentEmployees);
       
        // Group employees by contractor
        const contractorGroups = {};
        absentEmployees.forEach(emp => {
          const contractor = emp.contractor;
          if (!contractorGroups[contractor]) {
            contractorGroups[contractor] = [];
          }
          contractorGroups[contractor].push(emp);
        });
       
        // Create contractor count data
        const contractorCounts = Object.entries(contractorGroups).map(([contractorName, employees]) => ({
          contractorName,
          employeeCount: employees.length,
          employees: employees
        }));
       
        setAbsentContractorEmployeeCounts(contractorCounts);
        console.log('Absent contractor employee counts:', contractorCounts);
       
        return absentEmployees;
      } else {
        console.log('No employee details found');
        setAbsentEmployeesData([]);
        setAbsentContractorEmployeeCounts([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching absent employees data:', error);
      setAbsentEmployeesData([]);
      setAbsentContractorEmployeeCounts([]);
      return [];
    }
  };

  // Function to handle absent contractor selection and switch to employee view
  const handleAbsentContractorClick = (contractorName) => {
    setSelectedAbsentContractor(contractorName);
    setAbsentViewMode('employees');
  };

  // Function to go back to absent contractor view
  const handleBackToAbsentContractors = () => {
    setAbsentViewMode('contractors');
    setSelectedAbsentContractor(null);
  };

  // Function to close absent tooltip and reset view
  const handleCloseAbsentTooltip = () => {
    setShowAbsentTooltip(false);
    setAbsentViewMode('contractors');
    setSelectedAbsentContractor(null);
  };

  // Fetch contractors for filter
  useEffect(() => {
    fetch('/server/Contracters_function/contractors')
      .then(res => res.json())
      .then(data => {
        console.log('Contractors API response:', data);
        if (data.status === 'success' && data.data && data.data.contractors) {
          const contractorNames = data.data.contractors.map(c => c.ContractorName).filter(Boolean);
          console.log('Extracted contractor names:', contractorNames);
          setContractors(['All', ...contractorNames]);
        } else {
          console.log('No contractors found in response');
          setContractors(['All']);
        }
      })
      .catch(err => {
        console.error('Failed to fetch contractors:', err);
        setContractors(['All']);
      });
  }, []);

  // Click outside handler for contractor dropdown and tooltips
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.dashboard-filter-icon-container')) {
        setShowContractorDropdown(false);
      }
      if (!event.target.closest('.contractor-tooltip') && !event.target.closest('.dashboard-stat-card')) {
        setShowContractorTooltip(false);
      }
      if (!event.target.closest('.present-tooltip') && !event.target.closest('.dashboard-stat-card')) {
        setShowPresentTooltip(false);
      }
      if (!event.target.closest('.absent-tooltip') && !event.target.closest('.dashboard-stat-card')) {
        setShowAbsentTooltip(false);
      }
    }

    if (showContractorDropdown || showContractorTooltip || showPresentTooltip || showAbsentTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
   
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContractorDropdown, showContractorTooltip, showPresentTooltip, showAbsentTooltip]);

  // Fetch total employee count
  useEffect(() => {
    fetch('/server/cms_function/employees?returnAll=true')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.employees) {
          setTotalEmployees(data.data.employees.length);
        }
      })
      .catch(err => {
        console.error('Failed to fetch employee count:', err);
        setTotalEmployees(0);
      });
  }, []);

  // Fetch today's attendance data from both BHR and Attendance tables
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
   
    // Fetch data from both tables in parallel
    const fetchBHRData = fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`)
      .then(res => res.json())
      .catch(err => {
        console.error('Failed to fetch BHR data:', err);
        return { data: [] };
      });

    const fetchAttendanceData = fetch(`/server/importattendance_function/attendance?startDate=${today}&endDate=${today}&perPage=1000`)
      .then(res => res.json())
      .catch(err => {
        console.error('Failed to fetch Attendance table data:', err);
        return { data: { attendanceRecords: [] } };
      });

    Promise.all([fetchBHRData, fetchAttendanceData])
      .then(([bhrData, attendanceData]) => {
        // Count employees who have FirstIN records (regardless of LastOUT or hours)
        const employeesWithFirstIN = new Set();
       
        // Add BHR table attendance records (real-time device data)
        if (bhrData && bhrData.data && bhrData.data.length > 0) {
          console.log('Dashboard: Found BHR data:', bhrData.data.length, 'records');
          bhrData.data.forEach(record => {
            if (record.FirstIN && record.FirstIN.trim() !== '') {
              employeesWithFirstIN.add(record.EmployeeID);
            }
          });
        }
       
        // Add Attendance table records (imported Excel data)
        console.log('Dashboard: Raw attendanceData response:', attendanceData);
        if (attendanceData && attendanceData.data && attendanceData.data.attendanceRecords && attendanceData.data.attendanceRecords.length > 0) {
          console.log('Dashboard: Found Attendance table data:', attendanceData.data.attendanceRecords.length, 'records');
          attendanceData.data.attendanceRecords.forEach(record => {
            console.log('Dashboard: Processing record:', record);
            if (record.firstIn && record.firstIn.trim() !== '') {
              console.log('Dashboard: Adding employee from Attendance table:', record.employeeId, 'with FirstIn:', record.firstIn);
              employeesWithFirstIN.add(record.employeeId);
            } else {
              console.log('Dashboard: Skipping record - no FirstIn or empty FirstIn:', record.employeeId, 'FirstIn:', record.firstIn);
            }
          });
        } else {
          console.log('Dashboard: No Attendance table data found');
          console.log('Dashboard: attendanceData structure:', {
            hasData: !!attendanceData,
            hasDataProperty: !!(attendanceData && attendanceData.data),
            hasAttendanceRecords: !!(attendanceData && attendanceData.data && attendanceData.data.attendanceRecords),
            recordsLength: attendanceData && attendanceData.data && attendanceData.data.attendanceRecords ? attendanceData.data.attendanceRecords.length : 'N/A'
          });
        }

        // Also check localStorage as fallback (for backward compatibility)
        const importedDataStr = localStorage.getItem('importedAttendanceData');
        if (importedDataStr) {
          try {
            const importedData = JSON.parse(importedDataStr);
            if (importedData && importedData.length > 0) {
              console.log('Dashboard: Found localStorage imported data:', importedData.length, 'records');
              importedData.forEach(record => {
                if (record.FirstIN && record.FirstIN.trim() !== '') {
                  console.log('Dashboard: Adding employee from localStorage:', record.EmployeeID);
                  employeesWithFirstIN.add(record.EmployeeID);
                }
              });
            }
          } catch (e) {
            console.error('Error parsing localStorage imported attendance data:', e);
          }
        }
         
        const presentCount = employeesWithFirstIN.size; // All employees who checked in (BHR + Attendance table + localStorage)
        console.log('Dashboard: Total present count:', presentCount);
         
        // Get total employee count for proper calculation
        fetch('/server/cms_function/employees?returnAll=true')
          .then(res => res.json())
          .then(empData => {
            if (empData.status === 'success' && empData.data && empData.data.employees) {
              const employees = empData.data.employees;
              const isKnownContractor = (contractorName) => {
                const name = (contractorName || '').trim().toLowerCase();
                return name && name !== 'unknown' && name !== 'unknown contractor';
              };
              const filteredPresentCount = Array.from(employeesWithFirstIN).reduce((count, empId) => {
                const match = employees.find(emp => (
                  emp.employeeCode === empId ||
                  emp.employeeCode === String(empId) ||
                  emp.EmployeeCode === empId ||
                  emp.EmployeeCode === String(empId) ||
                  emp.id === empId ||
                  emp.id === String(empId)
                ));
                return match && isKnownContractor(match.contractor || match.contractorName)
                  ? count + 1
                  : count;
              }, 0);
              const totalEmployees = employees.length;
              const actualAbsentCount = totalEmployees - filteredPresentCount;
      
              setTodayAttendance({
                present: filteredPresentCount,
                absent: Math.max(0, actualAbsentCount), // Ensure non-negative
                total: totalEmployees
              });
            } else {
              setTodayAttendance({
                present: presentCount,
                absent: 0,
                total: presentCount
              });
            }
          })
          .catch(err => {
            console.error('Failed to fetch employee count:', err);
            setTodayAttendance({
              present: presentCount,
              absent: 0,
              total: presentCount
            });
          });
      })
      .catch(err => {
        console.error('Failed to fetch attendance data:', err);
        setTodayAttendance({ present: 0, absent: 0, total: 0 });
      });
  }, []);

  // Auto-refresh attendance data on page load if imported data exists
  useEffect(() => {
    const importedDataStr = localStorage.getItem('importedAttendanceData');
    if (importedDataStr) {
      console.log('Dashboard: Found imported data on page load, auto-refreshing attendance');
      // Small delay to ensure all components are loaded
      setTimeout(() => {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch data from both tables in parallel
        const fetchBHRData = fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`)
          .then(res => res.json())
          .catch(err => {
            console.error('Failed to fetch BHR data:', err);
            return { data: [] };
          });

        const fetchAttendanceData = fetch(`/server/importattendance_function/attendance?startDate=${today}&endDate=${today}&perPage=1000`)
          .then(res => res.json())
          .catch(err => {
            console.error('Failed to fetch Attendance table data:', err);
            return { data: { attendanceRecords: [] } };
          });

        Promise.all([fetchBHRData, fetchAttendanceData])
          .then(([bhrData, attendanceData]) => {
            const employeesWithFirstIN = new Set();
           
            // Add BHR table attendance records (real-time device data)
            if (bhrData && bhrData.data && bhrData.data.length > 0) {
              console.log('Dashboard (Auto): Found BHR data:', bhrData.data.length, 'records');
              bhrData.data.forEach(record => {
                if (record.FirstIN && record.FirstIN.trim() !== '') {
                  employeesWithFirstIN.add(record.EmployeeID);
                }
              });
            }
           
            // Add Attendance table records (imported Excel data)
            console.log('Dashboard (Auto): Raw attendanceData response:', attendanceData);
            if (attendanceData && attendanceData.data && attendanceData.data.attendanceRecords && attendanceData.data.attendanceRecords.length > 0) {
              console.log('Dashboard (Auto): Found Attendance table data:', attendanceData.data.attendanceRecords.length, 'records');
              attendanceData.data.attendanceRecords.forEach(record => {
                console.log('Dashboard (Auto): Processing record:', record);
                if (record.firstIn && record.firstIn.trim() !== '') {
                  console.log('Dashboard (Auto): Adding employee from Attendance table:', record.employeeId, 'with FirstIn:', record.firstIn);
                  employeesWithFirstIN.add(record.employeeId);
                } else {
                  console.log('Dashboard (Auto): Skipping record - no FirstIn or empty FirstIn:', record.employeeId, 'FirstIn:', record.firstIn);
                }
              });
            } else {
              console.log('Dashboard (Auto): No Attendance table data found');
              console.log('Dashboard (Auto): attendanceData structure:', {
                hasData: !!attendanceData,
                hasDataProperty: !!(attendanceData && attendanceData.data),
                hasAttendanceRecords: !!(attendanceData && attendanceData.data && attendanceData.data.attendanceRecords),
                recordsLength: attendanceData && attendanceData.data && attendanceData.data.attendanceRecords ? attendanceData.data.attendanceRecords.length : 'N/A'
              });
            }

            // Also check localStorage as fallback (for backward compatibility)
            try {
              const importedData = JSON.parse(importedDataStr);
              if (importedData && importedData.length > 0) {
                console.log('Dashboard (Auto): Found localStorage imported data:', importedData.length, 'records');
                importedData.forEach(record => {
                  if (record.FirstIN && record.FirstIN.trim() !== '') {
                    console.log('Dashboard (Auto): Adding employee from localStorage:', record.EmployeeID);
                    employeesWithFirstIN.add(record.EmployeeID);
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing localStorage imported attendance data:', e);
            }
             
            const presentCount = employeesWithFirstIN.size; // All employees who checked in (BHR + Attendance table + localStorage)
            console.log('Dashboard (Auto): Total present count:', presentCount);
           
            // Get total employee count for proper calculation
            fetch('/server/cms_function/employees?returnAll=true')
              .then(res => res.json())
              .then(empData => {
                if (empData.status === 'success' && empData.data && empData.data.employees) {
                  const employees = empData.data.employees;
                  const isKnownContractor = (contractorName) => {
                    const name = (contractorName || '').trim().toLowerCase();
                    return name && name !== 'unknown' && name !== 'unknown contractor';
                  };
                  const filteredPresentCount = Array.from(employeesWithFirstIN).reduce((count, empId) => {
                    const match = employees.find(emp => (
                      emp.employeeCode === empId ||
                      emp.employeeCode === String(empId) ||
                      emp.EmployeeCode === empId ||
                      emp.EmployeeCode === String(empId) ||
                      emp.id === empId ||
                      emp.id === String(empId)
                    ));
                    return match && isKnownContractor(match.contractor || match.contractorName)
                      ? count + 1
                      : count;
                  }, 0);
                  const totalEmployees = employees.length;
                  const actualAbsentCount = totalEmployees - filteredPresentCount;
          
                  setTodayAttendance({
                    present: filteredPresentCount,
                    absent: Math.max(0, actualAbsentCount),
                    total: totalEmployees
                  });
                } else {
                  setTodayAttendance({
                    present: presentCount,
                    absent: 0,
                    total: presentCount
                  });
                }
              })
              .catch(err => {
                console.error('Failed to fetch employee count:', err);
                setTodayAttendance({
                  present: presentCount,
                  absent: 0,
                  total: presentCount
                });
              });
          })
          .catch(err => {
            console.error('Failed to fetch attendance data:', err);
            setTodayAttendance({ present: 0, absent: 0, total: 0 });
          });
      }, 1000); // 1 second delay
    }
  }, []);

  // Manual refresh function for attendance data
  const refreshAttendanceData = () => {
    console.log('Dashboard: Manual refresh triggered');
    const today = new Date().toISOString().split('T')[0];
   
    // Fetch data from both tables in parallel
    const fetchBHRData = fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`)
      .then(res => res.json())
      .catch(err => {
        console.error('Failed to fetch BHR data:', err);
        return { data: [] };
      });

    const fetchAttendanceData = fetch(`/server/importattendance_function/attendance?startDate=${today}&endDate=${today}&perPage=1000`)
      .then(res => res.json())
      .catch(err => {
        console.error('Failed to fetch Attendance table data:', err);
        return { data: { attendanceRecords: [] } };
      });

    Promise.all([fetchBHRData, fetchAttendanceData])
      .then(([bhrData, attendanceData]) => {
        // Count employees who have FirstIN records (regardless of LastOUT or hours)
        const employeesWithFirstIN = new Set();
       
        // Add BHR table attendance records (real-time device data)
        if (bhrData && bhrData.data && bhrData.data.length > 0) {
          console.log('Dashboard (Manual): Found BHR data:', bhrData.data.length, 'records');
          bhrData.data.forEach(record => {
            if (record.FirstIN && record.FirstIN.trim() !== '') {
              employeesWithFirstIN.add(record.EmployeeID);
            }
          });
        }
       
        // Add Attendance table records (imported Excel data)
        console.log('Dashboard (Manual): Raw attendanceData response:', attendanceData);
        if (attendanceData && attendanceData.data && attendanceData.data.attendanceRecords && attendanceData.data.attendanceRecords.length > 0) {
          console.log('Dashboard (Manual): Found Attendance table data:', attendanceData.data.attendanceRecords.length, 'records');
          attendanceData.data.attendanceRecords.forEach(record => {
            console.log('Dashboard (Manual): Processing record:', record);
            if (record.firstIn && record.firstIn.trim() !== '') {
              console.log('Dashboard (Manual): Adding employee from Attendance table:', record.employeeId, 'with FirstIn:', record.firstIn);
              employeesWithFirstIN.add(record.employeeId);
            } else {
              console.log('Dashboard (Manual): Skipping record - no FirstIn or empty FirstIn:', record.employeeId, 'FirstIn:', record.firstIn);
            }
          });
        } else {
          console.log('Dashboard (Manual): No Attendance table data found');
          console.log('Dashboard (Manual): attendanceData structure:', {
            hasData: !!attendanceData,
            hasDataProperty: !!(attendanceData && attendanceData.data),
            hasAttendanceRecords: !!(attendanceData && attendanceData.data && attendanceData.data.attendanceRecords),
            recordsLength: attendanceData && attendanceData.data && attendanceData.data.attendanceRecords ? attendanceData.data.attendanceRecords.length : 'N/A'
          });
        }

        // Also check localStorage as fallback (for backward compatibility)
        const importedDataStr = localStorage.getItem('importedAttendanceData');
        if (importedDataStr) {
          try {
            const importedData = JSON.parse(importedDataStr);
            if (importedData && importedData.length > 0) {
              console.log('Dashboard (Manual): Found localStorage imported data:', importedData.length, 'records');
              importedData.forEach(record => {
                if (record.FirstIN && record.FirstIN.trim() !== '') {
                  console.log('Dashboard (Manual): Adding employee from localStorage:', record.EmployeeID);
                  employeesWithFirstIN.add(record.EmployeeID);
                }
              });
            }
          } catch (e) {
            console.error('Error parsing localStorage imported attendance data:', e);
          }
        }
         
        const presentCount = employeesWithFirstIN.size; // All employees who checked in (BHR + Attendance table + localStorage)
        console.log('Dashboard (Manual): Total present count:', presentCount);
       
        // Get total employee count for proper calculation
        fetch('/server/cms_function/employees?returnAll=true')
          .then(res => res.json())
          .then(empData => {
            if (empData.status === 'success' && empData.data && empData.data.employees) {
              const employees = empData.data.employees;
              const isKnownContractor = (contractorName) => {
                const name = (contractorName || '').trim().toLowerCase();
                return name && name !== 'unknown' && name !== 'unknown contractor';
              };
              const filteredPresentCount = Array.from(employeesWithFirstIN).reduce((count, empId) => {
                const match = employees.find(emp => (
                  emp.employeeCode === empId ||
                  emp.employeeCode === String(empId) ||
                  emp.EmployeeCode === empId ||
                  emp.EmployeeCode === String(empId) ||
                  emp.id === empId ||
                  emp.id === String(empId)
                ));
                return match && isKnownContractor(match.contractor || match.contractorName)
                  ? count + 1
                  : count;
              }, 0);
              const totalEmployees = employees.length;
              const actualAbsentCount = totalEmployees - filteredPresentCount;
      
              setTodayAttendance({
                present: filteredPresentCount,
                absent: Math.max(0, actualAbsentCount),
                total: totalEmployees
              });
            } else {
              setTodayAttendance({
                present: presentCount,
                absent: 0,
                total: presentCount
              });
            }
          })
          .catch(err => {
            console.error('Failed to fetch employee count:', err);
            setTodayAttendance({
              present: presentCount,
              absent: 0,
              total: presentCount
            });
          });
      })
      .catch(err => {
        console.error('Failed to fetch attendance data:', err);
        setTodayAttendance({ present: 0, absent: 0, total: 0 });
      });
  };

  // Listen for changes to imported attendance data
  useEffect(() => {
    const handleStorageChange = () => {
      // Refresh attendance data when imported data changes
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch data from both tables in parallel
      const fetchBHRData = fetch(`/server/GetAttendanceList?startDate=${today}&endDate=${today}&summary=true`)
        .then(res => res.json())
        .catch(err => {
          console.error('Failed to fetch BHR data:', err);
          return { data: [] };
        });

      const fetchAttendanceData = fetch(`/server/importattendance_function/attendance?startDate=${today}&endDate=${today}&perPage=1000`)
        .then(res => res.json())
        .catch(err => {
          console.error('Failed to fetch Attendance table data:', err);
          return { data: { attendanceRecords: [] } };
        });

      Promise.all([fetchBHRData, fetchAttendanceData])
        .then(([bhrData, attendanceData]) => {
          // Count employees who have FirstIN records (regardless of LastOUT or hours)
          const employeesWithFirstIN = new Set();
         
          // Add BHR table attendance records (real-time device data)
          if (bhrData && bhrData.data && bhrData.data.length > 0) {
            console.log('Dashboard (Event): Found BHR data:', bhrData.data.length, 'records');
            bhrData.data.forEach(record => {
              if (record.FirstIN && record.FirstIN.trim() !== '') {
                employeesWithFirstIN.add(record.EmployeeID);
              }
            });
          }
         
          // Add Attendance table records (imported Excel data)
          console.log('Dashboard (Event): Raw attendanceData response:', attendanceData);
          if (attendanceData && attendanceData.data && attendanceData.data.attendanceRecords && attendanceData.data.attendanceRecords.length > 0) {
            console.log('Dashboard (Event): Found Attendance table data:', attendanceData.data.attendanceRecords.length, 'records');
            attendanceData.data.attendanceRecords.forEach(record => {
              console.log('Dashboard (Event): Processing record:', record);
              if (record.firstIn && record.firstIn.trim() !== '') {
                console.log('Dashboard (Event): Adding employee from Attendance table:', record.employeeId, 'with FirstIn:', record.firstIn);
                employeesWithFirstIN.add(record.employeeId);
              } else {
                console.log('Dashboard (Event): Skipping record - no FirstIn or empty FirstIn:', record.employeeId, 'FirstIn:', record.firstIn);
              }
            });
          } else {
            console.log('Dashboard (Event): No Attendance table data found');
            console.log('Dashboard (Event): attendanceData structure:', {
              hasData: !!attendanceData,
              hasDataProperty: !!(attendanceData && attendanceData.data),
              hasAttendanceRecords: !!(attendanceData && attendanceData.data && attendanceData.data.attendanceRecords),
              recordsLength: attendanceData && attendanceData.data && attendanceData.data.attendanceRecords ? attendanceData.data.attendanceRecords.length : 'N/A'
            });
          }

          // Also check localStorage as fallback (for backward compatibility)
          const importedDataStr = localStorage.getItem('importedAttendanceData');
          if (importedDataStr) {
            try {
              const importedData = JSON.parse(importedDataStr);
              if (importedData && importedData.length > 0) {
                console.log('Dashboard (Event): Found localStorage imported data:', importedData.length, 'records');
                importedData.forEach(record => {
                  if (record.FirstIN && record.FirstIN.trim() !== '') {
                    console.log('Dashboard (Event): Adding employee from localStorage:', record.EmployeeID);
                    employeesWithFirstIN.add(record.EmployeeID);
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing localStorage imported attendance data:', e);
            }
          }
           
          const presentCount = employeesWithFirstIN.size; // All employees who checked in (BHR + Attendance table + localStorage)
          console.log('Dashboard (Event): Total present count:', presentCount);
         
          // Get total employee count for proper calculation
          fetch('/server/cms_function/employees?returnAll=true')
            .then(res => res.json())
            .then(empData => {
              if (empData.status === 'success' && empData.data && empData.data.employees) {
                const employees = empData.data.employees;
                const isKnownContractor = (contractorName) => {
                  const name = (contractorName || '').trim().toLowerCase();
                  return name && name !== 'unknown' && name !== 'unknown contractor';
                };
                const filteredPresentCount = Array.from(employeesWithFirstIN).reduce((count, empId) => {
                  const match = employees.find(emp => (
                    emp.employeeCode === empId ||
                    emp.employeeCode === String(empId) ||
                    emp.EmployeeCode === empId ||
                    emp.EmployeeCode === String(empId) ||
                    emp.id === empId ||
                    emp.id === String(empId)
                  ));
                  return match && isKnownContractor(match.contractor || match.contractorName)
                    ? count + 1
                    : count;
                }, 0);
                const totalEmployees = employees.length;
                const actualAbsentCount = totalEmployees - filteredPresentCount;
        
                setTodayAttendance({
                  present: filteredPresentCount,
                  absent: Math.max(0, actualAbsentCount),
                  total: totalEmployees
                });
              } else {
                setTodayAttendance({
                  present: presentCount,
                  absent: 0,
                  total: presentCount
                });
              }
            })
            .catch(err => {
              console.error('Failed to fetch employee count:', err);
              setTodayAttendance({
                present: presentCount,
                absent: 0,
                total: presentCount
              });
            });
         
          // Also refresh the present employees tooltip data
          fetchPresentEmployeesData();
        })
        .catch(err => {
          console.error('Failed to fetch attendance data:', err);
          setTodayAttendance({ present: 0, absent: 0, total: 0 });
        });
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
   
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('importedDataChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('importedDataChanged', handleStorageChange);
    };
  }, []);

  // Fetch critical incidents count for current month
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = now.getFullYear();
   
    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
   
    // Format dates as YYYY-MM-DD
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];
   
    fetch(`/server/CriticalIncident_function/incidents?startDate=${startDate}&endDate=${endDate}&returnAll=true`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.incidents) {
          // Count incidents that fall within the current month
          const monthlyIncidents = data.data.incidents.filter(incident => {
            if (!incident.Date1) return false;
            const incidentDate = new Date(incident.Date1);
            return incidentDate >= firstDayOfMonth && incidentDate <= lastDayOfMonth;
          });
          setCriticalIncidentsCount(monthlyIncidents.length);
        }
      })
      .catch(err => {
        console.error('Failed to fetch critical incidents count:', err);
        setCriticalIncidentsCount(0);
      });
  }, []);

  // Fetch EHS violations count for current month
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = now.getFullYear();
   
    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
   
    // Format dates as YYYY-MM-DD
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];
   
    fetch(`/server/EHSViolation_function/violations?startDate=${startDate}&endDate=${endDate}&returnAll=true`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.violations) {
          // Count violations that fall within the current month
          const monthlyViolations = data.data.violations.filter(violation => {
            if (!violation.DateofViolation) return false;
            const violationDate = new Date(violation.DateofViolation);
            return violationDate >= firstDayOfMonth && violationDate <= lastDayOfMonth;
          });
          setEhsViolationsCount(monthlyViolations.length);
        }
      })
      .catch(err => {
        console.error('Failed to fetch EHS violations count:', err);
        setEhsViolationsCount(0);
      });
  }, []);

  // Fetch monthly attendance data for pie chart from muster reports
  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      try {
        setIsAttendanceLoading(true);
        console.log('Fetching monthly attendance for:', selectedMonth);
        const [year, month] = selectedMonth.split('-');
        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]; // Last day of month
       
        console.log('API Request:', { startDate, endDate });
        const response = await fetch(`/server/attendance_muster_function?startDate=${startDate}&endDate=${endDate}&source=both`);
        const data = await response.json();
       
        console.log('API Response:', data);
        console.log('Muster data length:', data?.muster?.length || 0);
        console.log('Sample muster data:', data?.muster?.slice(0, 2) || 'No data');
       
        if (data && data.muster && data.muster.length > 0) {
          let presentTotal = 0;
          let absentTotal = 0;
         
          // Filter employees by selected contractor
          let filteredEmployeeIndices = [];
          if (selectedContractor === 'all') {
            // Include all employees
            filteredEmployeeIndices = data.muster.map((_, index) => index);
            console.log('Including all employees:', filteredEmployeeIndices.length);
          } else {
            // Step 1: Get employees under the selected contractor
            console.log('Selected contractor:', selectedContractor);
            const employeesUnderContractor = await fetchEmployeesByContractor(selectedContractor);
           
            if (employeesUnderContractor.length === 0) {
              console.log(`No employees found under contractor ${selectedContractor}`);
              // Set empty data and return
              setAttendancePieData([
                { name: 'Present', value: 0, color: '#4ECDC4' },
                { name: 'Absent', value: 0, color: '#FF6B6B' },
              ]);
              return;
            }
           
            // Step 2: Find indices of these employees in the muster data
            console.log('Available employee IDs in muster data:', data.employees);
            console.log('Employee IDs from contractor filter:', employeesUnderContractor);
           
            // Check for ID format differences
            console.log('=== EMPLOYEE ID COMPARISON ===');
            console.log('Muster employee IDs (first 10):', data.employees.slice(0, 10));
            console.log('Contractor filter employee IDs (first 10):', employeesUnderContractor.slice(0, 10));
            console.log('Muster ID types:', data.employees.slice(0, 5).map(id => typeof id));
            console.log('Contractor filter ID types:', employeesUnderContractor.slice(0, 5).map(id => typeof id));
           
            data.employees.forEach((employee, empIndex) => {
              // The muster data contains employee IDs directly, not objects
              const employeeId = employee;
              if (employeesUnderContractor.includes(employeeId)) {
                filteredEmployeeIndices.push(empIndex);
                console.log(`✓ Added employee ${employeeId} (index ${empIndex}) to filtered list`);
              } else {
                // Check if there's a string/number mismatch
                const stringMatch = employeesUnderContractor.includes(String(employeeId));
                const numberMatch = employeesUnderContractor.includes(Number(employeeId));
                if (stringMatch || numberMatch) {
                  filteredEmployeeIndices.push(empIndex);
                  console.log(`✓ Added employee ${employeeId} (index ${empIndex}) to filtered list via type conversion`);
                } else {
                  console.log(`✗ Employee ${employeeId} (type: ${typeof employeeId}) not found in contractor list`);
                }
              }
            });
           
            console.log(`Filtered employees for contractor ${selectedContractor}:`, filteredEmployeeIndices.length);
            console.log('Filtered employee indices:', filteredEmployeeIndices);
          }
         
          // Count total present and absent from muster reports
          // Each row in muster represents one employee's attendance for the month
          let statusCounts = { Present: 0, Absent: 0, 'Half Day Present': 0, Other: 0 };
         
          data.muster.forEach((employeeAttendance, empIndex) => {
            // Only process employees that belong to the selected contractor
            if (!filteredEmployeeIndices.includes(empIndex)) {
              return; // Skip this employee
            }
            if (employeeAttendance && employeeAttendance.length > 0) {
              console.log(`Employee ${empIndex + 1} attendance:`, employeeAttendance.slice(0, 10)); // Show first 10 days
             
              // Count each day's status for this employee
              employeeAttendance.forEach((dayStatus, dayIndex) => {
                if (dayStatus === 'Present' || dayStatus === 'P') {
                  presentTotal += 1;
                  statusCounts.Present += 1;
                } else if (dayStatus === 'Absent' || dayStatus === 'A') {
                  absentTotal += 1;
                  statusCounts.Absent += 1;
                } else if (dayStatus === '0.5' || dayStatus === 0.5 || dayStatus === 'Half Day Present') {
                  // Half day present counts as 0.5 present and 0.5 absent
                  presentTotal += 0.5;
                  absentTotal += 0.5;
                  statusCounts['Half Day Present'] += 1;
                } else {
                  statusCounts.Other += 1;
                  console.log(`Unknown status: "${dayStatus}" for employee ${empIndex + 1}, day ${dayIndex + 1}`);
                }
              });
            }
          });
         
          console.log('Status counts breakdown:', statusCounts);
         
          // Calculate totals without half-day splitting
          let rawPresent = statusCounts.Present + statusCounts['Half Day Present'];
          let rawAbsent = statusCounts.Absent;
          let rawHalfDay = statusCounts['Half Day Present'];
         
          console.log('Raw counts (before half-day splitting):', {
            rawPresent,
            rawAbsent,
            rawHalfDay,
            total: rawPresent + rawAbsent + rawHalfDay
          });
         
          console.log('Monthly Attendance Totals from Muster:', { presentTotal, absentTotal });
         
          // Alternative calculation: treat half-day as full present
          let altPresentTotal = statusCounts.Present + statusCounts['Half Day Present'];
          let altAbsentTotal = statusCounts.Absent;
         
          console.log('Alternative calculation (half-day = full present):', {
            altPresentTotal,
            altAbsentTotal
          });
         
          const newPieData = [
            { name: 'Present', value: Math.round(presentTotal), color: '#4ECDC4' },
            { name: 'Absent', value: Math.round(absentTotal), color: '#FF6B6B' },
          ];
         
          console.log('Setting attendance pie data:', newPieData);
          setAttendancePieData(newPieData);
        } else {
          console.log('No attendance data found for the selected month');
          const emptyPieData = [
            { name: 'Present', value: 0, color: '#4ECDC4' },
            { name: 'Absent', value: 0, color: '#FF6B6B' },
          ];
          console.log('Setting empty attendance pie data:', emptyPieData);
          setAttendancePieData(emptyPieData);
        }
      } catch (err) {
        console.error('Failed to fetch monthly attendance:', err);
        setAttendancePieData([
          { name: 'Present', value: 0, color: '#4ECDC4' },
          { name: 'Absent', value: 0, color: '#FF6B6B' },
        ]);
      } finally {
        setIsAttendanceLoading(false);
      }
    };
   
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedContractor]);

  // Fetch last 7 days attendance trend data
  useEffect(() => {
    const fetchAttendanceTrend = async () => {
      try {
        setIsTrendLoading(true);
       
        // Calculate last 7 days
        const today = new Date();
        const last7Days = [];
        const trendData = [];
       
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
         
          last7Days.push({ date: dateStr, day: dayName });
        }
       
        console.log('Fetching attendance trend for last 7 days:', last7Days);
        console.log('Selected contractor for trend chart:', selectedContractorTrend);
       
        // Fetch attendance data for each day
        const attendancePromises = last7Days.map(async ({ date, day }) => {
          try {
            const response = await fetch(`/server/attendance_muster_function?startDate=${date}&endDate=${date}&source=both`);
            const data = await response.json();
           
            let presentCount = 0;
            let totalEmployees = 0;
           
            if (data && data.muster && data.muster.length > 0) {
              // Filter employees by selected contractor
              let filteredEmployeeIndices = [];
             
              if (selectedContractorTrend === 'all') {
                // Include all employees
                filteredEmployeeIndices = data.muster.map((_, index) => index);
                totalEmployees = data.muster.length;
                console.log(`Day ${day}: Including all employees (${totalEmployees})`);
              } else {
                // Get employees under the selected contractor
                const employeesUnderContractor = await fetchEmployeesByContractor(selectedContractorTrend);
               
                if (employeesUnderContractor.length === 0) {
                  console.log(`Day ${day}: No employees found under contractor ${selectedContractorTrend}`);
                  return { day, present: 0 };
                }
               
                // Find indices of these employees in the muster data
                data.employees.forEach((employee, empIndex) => {
                  // The muster data contains employee IDs directly, not objects
                  const employeeId = employee;
                  if (employeesUnderContractor.includes(employeeId)) {
                    filteredEmployeeIndices.push(empIndex);
                    console.log(`✓ Added employee ${employeeId} (index ${empIndex}) to trend filtered list`);
                  } else {
                    // Check if there's a string/number mismatch
                    const stringMatch = employeesUnderContractor.includes(String(employeeId));
                    const numberMatch = employeesUnderContractor.includes(Number(employeeId));
                    if (stringMatch || numberMatch) {
                      filteredEmployeeIndices.push(empIndex);
                      console.log(`✓ Added employee ${employeeId} (index ${empIndex}) to trend filtered list via type conversion`);
                    } else {
                      console.log(`✗ Employee ${employeeId} (type: ${typeof employeeId}) not found in contractor list for trend`);
                    }
                  }
                });
               
                totalEmployees = filteredEmployeeIndices.length;
                console.log(`Day ${day}: Filtered employees for contractor ${selectedContractorTrend}: ${totalEmployees}`);
              }
             
              // Count attendance only for filtered employees
              data.muster.forEach((employeeAttendance, empIndex) => {
                // Only process employees that belong to the selected contractor
                if (!filteredEmployeeIndices.includes(empIndex)) {
                  return; // Skip this employee
                }
               
                if (employeeAttendance && employeeAttendance.length > 0) {
                  const dayStatus = employeeAttendance[0]; // First (and only) day in the range
                  if (dayStatus === 'Present' || dayStatus === 'P') {
                    presentCount += 1; // Full day present
                  } else if (dayStatus === 'Half Day Present' || dayStatus === '0.5' || dayStatus === 0.5) {
                    presentCount += 0.5; // Half day present - add to present count
                  }
                }
              });
            }
           
            // Calculate percentage (present count / total employees * 100)
            const attendancePercentage = totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0;
           
            console.log(`Day ${day}: Present: ${presentCount}, Total: ${totalEmployees}, Percentage: ${attendancePercentage.toFixed(2)}%`);
           
            return { day, present: Math.round(attendancePercentage * 100) / 100 }; // Round to 2 decimal places
          } catch (err) {
            console.error(`Failed to fetch attendance for ${date}:`, err);
            return { day, present: 0 };
          }
        });
       
        const results = await Promise.all(attendancePromises);
        console.log('Attendance trend results:', results);
       
        setAttendanceTrendData(results);
      } catch (err) {
        console.error('Failed to fetch attendance trend:', err);
        setAttendanceTrendData([]);
      } finally {
        setIsTrendLoading(false);
      }
    };
   
    fetchAttendanceTrend();
  }, [selectedContractorTrend]); // Add selectedContractorTrend as dependency

  // Fetch shift distribution data
  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        console.log('Fetching shift distribution data...');
        // Fetch shifts and shift mappings
        const [shiftsResponse, shiftmapsResponse] = await Promise.all([
          fetch('/server/Shift_function/shifts'),
          fetch('/server/Shiftmap_function/shiftmaps')
        ]);

        const shiftsData = await shiftsResponse.json();
        const shiftmapsData = await shiftmapsResponse.json();

        if (shiftsData.status === 'success' && shiftmapsData.status === 'success') {
          const shifts = shiftsData.data.shifts || [];
          const shiftmaps = shiftmapsData.data.shiftmaps || [];
         
          console.log('Shifts Data:', shifts);
          console.log('Shiftmaps Data:', shiftmaps);

          // Initialize shift distribution based on actual shift names from database
          const distribution = {};
         
          // Get unique shift names from the shifts table
          shifts.forEach(shift => {
            if (shift.shiftName && !distribution[shift.shiftName]) {
              distribution[shift.shiftName] = { assigned: 0, attended: 0, percentage: 0 };
            }
          });

          // If no shifts found in shifts table, create some common shifts
          if (Object.keys(distribution).length === 0) {
            console.log('No shifts found in database, creating common shift types...');
            const commonShifts = ['A', 'B', 'C', 'D']; // Use the actual shift names from your module
            commonShifts.forEach(shiftName => {
              distribution[shiftName] = { assigned: 0, attended: 0, percentage: 0 };
            });
          }

          // Process shift mappings
          shiftmaps.forEach(mapping => {
            const assignedShift = mapping.assignedShift;
            const actualShift = mapping.actualShift;

            console.log('Shift Mapping Debug:', {
              assignedShift,
              actualShift
            });

            if (assignedShift) {
              // If this shift name doesn't exist in distribution, add it
              if (!distribution[assignedShift]) {
                distribution[assignedShift] = { assigned: 0, attended: 0, percentage: 0 };
              }
             
              distribution[assignedShift].assigned++;
             
              // Simple attendance logic:
              // 1. If assigned shift = actual shift: count as attended for that shift
              // 2. If assigned shift ≠ actual shift: count based on actual shift name
              if (actualShift && actualShift !== 'no records found' && actualShift !== '' && actualShift !== null) {
                // If actual shift exists, count based on actual shift
                if (!distribution[actualShift]) {
                  distribution[actualShift] = { assigned: 0, attended: 0, percentage: 0 };
                }
                distribution[actualShift].attended++;
              } else {
                // If no actual shift data, count based on assigned shift
                distribution[assignedShift].attended++;
              }
            }
          });

          // Calculate percentages
          Object.keys(distribution).forEach(shiftType => {
            const shift = distribution[shiftType];
            shift.percentage = shift.assigned > 0 ? Math.round((shift.attended / shift.assigned) * 100) : 0;
          });

          console.log('Final shift distribution:', distribution);
          setShiftDistribution(distribution);
        }
      } catch (err) {
        console.error('Failed to fetch shift distribution:', err);
        // Set empty distribution instead of fallback data
        setShiftDistribution({});
      }
    };

    fetchShiftData();
  }, []);

  // Fetch daily shift data for last 7 days - Real-time data only, counting PRESENT employees in General shift
  useEffect(() => {
    const fetchDailyShiftData = async () => {
      try {
        console.log('🔄 Fetching real-time daily shift data for last 7 days...');
       
        // Calculate last 7 days
        const today = new Date();
        const last7Days = [];
       
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
         
          last7Days.push({ date: dateStr, day: dayName });
        }
       
        console.log('📅 Last 7 days:', last7Days);
       
        // Preload employees for name mapping
        const empIdToName = {};
        const empIdToCode = {};
        try {
          const empRes = await fetch(`/server/cms_function/employees?returnAll=true&userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}`);
          const empJson = await empRes.json();
          if (empJson?.status === 'success' && empJson?.data?.employees) {
            for (const e of empJson.data.employees) {
              const code = e.employeeCode || e.EmployeeCode || e.EmployeeID || e.id;
              const name = e.employeeName || e.EmployeeName || e.name || '';
              const internalId = String(e.id || e.EmployeeID || e.EmployeeId || e.employeeId || e.EmployeeCode || code || '');
              if (code) empIdToName[String(code)] = name || String(code);
              if (internalId && code) empIdToCode[internalId] = String(code);
              if (code) empIdToCode[String(code)] = String(code); // self-map when we already have code
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to preload employees for name mapping:', e);
        }

        // Fetch shift and attendance data for each day using real-time data
        const dailyData = [];
       
        for (const { date, day } of last7Days) {
          try {
            console.log(`🔄 Fetching shift data for ${date} (${day})...`);
           
            // Fetch shift mappings for this specific date
            const shiftmapsResponse = await fetch(`/server/Shiftmap_function/shiftmaps?date=${date}`);
            const shiftmapsData = await shiftmapsResponse.json();

            console.log(`📊 Shift data for ${date}:`, shiftmapsData);

            if (shiftmapsData.status === 'success' && shiftmapsData.data && shiftmapsData.data.shiftmaps) {
              const shiftmaps = shiftmapsData.data.shiftmaps || [];
              console.log(`📋 Found ${shiftmaps.length} shift mappings for ${date}`);

              // Build a set of employees assigned to General shift for that date
              const isGeneralName = (n) => {
                const s = String(n || '').toLowerCase();
                return s === 'general' || s === 'general shift' || s.indexOf('general') !== -1;
              };

              const generalAssigned = new Set();
              shiftmaps.forEach(mapping => {
                const shiftName = mapping.shiftName || mapping.assignedShift || 'Unknown';
                const rawId = String(mapping.employeeId || mapping.EmployeeID || mapping.EmployeeId || mapping.empId || '');
                const normalizedCode = empIdToCode[rawId] || rawId; // prefer employeeCode
                if (normalizedCode && isGeneralName(shiftName)) {
                  generalAssigned.add(normalizedCode);
                }
              });

              // Fetch attendance for the day and mark present employees
              const presentIds = new Set();
              try {
                const attRes = await fetch(`/server/GetAttendanceList?startDate=${date}&endDate=${date}&summary=true`);
                const attJson = await attRes.json();
                if (attJson?.data?.length) {
                  for (const rec of attJson.data) {
                    const rawEid = String(rec.EmployeeID || rec.EmployeeId || rec.employeeId || rec.EmployeeCode || '');
                    const eid = empIdToCode[rawEid] || rawEid; // normalize to employeeCode when possible
                    const firstIn = rec.FirstIN || rec.FirstIn || rec.firstIn || '';
                    if (eid && firstIn && String(firstIn).trim() !== '') {
                      presentIds.add(eid);
                    }
                  }
                }
              } catch (e) {
                console.warn(`⚠️ Failed to fetch attendance for ${date}:`, e);
              }

              // Intersect: present AND assigned to General
              let presentGeneralIds = Array.from(presentIds).filter(eid => generalAssigned.has(eid));

              // Fallback: if no shiftmap or no matches, use overall present count from BHR for the day
              if (presentGeneralIds.length === 0) {
                presentGeneralIds = Array.from(presentIds);
              }

              // Prepare distributions and names for chart and tooltips
              const dailyDistribution = { General: presentGeneralIds.length };
              const presentByShift = { General: presentGeneralIds.map(eid => empIdToName[eid] || eid) };

              console.log(`📈 Present General on ${date}:`, dailyDistribution.General, presentByShift.General);

              dailyData.push({
                date: day,
                shifts: dailyDistribution,
                presentEmployees: presentByShift
              });
            } else {
              console.log(`⚠️ No shift data available for ${date}`);
              dailyData.push({
                date: day,
                shifts: {}
              });
            }
          } catch (err) {
            console.error(`❌ Failed to fetch shift data for ${date}:`, err);
            dailyData.push({
              date: day,
              shifts: {}
            });
          }
        }
       
        console.log('📊 Final daily shift data (real-time only):', dailyData);
          setDailyShiftData(dailyData);
       
      } catch (err) {
        console.error('❌ Failed to fetch daily shift data:', err);
        setDailyShiftData([]);
      }
    };
   
    fetchDailyShiftData();
  }, []);

  // Refetch shift data when contractor selection changes for General Shift chart
  useEffect(() => {
    if (selectedContractorShift !== 'all') {
      console.log('Contractor selection changed for General Shift chart:', selectedContractorShift);
      // The shift data will be filtered in the chart creation logic
      // This useEffect just triggers a re-render when contractor changes
    }
  }, [selectedContractorShift]);

  // Auto-refresh shift data every 5 minutes to ensure real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing shift data for real-time updates...');
      // Trigger a re-fetch by updating a dependency or calling the fetch function
      // This will be handled by the main fetchDailyShiftData useEffect
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Test function to verify month calculation
  const testMonthCalculation = () => {
    const today = new Date();
    console.log(`🧪 Testing month calculation for current date: ${today.toDateString()}`);
   
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthKey = date.toISOString().slice(0, 7);
     
      months.push({
        month: monthName,
        monthKey: monthKey,
        year: date.getFullYear(),
        monthNum: date.getMonth() + 1
      });
     
      console.log(`🧪 Month ${i}: ${monthName} ${date.getFullYear()} (${monthKey})`);
    }
   
    return months;
  };

  // Fetch CL Addition Trend data based on employee joining dates - Real-time data
  // Helper function to parse employee joining dates consistently
  const parseEmployeeJoiningDate = (dateOfJoining) => {
    if (!dateOfJoining) return null;
   
    let joiningDate;
    if (typeof dateOfJoining === 'string') {
      joiningDate = new Date(dateOfJoining);
     
      // If the date is invalid, try parsing as timestamp
      if (isNaN(joiningDate.getTime())) {
        const timestamp = parseInt(dateOfJoining);
        if (!isNaN(timestamp)) {
          joiningDate = new Date(timestamp);
        }
      }
    } else if (dateOfJoining instanceof Date) {
      joiningDate = dateOfJoining;
    } else {
      return null;
    }
   
    // Check if the date is valid
    if (isNaN(joiningDate.getTime())) {
      return null;
    }
   
    return joiningDate;
  };

  // Helper function to get employees for a specific month with consistent filtering
  const getEmployeesForMonth = (employees, targetMonth, targetYear, contractorFilter = 'all') => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(targetMonth);
    const monthNum = monthIndex + 1;
   
    return employees.filter(emp => {
      if (!emp.dateOfJoining) return false;
     
      const joinDate = parseEmployeeJoiningDate(emp.dateOfJoining);
      if (!joinDate) return false;
     
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth() + 1;
     
      // Check if employee joined in the target month and year
      const isTargetMonth = joinYear === targetYear && joinMonth === monthNum;
     
      // Apply contractor filter if not 'all'
      const contractorMatch = contractorFilter === 'all' ||
        (emp.contractor && emp.contractor.toLowerCase().includes(contractorFilter.toLowerCase()));
     
      return isTargetMonth && contractorMatch;
    });
  };

  const fetchClAdditionTrend = async (contractorFilter = 'all') => {
    try {
      setIsClAdditionLoading(true);
      console.log('🔄 Fetching REAL-TIME CL Addition Trend data for contractor:', contractorFilter);
     
      // Test month calculation first
      testMonthCalculation();
     
      // Get current date and calculate last 6 months dynamically
      const today = new Date();
      const months = [];
     
      console.log(`📅 Current date: ${today.toDateString()}`);
      console.log(`📅 Current month: ${today.getMonth() + 1}, Year: ${today.getFullYear()}`);
     
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
       
        months.push({
          month: monthName,
          monthKey: monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1
        });
       
        console.log(`📅 Month ${i}: ${monthName} ${date.getFullYear()} (${monthKey})`);
      }
     
      console.log('📊 Fetching LIVE employee data for CL Addition Trend...');
      // Add timestamp to prevent caching and ensure real-time data
      const timestamp = new Date().getTime();
      const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
     
      console.log('✅ CL Addition API response (REAL-TIME):', data);
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
        console.log(`📈 Total employees found for addition trend: ${employees.length} (LIVE DATA)`);
       
        // Debug: Show sample employee data structure
        if (employees.length > 0) {
          console.log('📋 Sample employee data structure:', {
            dateOfJoining: employees[0].dateOfJoining,
            contractor: employees[0].contractor,
            employeeName: employees[0].employeeName,
            employeeCode: employees[0].employeeCode
          });
         
          // Show employees with joining dates
          const employeesWithJoiningDates = employees.filter(emp => emp.dateOfJoining);
          console.log(`📅 Employees with joining dates: ${employeesWithJoiningDates.length}/${employees.length}`);
         
          if (employeesWithJoiningDates.length > 0) {
            console.log('📅 Sample joining dates:', employeesWithJoiningDates.slice(0, 5).map(emp => ({
              employeeName: emp.employeeName,
              dateOfJoining: emp.dateOfJoining,
              contractor: emp.contractor
            })));
          }
        }
       
        // Filter employees by contractor if not 'all'
        let filteredEmployees = employees;
        if (contractorFilter !== 'all') {
          filteredEmployees = employees.filter(employee =>
            employee.contractor && employee.contractor.toLowerCase().includes(contractorFilter.toLowerCase())
          );
          console.log(`🎯 Filtered employees for contractor ${contractorFilter}: ${filteredEmployees.length}`);
        }
       
        // Initialize monthly counts with contractor breakdown
        const monthlyCounts = {};
        const contractorBreakdown = {};
       
        months.forEach(({ month, monthKey }) => {
          monthlyCounts[month] = {
            count: 0,
            monthKey,
            contractors: {}
          };
        });
       
        // Count employees who joined in each month using unified function (REAL-TIME DATA)
        let totalProcessed = 0;
        let totalMatched = 0;
        let invalidDates = 0;
       
        // Use the current year for all calculations
        const currentYear = new Date().getFullYear();
       
        months.forEach(({ month, monthKey }) => {
          // Get employees for this specific month using unified function
          const monthEmployees = getEmployeesForMonth(filteredEmployees, month, currentYear, contractorFilter);
         
          console.log(`📊 ${month} ${currentYear}: Found ${monthEmployees.length} employees using unified function`);
         
          // Update monthly count
          monthlyCounts[month].count = monthEmployees.length;
         
          // Update contractor breakdown for this month
          const monthContractorBreakdown = {};
          monthEmployees.forEach(emp => {
            const contractorName = emp.contractor || 'No Contractor';
            monthContractorBreakdown[contractorName] = (monthContractorBreakdown[contractorName] || 0) + 1;
           
            // Update overall contractor breakdown
            if (!contractorBreakdown[contractorName]) {
              contractorBreakdown[contractorName] = 0;
            }
            contractorBreakdown[contractorName]++;
           
            totalMatched++;
            console.log(`👤 Employee joined in ${month}: ${emp.employeeName || emp.employeeCode} (${contractorName}) - ${emp.dateOfJoining} - LIVE DATA`);
          });
         
          monthlyCounts[month].contractors = monthContractorBreakdown;
        });
       
        console.log(`📊 Processing summary: ${totalProcessed} employees with joining dates, ${totalMatched} matched to last 6 months, ${invalidDates} invalid dates`);
       
        // Convert to chart data format with contractor breakdown
        const trendData = months.map(({ month }) => ({
          month: month,
          value: monthlyCounts[month].count,
          target: 15, // Set a target of 15 employees per month
          lastUpdated: new Date().toISOString(),
          isRealTime: true,
          contractorBreakdown: monthlyCounts[month].contractors
        }));
       
        console.log('🚀 CL Addition Trend data (REAL-TIME):', trendData);
        console.log('📊 Monthly counts breakdown:', monthlyCounts);
        console.log('📊 Contractor Breakdown (REAL-TIME):', contractorBreakdown);
       
        // Debug specific month data
        const mayData = monthlyCounts['May'];
        if (mayData) {
          console.log('🔍 May data breakdown:', {
            count: mayData.count,
            contractors: mayData.contractors
          });
        }
        setClAdditionTrendData(trendData);
        setContractorBreakdownData(contractorBreakdown);
      } else {
        console.log('⚠️ No employee data found for addition trend, using sample data');
        // Fallback to sample data if no real data
        const sampleData = months.map(({ month }) => ({
          month: month,
          value: Math.floor(Math.random() * 20) + 5,
          target: 15,
          lastUpdated: new Date().toISOString(),
          isRealTime: false,
          note: 'Sample data - no real employee data available'
        }));
        setClAdditionTrendData(sampleData);
      }
    } catch (err) {
      console.error('❌ Failed to fetch CL Addition Trend data:', err);
      // Fallback to sample data on error
      const sampleData = [
        { month: 'Jan', value: 12, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
        { month: 'Feb', value: 18, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
        { month: 'Mar', value: 8, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
        { month: 'Apr', value: 22, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
        { month: 'May', value: 16, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
        { month: 'Jun', value: 25, target: 15, lastUpdated: new Date().toISOString(), isRealTime: false, note: 'Sample data - API error' },
      ];
      setClAdditionTrendData(sampleData);
    } finally {
      setIsClAdditionLoading(false);
    }
  };


  // Handle contractor selection change for CL Addition Trend
  const handleClAdditionContractorChange = (contractor) => {
    setSelectedContractorForCLAddition(contractor);
    fetchClAdditionTrend(contractor);
    // Recreate the chart after data is updated
    setTimeout(() => {
      createCLCharts();
    }, 1000);
  };

  // Fetch detailed employee data for a specific month
  const fetchMonthEmployeeDetails = async (month, contractorFilter = 'all') => {
    try {
      console.log(`🔍 Fetching employee details for ${month}, contractor: ${contractorFilter}`);
     
      // Show loading state
      setIsLoadingMonthDetails(true);
      setMonthEmployeeDetails([]);
      setSelectedChartMonth(month);
      setShowMonthDetails(true);
     
      // Get current date and calculate the specific month
      const today = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);
     
      if (monthIndex === -1) {
        console.error('Invalid month:', month);
        return;
      }
     
      // Calculate the year and month for the API call
      const targetDate = new Date(today.getFullYear(), monthIndex, 1);
      const year = targetDate.getFullYear();
      const monthNum = monthIndex + 1;
     
      console.log(`📅 Target date: ${year}-${monthNum.toString().padStart(2, '0')}`);
     
      // Fetch all employees
      const timestamp = new Date().getTime();
      const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
        console.log(`📊 Total employees found: ${employees.length}`);
       
        // Use unified function to get employees for the specific month
        const monthEmployees = getEmployeesForMonth(employees, month, year, contractorFilter);
       
        console.log(`✅ Found ${monthEmployees.length} employees who joined in ${month} ${year}`);
        console.log(`🔍 Month employees details:`, monthEmployees.map(emp => ({
          name: emp.employeeName,
          contractor: emp.contractor,
          dateOfJoining: emp.dateOfJoining,
          parsedDate: new Date(emp.dateOfJoining).toISOString().slice(0, 7)
        })));
       
        // Process employee data for modal display
        const processedEmployees = monthEmployees.map(emp => ({
          name: emp.employeeName || 'Unknown Employee',
          employeeId: emp.employeeCode || 'N/A',
          contractor: emp.contractor || 'Unknown Contractor',
          department: emp.department || 'N/A',
          designation: emp.designation || 'N/A',
          joiningDate: emp.dateOfJoining,
          phone: emp.phone || 'N/A',
          email: emp.personalEmail || 'N/A',
          location: emp.location || 'N/A'
        }));
       
        // Group by contractor for detailed breakdown
        const contractorBreakdown = {};
        processedEmployees.forEach(emp => {
          const contractor = emp.contractor || 'Unknown Contractor';
          if (!contractorBreakdown[contractor]) {
            contractorBreakdown[contractor] = [];
          }
          contractorBreakdown[contractor].push(emp);
        });
       
        setMonthEmployeeDetails(processedEmployees);
        setSelectedChartMonth(month);
        setShowMonthDetails(true);
        setIsLoadingMonthDetails(false);
       
        console.log('📋 Month employee details:', monthEmployees);
        console.log('🏢 Contractor breakdown:', contractorBreakdown);
       
        return { employees: monthEmployees, contractorBreakdown };
      } else {
        console.log('⚠️ No employee data found');
        setMonthEmployeeDetails([]);
        setIsLoadingMonthDetails(false);
        return { employees: [], contractorBreakdown: {} };
      }
    } catch (err) {
      console.error('❌ Failed to fetch month employee details:', err);
      setMonthEmployeeDetails([]);
      setIsLoadingMonthDetails(false);
      return { employees: [], contractorBreakdown: {} };
    }
  };


  useEffect(() => {
    fetchClAdditionTrend();
   
    // Set up automatic refresh every 30 seconds for real-time data
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing CL Addition Trend data...');
      fetchClAdditionTrend(selectedContractorForCLAddition);
    }, 30000); // 30 seconds
   
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [selectedContractorForCLAddition]);

  // Fetch CL Attrition Trend data based on employee exit dates - Real-time data only
  const fetchClAttritionTrend = async (contractorFilter = 'all') => {
    try {
      setIsClAttritionLoading(true);
      console.log('🔄 Fetching real-time CL Attrition Trend data for contractor:', contractorFilter);
     
      // Get current date and calculate last 6 months
      const today = new Date();
      const months = [];
     
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
       
        months.push({
          month: monthName,
          monthKey: monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1
        });
      }
     
      console.log('📅 Last 6 months for attrition analysis:', months);
     
      console.log('🔄 Fetching real-time employee data for CL Attrition Trend...');
      const response = await fetch('/server/cms_function/employees?returnAll=true');
      const data = await response.json();
     
      console.log('📊 CL Attrition API response:', data);
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
        console.log('📋 Total employees found for attrition analysis:', employees.length);
       
        // Filter employees by contractor if not 'all'
        let filteredEmployees = employees;
        if (contractorFilter !== 'all') {
          filteredEmployees = employees.filter(employee =>
            employee.ContractorName && employee.ContractorName.toLowerCase() === contractorFilter.toLowerCase()
          );
          console.log(`📊 Filtered employees for contractor ${contractorFilter}:`, filteredEmployees.length);
        }
       
        // First, collect all unique months with exit dates
        const allExitMonths = new Set();
        filteredEmployees.forEach(employee => {
          if (employee.dateOfExit) {
            const exitDate = new Date(employee.dateOfExit);
            const exitMonthKey = exitDate.toISOString().slice(0, 7); // YYYY-MM format
            allExitMonths.add(exitMonthKey);
          }
        });
       
        // Add months with exit dates to our months array if not already present
        allExitMonths.forEach(monthKey => {
          const existingMonth = months.find(m => m.monthKey === monthKey);
          if (!existingMonth) {
            const date = new Date(monthKey + '-01');
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            months.push({
              month: monthName,
              monthKey: monthKey,
              year: date.getFullYear(),
              monthNum: date.getMonth() + 1
            });
          }
        });
       
        // Sort months by date
        months.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
       
        // Reinitialize monthly counts with all months using monthKey as unique identifier
        const monthlyCounts = {};
        months.forEach(({ month, monthKey }) => {
          monthlyCounts[monthKey] = { count: 0, month: month, monthKey: monthKey };
        });
       
        // Count employees who left in each month based on real exit dates
        let totalExits = 0;
        filteredEmployees.forEach(employee => {
          if (employee.dateOfExit) {
            const exitDate = new Date(employee.dateOfExit);
            const exitMonthKey = exitDate.toISOString().slice(0, 7); // YYYY-MM format
           
            // Find the corresponding month in our months array
            const monthData = months.find(m => m.monthKey === exitMonthKey);
            if (monthData) {
              monthlyCounts[monthData.monthKey].count++;
              totalExits++;
              console.log(`✅ Employee ${employee.employeeCode || employee.id} left in ${monthData.month} (${employee.dateOfExit})`);
            }
          }
        });
       
        console.log(`📊 Total employees with exit dates: ${totalExits}`);
       
        // Convert to chart data format with real-time data only
        const trendData = months.map(({ month, monthKey, year }) => {
          // Check if there are multiple months with the same name (different years)
          const sameMonthCount = months.filter(m => m.month === month).length;
          const displayMonth = sameMonthCount > 1 ? `${month} ${year}` : month;
         
          return {
            month: displayMonth,
            value: monthlyCounts[monthKey].count,
            benchmark: 8, // Set a benchmark of 8 employees per month
            isRealTime: true // Mark as real-time data
          };
        });
       
        console.log('📊 Real-time CL Attrition Trend data:', trendData);
        setClAttritionTrendData(trendData);
      } else {
        console.log('⚠️ No employee data found for attrition analysis');
        // No fallback data - show empty data
        const emptyData = months.map(({ month }) => ({
          month: month,
          value: 0,
          benchmark: 8,
          isRealTime: true // Mark as real-time data (showing 0 is real-time)
        }));
        setClAttritionTrendData(emptyData);
      }
    } catch (err) {
      console.error('❌ Failed to fetch CL Attrition Trend data:', err);
      // No fallback data - show empty data
      // Create fallback months array for error case
      const today = new Date();
      const fallbackMonths = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        fallbackMonths.push({ month: monthName });
      }
     
      const emptyData = fallbackMonths.map(({ month }) => ({
        month: month,
        value: 0,
        benchmark: 8,
        isRealTime: true // Mark as real-time data (error case still shows real-time 0)
      }));
      setClAttritionTrendData(emptyData);
    } finally {
      setIsClAttritionLoading(false);
    }
  };

  // Handle contractor selection change for CL Attrition Trend
  const handleClAttritionContractorChange = (contractor) => {
    setSelectedContractorForCLAttrition(contractor);
    fetchClAttritionTrend(contractor);
    // Recreate the chart after data is updated
    setTimeout(() => {
      createCLCharts();
    }, 1000);
  };

  useEffect(() => {
    fetchClAttritionTrend();
  }, []);

  // Function to create CL charts
  const createCLCharts = () => {
    console.log('Creating CL charts...');
   
    // CL Addition Chart
    if (window.Chart && clAdditionChartRef.current) {
      console.log('Creating CL Addition chart with data:', clAdditionTrendData);
     
      // Destroy existing chart if it exists
      const existingChart = window.Chart.getChart(clAdditionChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
     
      const chart = new window.Chart(clAdditionChartRef.current, {
        type: 'line',
        data: {
          labels: clAdditionTrendData.length > 0 ? clAdditionTrendData.map(d => d.month) : clTrendData.addition.map(d => d.month),
          datasets: [
            {
              label: 'Employees Joined',
              data: clAdditionTrendData.length > 0 ? clAdditionTrendData.map(d => d.value) : clTrendData.addition.map(d => d.value),
              borderColor: '#4ECDC4',
              backgroundColor: 'rgba(78, 205, 196, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: '#4ECDC4',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
            },
            {
              label: 'Monthly Target',
              data: clAdditionTrendData.length > 0 ? clAdditionTrendData.map(d => d.target) : clTrendData.addition.map(d => d.target),
              borderColor: '#FF6B6B',
              borderDash: [5, 5],
              pointRadius: 4,
              fill: false,
              pointBackgroundColor: '#FF6B6B',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
          },
          onClick: (event, activeElements) => {
            if (activeElements.length > 0) {
              const elementIndex = activeElements[0].index;
              const month = clAdditionTrendData[elementIndex]?.month || clTrendData.addition[elementIndex]?.month;
              if (month) {
                console.log(`🎯 Chart point clicked: ${month} (index: ${elementIndex})`);
                console.log(`📊 Current data:`, clAdditionTrendData[elementIndex]);
                console.log(`🔍 Fetching employee details for ${month} with contractor filter: ${selectedContractorForCLAddition}`);
                fetchMonthEmployeeDetails(month, selectedContractorForCLAddition);
              } else {
                console.log('⚠️ No month found for clicked point');
              }
            } else {
              console.log('⚠️ No active elements found on click');
            }
          },
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: `CL Addition Trend vs Target (Last 6 Months) - ${clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? 'LIVE DATA' : 'SAMPLE DATA'}${selectedContractorForCLAddition !== 'all' ? ` - ${selectedContractorForCLAddition}` : ''}`,
              font: { size: 16, weight: 'bold' }
            },
            subtitle: {
              display: true,
              text: `Last updated: ${new Date().toLocaleTimeString()} | Click on chart points for details${clAdditionTrendData.length > 0 && !clAdditionTrendData[0].isRealTime ? ' | Using sample data' : ''}`,
              font: { size: 12, style: 'italic' },
              color: clAdditionTrendData.length > 0 && !clAdditionTrendData[0].isRealTime ? '#FF6B6B' : '#666'
            },
            tooltip: {
              callbacks: {
                title: function(context) {
                  const month = context[0].label;
                  const data = clAdditionTrendData.find(d => d.month === month);
                  return `${month} - Employee Joining Details (Click for full details)`;
                },
                label: function(context) {
                  const month = context.label;
                  const data = clAdditionTrendData.find(d => d.month === month);
                 
                  if (context.datasetIndex === 0) { // Employees Joined
                    let tooltipText = `Total Employees Joined: ${context.parsed.y}`;
                   
                    if (data && data.contractorBreakdown) {
                      tooltipText += '\n\nContractor-wise breakdown:';
                      Object.entries(data.contractorBreakdown).forEach(([contractor, count]) => {
                        tooltipText += `\n• ${contractor}: ${count}`;
                      });
                    }
                   
                    tooltipText += '\n\n💡 Click for detailed employee list';
                    return tooltipText;
                  } else { // Monthly Target
                    return `Monthly Target: ${context.parsed.y}`;
                  }
                }
              }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
     
      // Store chart reference for cleanup
      clAdditionChartRef.current.chart = chart;
      console.log('CL Addition chart created successfully');
    }

    // CL Attrition Chart
    if (window.Chart && clAttritionChartRef.current) {
      console.log('Creating CL Attrition chart with data:', clAttritionTrendData);
     
      // Destroy existing chart if it exists
      const existingChart = window.Chart.getChart(clAttritionChartRef.current);
      if (existingChart) {
        existingChart.destroy();
      }
     
      const chart = new window.Chart(clAttritionChartRef.current, {
        type: 'line',
        data: {
          labels: clAttritionTrendData.map(d => d.month),
          datasets: [
            {
              label: 'Employees Left (Real-time)',
              data: clAttritionTrendData.map(d => d.value),
              borderColor: '#FF6B6B',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Monthly Benchmark',
              data: clAttritionTrendData.map(d => d.benchmark),
              borderColor: '#45B7D1',
              borderDash: [5, 5],
              pointRadius: 4,
              fill: false,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: `Employee Exit Trend vs Benchmark - Real-time Data${selectedContractorForCLAttrition !== 'all' ? ` - ${selectedContractorForCLAttrition}` : ''}`,
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
     
      // Store chart reference for cleanup
      clAttritionChartRef.current.chart = chart;
      console.log('CL Attrition chart created successfully');
    }
  };


  // Debug effect to monitor CL data changes
  useEffect(() => {
    console.log('CL Addition data changed:', clAdditionTrendData);
    console.log('CL Attrition data changed:', clAttritionTrendData);
   
    // Force chart recreation when data changes
    if (clAdditionTrendData.length > 0 || clAttritionTrendData.length > 0) {
      console.log('CL data available, triggering chart recreation...');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        createCLCharts();
      }, 200);
    }
  }, [clAdditionTrendData, clAttritionTrendData]);

  // Fetch Contractor Performance Data for Scoring Table
  const fetchContractorScoringData = async () => {
    try {
      setIsScoringLoading(true);
      console.log('Fetching Contractor Performance Data for Scoring Table...');
     
      // Get current date and calculate last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
     
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
     
      console.log('Date range for data fetch:', { startDate, endDate });
     
      // Fetch data from multiple APIs
      const [contractorsResponse, employeesResponse, ehsViolationsResponse, criticalIncidentsResponse] = await Promise.all([
        fetch('/server/Contracters_function/contractors'),
        fetch(`/server/cms_function/employees?returnAll=true&userRole=${encodeURIComponent(userRole || '')}&userEmail=${encodeURIComponent(userEmail || '')}`),
        fetch(`/server/EHSViolation_function/violations?startDate=${startDate}&endDate=${endDate}&returnAll=true`),
        fetch(`/server/CriticalIncident_function/incidents?startDate=${startDate}&endDate=${endDate}&returnAll=true`)
      ]);

      console.log('API Responses received:', {
        contractorsStatus: contractorsResponse.status,
        employeesStatus: employeesResponse.status,
        ehsStatus: ehsViolationsResponse.status,
        criticalStatus: criticalIncidentsResponse.status
      });

      const contractorsData = await contractorsResponse.json();
      const employeesData = await employeesResponse.json();
      const ehsViolationsData = await ehsViolationsResponse.json();
      const criticalIncidentsData = await criticalIncidentsResponse.json();

      console.log('Contractors Data:', contractorsData);
      console.log('Employees Data:', employeesData);
      console.log('EHS Violations Data:', ehsViolationsData);
      console.log('Critical Incidents Data:', criticalIncidentsData);

      // Debug: Check if we're getting the expected data structure
      if (contractorsData.data?.contractors) {
        console.log('Contractors found:', contractorsData.data.contractors.length);
        console.log('First contractor:', contractorsData.data.contractors[0]);
      } else {
        console.log('No contractors data structure found');
        console.log('Full contractors response:', contractorsData);
      }

      if (employeesData.data?.employees) {
        console.log('Employees found:', employeesData.data.employees.length);
        console.log('First employee:', employeesData.data.employees[0]);
      } else {
        console.log('No employees data structure found');
        console.log('Full employees response:', employeesData);
      }

      if (ehsViolationsData.data?.violations) {
        console.log('EHS violations found:', ehsViolationsData.data.violations.length);
        if (ehsViolationsData.data.violations.length > 0) {
          console.log('First EHS violation:', ehsViolationsData.data.violations[0]);
        }
      } else {
        console.log('No EHS violations data structure found');
        console.log('Full EHS violations response:', ehsViolationsData);
      }

      if (criticalIncidentsData.data?.incidents) {
        console.log('Critical incidents found:', criticalIncidentsData.data.incidents.length);
        if (criticalIncidentsData.data.incidents.length > 0) {
          console.log('First critical incident:', criticalIncidentsData.data.incidents[0]);
        }
      } else {
        console.log('No critical incidents data structure found');
        console.log('Full critical incidents response:', criticalIncidentsData);
      }

      if (contractorsData.status === 'success' && contractorsData.data && contractorsData.data.contractors) {
        const contractors = contractorsData.data.contractors;
        const employees = employeesData.data?.employees || [];
        const ehsViolations = ehsViolationsData.data?.violations || [];
        const criticalIncidents = criticalIncidentsData.data?.incidents || [];
       
        // Debug: Log sample contractor structure
        if (contractors.length > 0) {
          console.log('Sample contractor structure:', contractors[0]);
          console.log('Available contractor fields:', Object.keys(contractors[0]));
        }
       
        console.log('Processing contractors:', contractors.length);
        console.log('Total employees:', employees.length);
        console.log('Total EHS violations:', ehsViolations.length);
        console.log('Total critical incidents:', criticalIncidents.length);
       
        // Debug: Log all contractor names from contractors API
        console.log('Contractor names from contractors API:', contractors.map(c => c.ContractorName));
       
        // Debug: Log all unique contractor names from employees data
        const uniqueEmployeeContractors = [...new Set(employees.map(emp =>
          emp.ContractorName || emp.contractorName || emp.contractor || emp.Contractor || emp.contractor_name
        ).filter(Boolean))];
        console.log('Unique contractor names from employees data:', uniqueEmployeeContractors);
       
        const scoringData = [];

        contractors.forEach(contractor => {
          if (contractor.ContractorName) {
            // Debug: Log the first few employees to see their structure
            if (employees.length > 0) {
              console.log('Sample employee structure:', employees[0]);
              console.log('Available employee fields:', Object.keys(employees[0]));
            }
           
            // Get all employees under this contractor - try multiple possible field names
            const contractorEmployees = employees.filter(emp => {
              const empContractor = emp.ContractorName || emp.contractorName || emp.contractor || emp.Contractor || emp.contractor_name;
             
              // More flexible matching to handle variations in contractor names
              const matches = empContractor === contractor.ContractorName ||
                            (empContractor && contractor.ContractorName &&
                             (empContractor.toLowerCase().includes(contractor.ContractorName.toLowerCase()) ||
                              contractor.ContractorName.toLowerCase().includes(empContractor.toLowerCase())));
             
              if (matches) {
                console.log(`Employee ${emp.EmployeeCode || emp.employeeCode || emp.id} belongs to contractor ${contractor.ContractorName} (matched with ${empContractor})`);
              }
              return matches;
            });
           
            console.log(`Contractor ${contractor.ContractorName} has ${contractorEmployees.length} employees:`,
              contractorEmployees.map(emp => emp.EmployeeCode || emp.employeeCode || emp.id));

            // Count EHS violations for employees under this contractor
            let ehsCount = 0;
            if (ehsViolations.length > 0) {
              // Debug: Log sample violation structure
              if (ehsViolations.length > 0) {
                console.log('Sample EHS violation structure:', ehsViolations[0]);
                console.log('Available EHS violation fields:', Object.keys(ehsViolations[0]));
              }
             
              ehsCount = ehsViolations.filter(violation => {
                // Check if the violation is for an employee under this contractor
                return contractorEmployees.some(emp => {
                  const empCode = emp.EmployeeCode || emp.employeeCode || emp.id;
                  const violationEmpId = violation.ContractEmployeeID || violation.contractEmployeeID || violation.contractEmployeeId || violation.employeeId || violation.employee_id || violation.id;
                  const matches = empCode && violationEmpId && empCode.toString() === violationEmpId.toString();
                  if (matches) {
                    console.log(`EHS violation ${violation.id || violation.ID} matches employee ${empCode} under contractor ${contractor.ContractorName}`);
                  }
                  return matches;
                });
              }).length;
            }

            // Count critical incidents for employees under this contractor
            let criticalCount = 0;
            if (criticalIncidents.length > 0) {
              // Debug: Log sample incident structure
              if (criticalIncidents.length > 0) {
                console.log('Sample Critical Incident structure:', criticalIncidents[0]);
                console.log('Available Critical Incident fields:', Object.keys(criticalIncidents[0]));
              }
             
              criticalCount = criticalIncidents.filter(incident => {
                // Check if the incident is for an employee under this contractor
                return contractorEmployees.some(emp => {
                  const empCode = emp.EmployeeCode || emp.employeeCode || emp.id;
                  const incidentEmpId = incident.ContractEmplyee || incident.contractEmployee || incident.contractEmployeeId || incident.employeeId || incident.employee_id || incident.id;
                  const matches = empCode && incidentEmpId && empCode.toString() === incidentEmpId.toString();
                  if (matches) {
                    console.log(`Critical incident ${incident.id || incident.ID} matches employee ${empCode} under contractor ${contractor.ContractorName}`);
                  }
                  return matches;
                });
              }).length;
            }

            console.log(`Contractor ${contractor.ContractorName} - CIR: ${criticalCount}, EHS: ${ehsCount}`);

            // Calculate scores based on scoring matrix
            const cirScoreData = getCIRScore(criticalCount);
            const ehsScoreData = getEHSScore(ehsCount);
           
            // Calculate overall score (average of CIR and EHS scores)
            const overallScore = Math.round((cirScoreData.score + ehsScoreData.score) / 2);

            const contractorData = {
              contractor: contractor.ContractorName,
              employeeCount: contractorEmployees.length,
              cirCount: criticalCount,
              ehsCount: ehsCount,
              cirScore: cirScoreData.score,
              ehsScore: ehsScoreData.score,
              overallScore: overallScore,
              cirRemark: cirScoreData.remark,
              ehsRemark: ehsScoreData.remark
            };
           
            console.log('Contractor scoring data processed:', contractorData);
            scoringData.push(contractorData);
          }
        });

        // Sort by overall score (highest first)
        scoringData.sort((a, b) => b.overallScore - a.overallScore);

        // If no real data or all contractors have 0 employees, create sample data
        if (scoringData.length === 0 || scoringData.every(c => c.employeeCount === 0)) {
          console.log('No real contractor data found or all contractors have 0 employees, creating sample data');
          const sampleData = [
            { contractor: 'ABC Corp', employeeCount: 15, cirCount: 3, ehsCount: 1, cirScore: 60, ehsScore: 100, overallScore: 80, cirRemark: 'Needs improvement, recurring issues', ehsRemark: 'Fully compliant' },
            { contractor: 'XYZ Ltd', employeeCount: 12, cirCount: 1, ehsCount: 0, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
            { contractor: 'DEF Inc', employeeCount: 18, cirCount: 5, ehsCount: 2, cirScore: 40, ehsScore: 80, overallScore: 60, cirRemark: 'Serious concern, high risk', ehsRemark: 'Minor lapses, manageable' },
            { contractor: 'GHI Co', employeeCount: 8, cirCount: 0, ehsCount: 0, cirScore: 100, ehsScore: 100, overallScore: 100, cirRemark: 'Zero tolerance maintained', ehsRemark: 'Fully compliant' },
            { contractor: 'JKL Pvt', employeeCount: 22, cirCount: 2, ehsCount: 1, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
          ];
          setContractorScoringData(sampleData);
        } else {
          console.log('Final Contractor Scoring Data:', scoringData);
          setContractorScoringData(scoringData);
        }
      } else {
        console.log('No contractors found, using sample data');
        const sampleData = [
          { contractor: 'ABC Corp', employeeCount: 15, cirCount: 3, ehsCount: 1, cirScore: 60, ehsScore: 100, overallScore: 80, cirRemark: 'Needs improvement, recurring issues', ehsRemark: 'Fully compliant' },
          { contractor: 'XYZ Ltd', employeeCount: 12, cirCount: 1, ehsCount: 0, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
          { contractor: 'DEF Inc', employeeCount: 18, cirCount: 5, ehsCount: 2, cirScore: 40, ehsScore: 80, overallScore: 60, cirRemark: 'Serious concern, high risk', ehsRemark: 'Minor lapses, manageable' },
          { contractor: 'GHI Co', employeeCount: 8, cirCount: 0, ehsCount: 0, cirScore: 100, ehsScore: 100, overallScore: 100, cirRemark: 'Zero tolerance maintained', ehsRemark: 'Fully compliant' },
          { contractor: 'JKL Pvt', employeeCount: 22, cirCount: 2, ehsCount: 1, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
        ];
        setContractorScoringData(sampleData);
      }
    } catch (err) {
      console.error('Failed to fetch Contractor Performance Data:', err);
      // Fallback to sample data on error
      const sampleData = [
        { contractor: 'ABC Corp', employeeCount: 15, cirCount: 3, ehsCount: 1, cirScore: 60, ehsScore: 100, overallScore: 80, cirRemark: 'Needs improvement, recurring issues', ehsRemark: 'Fully compliant' },
        { contractor: 'XYZ Ltd', employeeCount: 12, cirCount: 1, ehsCount: 0, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
        { contractor: 'DEF Inc', employeeCount: 18, cirCount: 5, ehsCount: 2, cirScore: 40, ehsScore: 80, overallScore: 60, cirRemark: 'Serious concern, high risk', ehsRemark: 'Minor lapses, manageable' },
        { contractor: 'GHI Co', employeeCount: 8, cirCount: 0, ehsCount: 0, cirScore: 100, ehsScore: 100, overallScore: 100, cirRemark: 'Zero tolerance maintained', ehsRemark: 'Fully compliant' },
        { contractor: 'JKL Pvt', employeeCount: 22, cirCount: 2, ehsCount: 1, cirScore: 80, ehsScore: 100, overallScore: 90, cirRemark: 'Minor lapses, immediate corrective action', ehsRemark: 'Fully compliant' },
      ];
      setContractorScoringData(sampleData);
    } finally {
      setIsScoringLoading(false);
    }
  };

  // Handle PDF Download for Contractor Performance Scoring
  const handleDownloadContractorScoringPDF = () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contractor Performance Scoring Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #1e293b;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.2rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.1rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 15px 0;
              color: #0a41b1;
              font-size: 1.3rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1rem;
            }
            .table-container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
            }
            th {
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9rem;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            tr:hover {
              background: #f1f5f9;
            }
            .rank-badge {
              display: inline-block;
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 0.8rem;
              min-width: 30px;
              text-align: center;
            }
            .score-display {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .score-value {
              font-weight: 700;
              font-size: 1.1rem;
              color: #0a41b1;
            }
            .score-bar {
              width: 60px;
              height: 8px;
              background: #e2e8f0;
              border-radius: 4px;
              overflow: hidden;
            }
            .score-fill {
              height: 100%;
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 0.8rem;
              text-align: center;
              min-width: 80px;
            }
            .status-excellent {
              background: linear-gradient(135deg, #4ecdc4, #44a08d);
              color: white;
            }
            .status-good {
              background: linear-gradient(135deg, #ffd93d, #ff9f43);
              color: white;
            }
            .status-fair {
              background: linear-gradient(135deg, #ff9f43, #ff6b6b);
              color: white;
            }
            .status-poor {
              background: linear-gradient(135deg, #ff6b6b, #ee5a52);
              color: white;
            }
            .employee-count {
              text-align: center;
            }
            .employee-count-value {
              font-weight: 700;
              font-size: 1.1rem;
              color: #0a41b1;
            }
            .employee-count-label {
              font-size: 0.8rem;
              color: #64748b;
            }
            .metric-display {
              text-align: center;
            }
            .metric-count {
              font-weight: 700;
              font-size: 1.1rem;
              color: #0a41b1;
            }
            .metric-score {
              font-size: 0.9rem;
              color: #64748b;
              margin-left: 5px;
            }
            .metric-remark {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 3px;
              font-style: italic;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              table { font-size: 0.8rem; }
              th, td { padding: 8px 6px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Contractor Performance Scoring Report</h1>
            <p>Generated on ${currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
         
          <div class="report-info">
            <h3>Report Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${contractorScoringData.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Employees</span>
                <span class="info-value">${contractorScoringData.reduce((sum, contractor) => sum + contractor.employeeCount, 0)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Average Score</span>
                <span class="info-value">${contractorScoringData.length > 0 ? (contractorScoringData.reduce((sum, contractor) => sum + contractor.overallScore, 0) / contractorScoringData.length).toFixed(1) : 0}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">Last 30 Days</span>
              </div>
            </div>
          </div>
         
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Contractor</th>
                  <th>Employees</th>
                  <th>CIR Count</th>
                  <th>EHS Violations</th>
                  <th>Overall Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${contractorScoringData.map((contractor, index) => `
                  <tr>
                    <td>
                      <span class="rank-badge">${index + 1}</span>
                    </td>
                    <td style="font-weight: 600; color: #0a41b1;">${contractor.contractor}</td>
                    <td class="employee-count">
                      <div>
                        <span class="employee-count-value">${contractor.employeeCount}</span>
                        <div class="employee-count-label">employees</div>
                      </div>
                    </td>
                    <td class="metric-display">
                      <div>
                        <span class="metric-count">${contractor.cirCount}</span>
                        <span class="metric-score">(${contractor.cirScore})</span>
                        <div class="metric-remark">${contractor.cirRemark}</div>
                      </div>
                    </td>
                    <td class="metric-display">
                      <div>
                        <span class="metric-count">${contractor.ehsCount}</span>
                        <span class="metric-score">(${contractor.ehsScore})</span>
                        <div class="metric-remark">${contractor.ehsRemark}</div>
                      </div>
                    </td>
                    <td>
                      <div class="score-display">
                        <span class="score-value">${contractor.overallScore}</span>
                        <div class="score-bar">
                          <div class="score-fill" style="width: ${contractor.overallScore}%; background: ${
                            contractor.overallScore >= 80 ? '#4ecdc4' :
                            contractor.overallScore >= 60 ? '#ffd93d' :
                            contractor.overallScore >= 40 ? '#ff9f43' : '#ff6b6b'
                          }"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge status-${contractor.overallScore >= 80 ? 'excellent' :
                        contractor.overallScore >= 60 ? 'good' :
                        contractor.overallScore >= 40 ? 'fair' : 'poor'}">
                        ${contractor.overallScore >= 80 ? 'Excellent' :
                          contractor.overallScore >= 60 ? 'Good' :
                          contractor.overallScore >= 40 ? 'Fair' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
         
          <div class="footer">
            <p>This report was generated automatically by the Contractor Management System</p>
            <p>For questions or support, please contact your system administrator</p>
          </div>
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contractor_Performance_Scoring_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object
      URL.revokeObjectURL(url);
     
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Handle PDF Download for CL Addition Trend - Enhanced with All Contractors Data
  const handleDownloadCLAdditionTrendPDF = async () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      console.log('🔄 Starting comprehensive CL Addition Trend PDF generation...');
     
      // Fetch all contractors data for comprehensive report
      const allContractorsData = {};
      const contractorsList = [];
     
      // Get all contractors from the current contractor list
      if (contractorList && contractorList.length > 0) {
        // Filter out 'All' option as it's just a filter, not an actual contractor
        const actualContractors = contractorList.filter(contractor => contractor !== 'All');
        contractorsList.push(...actualContractors);
        console.log('📋 Contractors from state (excluding All):', actualContractors);
      }
     
      // Also get contractors from employee data
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
       
        if (data.status === 'success' && data.data && data.data.employees) {
          const employees = data.data.employees;
          const employeeContractors = [...new Set(
            employees
              .map(emp => emp.contractor)
              .filter(contractor => contractor && contractor.trim() !== '')
          )];
          contractorsList.push(...employeeContractors);
          console.log('📋 Contractors from employee data:', employeeContractors);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch contractors from employee data:', error);
      }
     
      console.log('📋 All contractors before deduplication:', contractorsList);
     
      // Remove duplicates and get unique contractors with advanced deduplication
      const uniqueContractors = [];
      contractorsList.forEach(contractor => {
        if (!contractor || contractor.trim() === '') return;
       
        const normalizedContractor = contractor.trim();
        const isDuplicate = uniqueContractors.some(existing => {
          const normalizedExisting = existing.trim();
          // Check for exact match or if one contains the other (case insensitive)
          return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                 normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                 normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
        });
       
        if (!isDuplicate) {
          uniqueContractors.push(normalizedContractor);
        }
      });
     
      console.log('📊 Unique contractors found after advanced deduplication:', uniqueContractors);
      console.log('📊 Total contractors count:', uniqueContractors.length);
     
      // Fetch data for each contractor
      for (const contractor of uniqueContractors) {
        try {
          console.log(`🔄 Fetching data for contractor: ${contractor}`);
          const contractorData = await fetchClAdditionTrendForContractor(contractor);
          allContractorsData[contractor] = contractorData;
        } catch (error) {
          console.error(`❌ Error fetching data for contractor ${contractor}:`, error);
          allContractorsData[contractor] = {
            trendData: [],
            totalAdditions: 0,
            error: true
          };
        }
      }
     
      // Calculate overall totals
      const overallTotals = clAdditionTrendData.reduce((acc, item) => {
        acc.totalAdditions += item.value;
        acc.monthlyTargets += item.target;
        return acc;
      }, { totalAdditions: 0, monthlyTargets: 0 });
     
      // Create comprehensive HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CL Addition Trend Comprehensive Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 20px 0;
              color: #0a41b1;
              font-size: 1.4rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #0a41b1;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 700;
            }
            .section {
              background: white;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 25px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .trend-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
              margin-top: 20px;
            }
            .trend-table th {
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9rem;
            }
            .trend-table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .trend-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .month-cell {
              font-weight: 600;
              color: #0a41b1;
            }
            .value-cell {
              text-align: center;
              font-weight: 700;
              font-size: 1.1rem;
            }
            .target-cell {
              text-align: center;
              color: #64748b;
            }
            .performance-cell {
              text-align: center;
              font-weight: 600;
            }
            .performance-excellent {
              color: #10B981;
            }
            .performance-good {
              color: #3B82F6;
            }
            .performance-average {
              color: #F59E0B;
            }
            .performance-poor {
              color: #EF4444;
            }
            .contractor-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .contractor-header {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              padding: 15px 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #0a41b1;
            }
            .contractor-name {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0a41b1;
              margin: 0 0 5px 0;
            }
            .contractor-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a41b1;
            }
            .stat-label {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 2px;
            }
            .contractor-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-top: 15px;
            }
            .contractor-table th {
              background: #64748b;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
            }
            .contractor-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-align: center;
            }
            .contractor-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }
            .summary-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .summary-value {
              font-size: 2rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 5px;
            }
            .summary-label {
              color: #64748b;
              font-size: 0.9rem;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              .trend-table, .contractor-table { font-size: 0.8rem; }
              .trend-table th, .trend-table td, .contractor-table th, .contractor-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CL Addition Trend Comprehensive Report</h1>
            <p>Generated on ${currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
         
          <div class="report-info">
            <h3>Executive Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">Last 6 Months</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${uniqueContractors.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Status</span>
                <span class="info-value">${clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? 'LIVE DATA' : 'SAMPLE DATA'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Additions</span>
                <span class="info-value">${overallTotals.totalAdditions}</span>
              </div>
            </div>
          </div>
         
          <!-- Overall Summary Section -->
          <div class="section">
            <div class="section-title">Overall Performance Summary</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">${overallTotals.totalAdditions}</div>
                <div class="summary-label">Total Additions</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${uniqueContractors.length}</div>
                <div class="summary-label">Active Contractors</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${clAdditionTrendData.length}</div>
                <div class="summary-label">Months Tracked</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${(overallTotals.totalAdditions / clAdditionTrendData.length).toFixed(1)}</div>
                <div class="summary-label">Average per Month</div>
              </div>
            </div>
          </div>
         
          <!-- Overall Trend Table -->
          <div class="section">
            <div class="section-title">Overall CL Addition Trend (Last 6 Months)</div>
            <table class="trend-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Employees Joined</th>
                </tr>
              </thead>
              <tbody>
                ${clAdditionTrendData.map((item, index) => {
                  return `
                    <tr>
                      <td class="month-cell">${item.month}</td>
                      <td class="value-cell">${item.value}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
         
          <!-- Individual Contractor Details -->
          <div class="section page-break">
            <div class="section-title">Individual Contractor Performance</div>
            ${uniqueContractors.map((contractor, index) => {
              const contractorData = allContractorsData[contractor];
              if (!contractorData || contractorData.error) {
                return `
                  <div class="contractor-section">
                    <div class="contractor-header">
                      <div class="contractor-name">${contractor}</div>
                      <div style="color: #EF4444; font-size: 0.9rem;">Data not available</div>
            </div>
          </div>
                `;
              }
             
              const totalAdditions = contractorData.trendData.reduce((sum, item) => sum + item.value, 0);
              const totalTarget = contractorData.trendData.reduce((sum, item) => sum + item.target, 0);
              const achievementRate = totalTarget > 0 ? ((totalAdditions / totalTarget) * 100).toFixed(1) : 0;
             
              return `
                <div class="contractor-section">
                  <div class="contractor-header">
                    <div class="contractor-name">${contractor}</div>
                    <div class="contractor-stats">
                      <div class="stat-item">
                        <div class="stat-value">${totalAdditions}</div>
                        <div class="stat-label">Total Additions</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">${contractorData.trendData.length}</div>
                        <div class="stat-label">Months Active</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">${(totalAdditions / contractorData.trendData.length).toFixed(1)}</div>
                        <div class="stat-label">Average per Month</div>
                      </div>
                    </div>
                  </div>
                 
                  <table class="contractor-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Additions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${contractorData.trendData.map((item, monthIndex) => {
                        return `
                          <tr>
                            <td class="month-cell">${item.month}</td>
                            <td class="value-cell">${item.value}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
         
          <div class="footer">
            <p>This comprehensive report was generated automatically by the Contractor Management System</p>
            <p>Includes data for all contractors with individual performance breakdowns</p>
            <p>For questions or support, please contact your system administrator</p>
          </div>
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `CL_Addition_Trend_Comprehensive_All_Contractors_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object
      URL.revokeObjectURL(url);
     
      console.log('✅ Comprehensive CL Addition Trend PDF generated successfully');
     
    } catch (error) {
      console.error('Error generating comprehensive CL Addition Trend PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to fetch CL Addition Trend data for a specific contractor
  const fetchClAdditionTrendForContractor = async (contractor) => {
    try {
      console.log(`🔄 Fetching CL Addition Trend data for contractor: ${contractor}`);
     
      // Get current date and calculate last 6 months dynamically
      const today = new Date();
      const months = [];
     
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
       
        months.push({
          month: monthName,
          monthKey: monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1
        });
      }
     
      // Fetch employee data
      const timestamp = new Date().getTime();
      const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
       
        // Filter employees by contractor
        const filteredEmployees = employees.filter(employee =>
          employee.contractor && employee.contractor.toLowerCase().includes(contractor.toLowerCase())
        );
       
        // Initialize monthly counts
        const monthlyCounts = {};
        months.forEach(({ month }) => {
          monthlyCounts[month] = { count: 0 };
        });
       
        // Count employees who joined in each month
        const currentYear = new Date().getFullYear();
        months.forEach(({ month }) => {
          const monthEmployees = getEmployeesForMonth(filteredEmployees, month, currentYear, contractor);
          monthlyCounts[month].count = monthEmployees.length;
        });
       
        // Convert to chart data format
        const trendData = months.map(({ month }) => ({
          month: month,
          value: monthlyCounts[month].count,
          target: 15, // Set a target of 15 employees per month
          lastUpdated: new Date().toISOString(),
          isRealTime: true
        }));
       
        return {
          trendData,
          totalAdditions: trendData.reduce((sum, item) => sum + item.value, 0),
          error: false
        };
      } else {
        // Return empty data if no employees found
        const trendData = months.map(({ month }) => ({
          month: month,
          value: 0,
          target: 15,
          lastUpdated: new Date().toISOString(),
          isRealTime: false
        }));
       
        return {
          trendData,
          totalAdditions: 0,
          error: false
        };
      }
    } catch (error) {
      console.error(`❌ Error fetching data for contractor ${contractor}:`, error);
      return {
        trendData: [],
        totalAdditions: 0,
        error: true
      };
    }
  };

  // Handle PDF Download for CL Attrition Trend - Enhanced with All Contractors Data
  const handleDownloadCLAttritionTrendPDF = async () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      console.log('🔄 Starting comprehensive CL Attrition Trend PDF generation...');
     
      // Fetch all contractors data for comprehensive report
      const allContractorsData = {};
      const contractorsList = [];
     
      // Get all contractors from the current contractor list
      if (contractorList && contractorList.length > 0) {
        // Filter out 'All' option as it's just a filter, not an actual contractor
        const actualContractors = contractorList.filter(contractor => contractor !== 'All');
        contractorsList.push(...actualContractors);
        console.log('📋 Contractors from state (excluding All):', actualContractors);
      }
     
      // Also get contractors from employee data
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
       
        if (data.status === 'success' && data.data && data.data.employees) {
          const employees = data.data.employees;
          const employeeContractors = [...new Set(
            employees
              .map(emp => emp.contractor)
              .filter(contractor => contractor && contractor.trim() !== '')
          )];
          contractorsList.push(...employeeContractors);
          console.log('📋 Contractors from employee data:', employeeContractors);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch contractors from employee data:', error);
      }
     
      console.log('📋 All contractors before deduplication:', contractorsList);
     
      // Remove duplicates and get unique contractors with advanced deduplication
      const uniqueContractors = [];
      contractorsList.forEach(contractor => {
        if (!contractor || contractor.trim() === '') return;
       
        const normalizedContractor = contractor.trim();
        const isDuplicate = uniqueContractors.some(existing => {
          const normalizedExisting = existing.trim();
          // Check for exact match or if one contains the other (case insensitive)
          return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                 normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                 normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
        });
       
        if (!isDuplicate) {
          uniqueContractors.push(normalizedContractor);
        }
      });
     
      console.log('📊 Unique contractors found after advanced deduplication:', uniqueContractors);
      console.log('📊 Total contractors count:', uniqueContractors.length);
     
      // Fetch data for each contractor
      for (const contractor of uniqueContractors) {
        try {
          console.log(`🔄 Fetching attrition data for contractor: ${contractor}`);
          const contractorData = await fetchClAttritionTrendForContractor(contractor);
          allContractorsData[contractor] = contractorData;
        } catch (error) {
          console.error(`❌ Error fetching attrition data for contractor ${contractor}:`, error);
          allContractorsData[contractor] = {
            trendData: [],
            totalAttrition: 0,
            error: true
          };
        }
      }
     
      // Calculate overall totals
      const overallTotals = clAttritionTrendData.reduce((acc, item) => {
        acc.totalAttrition += item.value;
        return acc;
      }, { totalAttrition: 0 });
     
      // Create comprehensive HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CL Attrition Trend Comprehensive Report</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 30px;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
              min-width: 1200px;
              font-size: 16px;
            }
            @media screen {
              body {
                padding: 40px;
                max-width: 1400px;
                margin: 0 auto;
              }
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 20px 0;
              color: #0a41b1;
              font-size: 1.4rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #0a41b1;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 700;
            }
            .section {
              background: white;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 25px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .trend-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
              margin-top: 20px;
            }
            .trend-table th {
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9rem;
            }
            .trend-table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .trend-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .month-cell {
              font-weight: 600;
              color: #0a41b1;
            }
            .value-cell {
              text-align: center;
              font-weight: 700;
              font-size: 1.1rem;
            }
            .benchmark-cell {
              text-align: center;
              color: #64748b;
            }
            .performance-cell {
              text-align: center;
              font-weight: 600;
            }
            .performance-excellent {
              color: #10B981;
            }
            .performance-good {
              color: #3B82F6;
            }
            .performance-average {
              color: #F59E0B;
            }
            .performance-poor {
              color: #EF4444;
            }
            .contractor-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .contractor-header {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              padding: 15px 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #0a41b1;
            }
            .contractor-name {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0a41b1;
              margin: 0 0 5px 0;
            }
            .contractor-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a41b1;
            }
            .stat-label {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 2px;
            }
            .contractor-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-top: 15px;
            }
            .contractor-table th {
              background: #64748b;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
            }
            .contractor-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-align: center;
            }
            .contractor-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }
            .summary-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .summary-value {
              font-size: 2rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 5px;
            }
            .summary-label {
              color: #64748b;
              font-size: 0.9rem;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              .trend-table, .contractor-table { font-size: 0.8rem; }
              .trend-table th, .trend-table td, .contractor-table th, .contractor-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CL Attrition Trend Comprehensive Report</h1>
            <p>Generated on ${currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
         
          <div class="report-info">
            <h3>Executive Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">All Exit Dates</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${uniqueContractors.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Status</span>
                <span class="info-value">${clAttritionTrendData.length > 0 && clAttritionTrendData[0].isRealTime ? 'LIVE DATA' : 'SAMPLE DATA'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Attrition</span>
                <span class="info-value">${overallTotals.totalAttrition}</span>
              </div>
            </div>
          </div>
         
          <!-- Overall Summary Section -->
          <div class="section">
            <div class="section-title">Overall Performance Summary</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">${overallTotals.totalAttrition}</div>
                <div class="summary-label">Total Attrition</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${clAttritionTrendData.length}</div>
                <div class="summary-label">Months Tracked</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${(overallTotals.totalAttrition / clAttritionTrendData.length).toFixed(1)}</div>
                <div class="summary-label">Average per Month</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${uniqueContractors.length}</div>
                <div class="summary-label">Active Contractors</div>
              </div>
            </div>
          </div>
         
          <!-- Overall Trend Table -->
          <div class="section">
            <div class="section-title">Overall CL Attrition Trend (All Exit Dates)</div>
            <table class="trend-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Employees Left</th>
                </tr>
              </thead>
              <tbody>
                ${clAttritionTrendData.map((item, index) => {
                  return `
                    <tr>
                      <td class="month-cell">${item.month}</td>
                      <td class="value-cell">${item.value}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
         
          <!-- Individual Contractor Details -->
          <div class="section page-break">
            <div class="section-title">Individual Contractor Performance</div>
            ${uniqueContractors.map((contractor, index) => {
              const contractorData = allContractorsData[contractor];
              if (!contractorData || contractorData.error) {
                return `
                  <div class="contractor-section">
                    <div class="contractor-header">
                      <div class="contractor-name">${contractor}</div>
                      <div style="color: #EF4444; font-size: 0.9rem;">Data not available</div>
            </div>
          </div>
                `;
              }
             
              const totalAttrition = contractorData.trendData.reduce((sum, item) => sum + item.value, 0);
             
              return `
                <div class="contractor-section">
                  <div class="contractor-header">
                    <div class="contractor-name">${contractor}</div>
                    <div class="contractor-stats">
                      <div class="stat-item">
                        <div class="stat-value">${totalAttrition}</div>
                        <div class="stat-label">Total Attrition</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">${contractorData.trendData.length}</div>
                        <div class="stat-label">Months Active</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">${(totalAttrition / contractorData.trendData.length).toFixed(1)}</div>
                        <div class="stat-label">Average per Month</div>
                      </div>
                    </div>
                  </div>
                 
                  <table class="contractor-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Attrition</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${contractorData.trendData.map((item, monthIndex) => {
                        return `
                          <tr>
                            <td class="month-cell">${item.month}</td>
                            <td class="value-cell">${item.value}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
         
          <div class="footer">
            <p>This comprehensive report was generated automatically by the Contractor Management System</p>
            <p>Includes data for all contractors with individual performance breakdowns</p>
            <p>For questions or support, please contact your system administrator</p>
          </div>
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Open in new window with proper sizing for better display
      const newWindow = window.open(url, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
      
      // Also provide download option
      const link = document.createElement('a');
      link.href = url;
      link.download = `CL_Attrition_Trend_Comprehensive_All_Contractors_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object after a delay to allow download
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
     
      console.log('✅ Comprehensive CL Attrition Trend PDF generated successfully');
     
    } catch (error) {
      console.error('Error generating comprehensive CL Attrition Trend PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to fetch CL Attrition Trend data for a specific contractor
  const fetchClAttritionTrendForContractor = async (contractor) => {
    try {
      console.log(`🔄 Fetching CL Attrition Trend data for contractor: ${contractor}`);
     
      // Get current date and calculate last 6 months dynamically
      const today = new Date();
      const months = [];
     
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
       
        months.push({
          month: monthName,
          monthKey: monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1
        });
      }
     
      // Fetch employee data
      const timestamp = new Date().getTime();
      const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
     
      if (data.status === 'success' && data.data && data.data.employees) {
        const employees = data.data.employees;
       
        // Filter employees by contractor
        const filteredEmployees = employees.filter(employee =>
          employee.contractor && employee.contractor.toLowerCase().includes(contractor.toLowerCase())
        );
       
        // Initialize monthly counts using monthKey as unique identifier
        const monthlyCounts = {};
        months.forEach(({ month, monthKey }) => {
          monthlyCounts[monthKey] = { count: 0, month: month };
        });
       
        // Count employees who left in each month
        filteredEmployees.forEach(employee => {
          if (employee.dateOfExit) {
            const exitDate = new Date(employee.dateOfExit);
            const exitMonthKey = exitDate.toISOString().slice(0, 7); // YYYY-MM format
           
            // Find the corresponding month in our months array
            const monthData = months.find(m => m.monthKey === exitMonthKey);
            if (monthData) {
              monthlyCounts[monthData.monthKey].count++;
            }
          }
        });
       
        // Convert to chart data format
        const trendData = months.map(({ month, monthKey, year }) => {
          // Check if there are multiple months with the same name (different years)
          const sameMonthCount = months.filter(m => m.month === month).length;
          const displayMonth = sameMonthCount > 1 ? `${month} ${year}` : month;
         
          return {
            month: displayMonth,
            value: monthlyCounts[monthKey].count,
            benchmark: 8, // Set a benchmark of 8 employees per month
            lastUpdated: new Date().toISOString(),
            isRealTime: true
          };
        });
       
        return {
          trendData,
          totalAttrition: trendData.reduce((sum, item) => sum + item.value, 0),
          error: false
        };
      } else {
        // Return empty data if no employees found
        const trendData = months.map(({ month }) => ({
          month: month,
          value: 0,
          benchmark: 8,
          lastUpdated: new Date().toISOString(),
          isRealTime: true // This is real-time data showing 0 exits
        }));
       
        return {
          trendData,
          totalAttrition: 0,
          error: false
        };
      }
    } catch (error) {
      console.error(`❌ Error fetching attrition data for contractor ${contractor}:`, error);
      return {
        trendData: [],
        totalAttrition: 0,
        error: true
      };
    }
  };

  // Handle PDF Download for General Shift Daily Employee Count - Enhanced with All Contractors and All Shifts Data
  const handleDownloadGeneralShiftPDF = async () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      console.log('🔄 Starting comprehensive General Shift Daily Employee Count PDF generation...');
     
      // Check if any employees are assigned to shifts
      const totalAssignedEmployees = Object.values(shiftDistribution).reduce((sum, shift) => sum + (shift.assigned || 0), 0);
      const hasAssignedEmployees = totalAssignedEmployees > 0;
     
      // Fetch all contractors data for comprehensive report
      const allContractorsData = {};
      const contractorsList = [];
     
      // Get all contractors from the current contractor list
      if (contractorList && contractorList.length > 0) {
        // Filter out 'All' option as it's just a filter, not an actual contractor
        const actualContractors = contractorList.filter(contractor => contractor !== 'All');
        contractorsList.push(...actualContractors);
        console.log('📋 Contractors from state (excluding All):', actualContractors);
      }
     
      // Also get contractors from employee data
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
       
        if (data.status === 'success' && data.data && data.data.employees) {
          const employees = data.data.employees;
          const employeeContractors = [...new Set(
            employees
              .map(emp => emp.contractor)
              .filter(contractor => contractor && contractor.trim() !== '')
          )];
          contractorsList.push(...employeeContractors);
          console.log('📋 Contractors from employee data:', employeeContractors);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch contractors from employee data:', error);
      }
     
      console.log('📋 All contractors before deduplication:', contractorsList);
     
      // Remove duplicates and get unique contractors with advanced deduplication
      const uniqueContractors = [];
      contractorsList.forEach(contractor => {
        if (!contractor || contractor.trim() === '') return;
       
        const normalizedContractor = contractor.trim();
        const isDuplicate = uniqueContractors.some(existing => {
          const normalizedExisting = existing.trim();
          // Check for exact match or if one contains the other (case insensitive)
          return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                 normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                 normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
        });
       
        if (!isDuplicate) {
          uniqueContractors.push(normalizedContractor);
        }
      });
     
      console.log('📊 Unique contractors found after advanced deduplication:', uniqueContractors);
      console.log('📊 Total contractors count:', uniqueContractors.length);
     
      // Fetch shift data for each contractor
      for (const contractor of uniqueContractors) {
        try {
          console.log(`🔄 Fetching shift data for contractor: ${contractor}`);
          const contractorData = await fetchGeneralShiftForContractor(contractor);
          allContractorsData[contractor] = contractorData;
        } catch (error) {
          console.error(`❌ Error fetching shift data for contractor ${contractor}:`, error);
          allContractorsData[contractor] = {
            shiftWiseData: {},
            totalEmployees: 0,
            averageDaily: 0,
            error: true
          };
        }
      }
     
      // Get shift-wise data from current data and also fetch actual shifts from database
      const shiftWiseData = {};
      const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     
      // First, get all available shifts from the database
      let allAvailableShifts = [];
      try {
        console.log('🔄 Fetching all available shifts from database...');
        const shiftsResponse = await fetch('/server/Shift_function/shifts');
        const shiftsData = await shiftsResponse.json();
       
        if (shiftsData.status === 'success' && shiftsData.data && shiftsData.data.shifts) {
          allAvailableShifts = shiftsData.data.shifts.map(shift => shift.shiftName).filter(Boolean);
          allAvailableShifts = [...new Set(allAvailableShifts)]; // Remove duplicates
          console.log('📋 Available shifts from database:', allAvailableShifts);
        }
      } catch (error) {
        console.error('❌ Error fetching shifts from database:', error);
      }
     
      // Process daily shift data to organize by shift
      dailyShiftData.forEach((dayData, index) => {
        if (dayData.shifts) {
          Object.keys(dayData.shifts).forEach(shiftName => {
            if (!shiftWiseData[shiftName]) {
              shiftWiseData[shiftName] = {
                name: shiftName,
                dailyCounts: [],
                totalEmployees: 0,
                averageDaily: 0
              };
            }
           
            const dayCount = dayData.shifts[shiftName] || 0;
            shiftWiseData[shiftName].dailyCounts.push({
              day: chartLabels[index] || `Day ${index + 1}`,
              count: dayCount
            });
            shiftWiseData[shiftName].totalEmployees += dayCount;
          });
        }
      });
     
      // If no shifts found in daily data, but we have shifts in database, create empty entries
      if (Object.keys(shiftWiseData).length === 0 && allAvailableShifts.length > 0) {
        console.log('📊 No daily shift data found, but shifts exist in database. Creating entries for available shifts...');
        allAvailableShifts.forEach(shiftName => {
          shiftWiseData[shiftName] = {
            name: shiftName,
            dailyCounts: chartLabels.map(day => ({ day, count: 0 })),
            totalEmployees: 0,
            averageDaily: 0
          };
        });
      }
     
      // Calculate averages
      Object.keys(shiftWiseData).forEach(shiftName => {
        const shift = shiftWiseData[shiftName];
        shift.averageDaily = shift.dailyCounts.length > 0 ?
          (shift.totalEmployees / shift.dailyCounts.length).toFixed(1) : 0;
      });
     
      console.log('📊 Final shiftWiseData:', shiftWiseData);
      console.log('📊 Total shifts found:', Object.keys(shiftWiseData).length);
     
      // Create comprehensive HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>General Shift Daily Employee Count Comprehensive Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 20px 0;
              color: #0a41b1;
              font-size: 1.4rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #0a41b1;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 700;
            }
            .section {
              background: white;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 25px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              border: 2px solid #e2e8f0;
            }
            .summary-card.shifts {
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
            }
            .summary-card.employees {
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
            }
            .summary-card.contractors {
              background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
              color: white;
            }
            .summary-card.days {
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
              color: white;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              font-size: 0.9rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              opacity: 0.9;
            }
            .summary-card .value {
              font-size: 2.5rem;
              font-weight: 800;
              margin: 0;
            }
            .shift-section {
              margin: 30px 0;
            }
            .shift-section h2 {
              color: #0a41b1;
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 3px solid #0a41b1;
            }
            .shift-card {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              margin-bottom: 20px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .shift-header {
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              padding: 20px;
              font-size: 1.2rem;
              font-weight: 700;
            }
            .shift-content {
              padding: 20px;
            }
            .shift-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-item {
              text-align: center;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .stat-label {
              font-size: 0.85rem;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 1.5rem;
              font-weight: 800;
              color: #0a41b1;
            }
            .daily-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .daily-table th {
              background: #f8fafc;
              color: #0a41b1;
              padding: 12px;
              text-align: center;
              font-weight: 700;
              font-size: 0.9rem;
              border: 1px solid #e2e8f0;
            }
            .daily-table td {
              padding: 12px;
              text-align: center;
              border: 1px solid #e2e8f0;
              font-weight: 600;
            }
            .daily-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .highlight {
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 700;
            }
            .contractor-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .contractor-header {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              padding: 15px 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #0a41b1;
            }
            .contractor-name {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0a41b1;
              margin: 0 0 5px 0;
            }
            .contractor-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a41b1;
            }
            .stat-label {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 2px;
            }
            .contractor-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-top: 15px;
            }
            .contractor-table th {
              background: #64748b;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
            }
            .contractor-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-align: center;
            }
            .contractor-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .page-break {
              page-break-before: always;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #64748b;
              font-style: italic;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              .daily-table, .contractor-table { font-size: 0.8rem; }
              .daily-table th, .daily-table td, .contractor-table th, .contractor-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
            <div class="header">
            <h1>General Shift Daily Employee Count Comprehensive Report</h1>
              <p>${hasAssignedEmployees ? 'L-Shaped Daily Employee Count' : 'Daily Employee Count (No Assignments)'}</p>
              <p>Generated on ${currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
           
          <div class="report-info">
            <h3>Executive Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">Last 7 Days</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${uniqueContractors.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Shifts</span>
                <span class="info-value">${Object.keys(shiftWiseData).length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Days</span>
                <span class="info-value">${dailyShiftData.length}</span>
              </div>
            </div>
          </div>
         
          <!-- Overall Summary Section -->
          <div class="section">
            <div class="section-title">Overall Shift Performance Summary</div>
              <div class="summary-grid">
              <div class="summary-card shifts">
                  <h3>Total Shifts</h3>
                <div class="value">${Object.keys(shiftWiseData).length}</div>
                </div>
              <div class="summary-card employees">
                  <h3>Total Employees</h3>
                <div class="value">${Object.values(shiftWiseData).reduce((sum, shift) => sum + shift.totalEmployees, 0)}</div>
                </div>
              <div class="summary-card contractors">
                <h3>Total Contractors</h3>
                <div class="value">${uniqueContractors.length}</div>
                </div>
              <div class="summary-card days">
                  <h3>Data Days</h3>
                <div class="value">${dailyShiftData.length}</div>
              </div>
                </div>
              </div>

          <!-- Overall Shift Analysis -->
          <div class="section">
            <div class="section-title">Overall Shift-wise Daily Employee Count Analysis</div>
                <p style="color: #64748b; font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">
                  This report provides a detailed breakdown of daily employee counts organized by shift.
                  Each shift section shows the daily distribution of employees over the last 7 days.
                </p>
               
                ${Object.keys(shiftWiseData).length > 0 ?
                  Object.values(shiftWiseData).map(shift => `
                    <div class="shift-card">
                      <div class="shift-header">
                        ${shift.name} Shift
                      </div>
                      <div class="shift-content">
                        <div class="shift-stats">
                          <div class="stat-item">
                            <div class="stat-label">Total Employees</div>
                            <div class="stat-value">${shift.totalEmployees}</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-label">Average Daily</div>
                            <div class="stat-value">${shift.averageDaily}</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-label">Peak Day</div>
                            <div class="stat-value">${Math.max(...shift.dailyCounts.map(d => d.count))}</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-label">Lowest Day</div>
                            <div class="stat-value">${Math.min(...shift.dailyCounts.map(d => d.count))}</div>
                          </div>
                        </div>
                       
                        <table class="daily-table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Employee Count</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${shift.dailyCounts.map(day => `
                              <tr>
                                <td><strong>${day.day}</strong></td>
                                <td><span class="highlight">${day.count}</span></td>
                                <td>${day.count > parseFloat(shift.averageDaily) ? 'Above Average' :
                                    day.count < parseFloat(shift.averageDaily) ? 'Below Average' : 'Average'}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  `).join('') :
                  '<div class="no-data">No shift data available for the selected period.</div>'
                }
              </div>
         
          <!-- Individual Contractor Details -->
          <div class="section page-break">
            <div class="section-title">Individual Contractor Performance</div>
            ${uniqueContractors.map((contractor, index) => {
              const contractorData = allContractorsData[contractor];
              if (!contractorData || contractorData.error) {
                return `
                  <div class="contractor-section">
                    <div class="contractor-header">
                      <div class="contractor-name">${contractor}</div>
                      <div style="color: #EF4444; font-size: 0.9rem;">Data not available</div>
            </div>
                  </div>
                `;
              }
             
              return `
                <div class="contractor-section">
                  <div class="contractor-header">
                    <div class="contractor-name">${contractor}</div>
                    <div class="contractor-stats">
                      <div class="stat-item">
                        <div class="stat-value">${contractorData.totalEmployees}</div>
                        <div class="stat-label">Total Employees</div>
            </div>
                      <div class="stat-item">
                        <div class="stat-value">${contractorData.averageDaily}</div>
                        <div class="stat-label">Average Daily</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">${Object.keys(contractorData.shiftWiseData).length}</div>
                        <div class="stat-label">Active Shifts</div>
                      </div>
                    </div>
                  </div>
                 
                  ${Object.keys(contractorData.shiftWiseData).length > 0 ? `
                    <table class="contractor-table">
                      <thead>
                        <tr>
                          <th>Shift</th>
                          <th>Total Employees</th>
                          <th>Average Daily</th>
                          <th>Peak Day</th>
                          <th>Lowest Day</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Object.values(contractorData.shiftWiseData).map(shift => `
                          <tr>
                            <td><strong>${shift.name}</strong></td>
                            <td><span class="highlight">${shift.totalEmployees}</span></td>
                            <td>${shift.averageDaily}</td>
                            <td>${Math.max(...shift.dailyCounts.map(d => d.count))}</td>
                            <td>${Math.min(...shift.dailyCounts.map(d => d.count))}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  ` : `
                    <div class="no-data">No shift data available for this contractor.</div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
         
          <div class="footer">
            <p>This comprehensive report was generated automatically by the Contractor Management System</p>
            <p>Includes data for all contractors and all shifts with individual performance breakdowns</p>
            <p>For questions or support, please contact your system administrator</p>
          </div>
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `General_Shift_Daily_Employee_Count_Comprehensive_All_Contractors_All_Shifts_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object
      URL.revokeObjectURL(url);
     
      console.log('✅ Comprehensive General Shift Daily Employee Count PDF generated successfully');
     
    } catch (error) {
      console.error('Error generating comprehensive General Shift PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to fetch General Shift data for a specific contractor
  const fetchGeneralShiftForContractor = async (contractor) => {
    try {
      console.log(`🔄 Fetching General Shift data for contractor: ${contractor}`);
     
      // Calculate last 7 days
      const today = new Date();
      const last7Days = [];
     
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
       
        last7Days.push({ date: dateStr, day: dayName });
      }
     
      // Get employees under this contractor
      const employeesUnderContractor = await fetchEmployeesByContractor(contractor);
     
      if (employeesUnderContractor.length === 0) {
        return {
          shiftWiseData: {},
          totalEmployees: 0,
          averageDaily: 0,
          error: false
        };
      }
     
      // Get shift-wise data for this contractor
      const shiftWiseData = {};
      const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     
      // Process daily shift data to organize by shift for this contractor
      for (let i = 0; i < last7Days.length; i++) {
        const { date, day } = last7Days[i];
       
        try {
          // Fetch shift data for this specific day
          const response = await fetch(`/server/Shiftmap_function/shiftmaps?date=${date}`);
          const data = await response.json();
         
          if (data && data.shiftmaps && data.shiftmaps.length > 0) {
            // Filter shiftmaps for employees under this contractor
            const contractorShiftmaps = data.shiftmaps.filter(shiftmap =>
              employeesUnderContractor.includes(shiftmap.employeeId) ||
              employeesUnderContractor.includes(String(shiftmap.employeeId)) ||
              employeesUnderContractor.includes(Number(shiftmap.employeeId))
            );
           
            // Group by shift
            contractorShiftmaps.forEach(shiftmap => {
              const shiftName = shiftmap.shiftName || 'Unknown';
             
              if (!shiftWiseData[shiftName]) {
                shiftWiseData[shiftName] = {
                  name: shiftName,
                  dailyCounts: [],
                  totalEmployees: 0,
                  averageDaily: 0
                };
              }
             
              // Add to daily count
              const dayIndex = shiftWiseData[shiftName].dailyCounts.findIndex(d => d.day === day);
              if (dayIndex >= 0) {
                shiftWiseData[shiftName].dailyCounts[dayIndex].count += 1;
              } else {
                shiftWiseData[shiftName].dailyCounts.push({
                  day: day,
                  count: 1
                });
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch shift data for ${date}:`, err);
        }
      }
     
      // Calculate totals and averages
      Object.keys(shiftWiseData).forEach(shiftName => {
        const shift = shiftWiseData[shiftName];
        shift.totalEmployees = shift.dailyCounts.reduce((sum, day) => sum + day.count, 0);
        shift.averageDaily = shift.dailyCounts.length > 0 ?
          (shift.totalEmployees / shift.dailyCounts.length).toFixed(1) : 0;
      });
     
      const totalEmployees = Object.values(shiftWiseData).reduce((sum, shift) => sum + shift.totalEmployees, 0);
      const averageDaily = totalEmployees / 7; // 7 days
     
      return {
        shiftWiseData: shiftWiseData,
        totalEmployees: totalEmployees,
        averageDaily: Math.round(averageDaily * 10) / 10,
        error: false
      };
    } catch (error) {
      console.error(`❌ Error fetching shift data for contractor ${contractor}:`, error);
      return {
        shiftWiseData: {},
        totalEmployees: 0,
        averageDaily: 0,
        error: true
      };
    }
  };

  // Handle PDF Download for Monthly Attendance Distribution
  // Handle PDF Download for Monthly Attendance Distribution - Enhanced with All Contractors Data
  const handleDownloadMonthlyAttendancePDF = async () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      console.log('🔄 Starting comprehensive Monthly Attendance Distribution PDF generation...');
     
      // Format the selected month for display
      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
     
      // Fetch all contractors data for comprehensive report
      const allContractorsData = {};
      const contractorsList = [];
     
      // Get all contractors from the current contractor list
      if (contractorList && contractorList.length > 0) {
        // Filter out 'All' option as it's just a filter, not an actual contractor
        const actualContractors = contractorList.filter(contractor => contractor !== 'All');
        contractorsList.push(...actualContractors);
        console.log('📋 Contractors from state (excluding All):', actualContractors);
      }
     
      // Also get contractors from employee data
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
       
        if (data.status === 'success' && data.data && data.data.employees) {
          const employees = data.data.employees;
          const employeeContractors = [...new Set(
            employees
              .map(emp => emp.contractor)
              .filter(contractor => contractor && contractor.trim() !== '')
          )];
          contractorsList.push(...employeeContractors);
          console.log('📋 Contractors from employee data:', employeeContractors);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch contractors from employee data:', error);
      }
     
      console.log('📋 All contractors before deduplication:', contractorsList);
     
      // Remove duplicates and get unique contractors with advanced deduplication
      const uniqueContractors = [];
      contractorsList.forEach(contractor => {
        if (!contractor || contractor.trim() === '') return;
       
        const normalizedContractor = contractor.trim();
        const isDuplicate = uniqueContractors.some(existing => {
          const normalizedExisting = existing.trim();
          // Check for exact match or if one contains the other (case insensitive)
          return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                 normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                 normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
        });
       
        if (!isDuplicate) {
          uniqueContractors.push(normalizedContractor);
        }
      });
     
      console.log('📊 Unique contractors found after advanced deduplication:', uniqueContractors);
      console.log('📊 Total contractors count:', uniqueContractors.length);
     
      // Fetch attendance data for each contractor
      for (const contractor of uniqueContractors) {
        try {
          console.log(`🔄 Fetching attendance data for contractor: ${contractor}`);
          const contractorData = await fetchMonthlyAttendanceForContractor(contractor);
          allContractorsData[contractor] = contractorData;
        } catch (error) {
          console.error(`❌ Error fetching attendance data for contractor ${contractor}:`, error);
          allContractorsData[contractor] = {
            presentDays: 0,
            absentDays: 0,
            totalDays: 0,
            attendanceRate: 0,
            error: true
          };
        }
      }
     
      // Calculate overall totals from current data
      const totalPresent = attendancePieData.find(item => item.name === 'Present')?.value || 0;
      const totalAbsent = attendancePieData.find(item => item.name === 'Absent')?.value || 0;
      const totalDays = totalPresent + totalAbsent;
      const presentPercentage = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0;
      const absentPercentage = totalDays > 0 ? ((totalAbsent / totalDays) * 100).toFixed(1) : 0;
     
      // Create comprehensive HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Monthly Attendance Distribution Comprehensive Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 20px 0;
              color: #0a41b1;
              font-size: 1.4rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #0a41b1;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 700;
            }
            .section {
              background: white;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 25px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .attendance-summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              border: 2px solid transparent;
              transition: all 0.3s ease;
            }
            .summary-card.present {
              background: linear-gradient(135deg, #4ECDC4 0%, #44a08d 100%);
              color: white;
            }
            .summary-card.absent {
              background: linear-gradient(135deg, #FF6B6B 0%, #ee5a52 100%);
              color: white;
            }
            .summary-card.total {
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
            }
            .summary-value {
              font-size: 2.5rem;
              font-weight: 800;
              margin-bottom: 10px;
            }
            .summary-label {
              font-size: 1.1rem;
              font-weight: 600;
              opacity: 0.9;
            }
            .summary-percentage {
              font-size: 1.2rem;
              font-weight: 700;
              margin-top: 5px;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
              margin-top: 20px;
            }
            .attendance-table th {
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9rem;
            }
            .attendance-table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .attendance-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .status-cell {
              text-align: center;
              font-weight: 600;
            }
            .status-present {
              color: #10B981;
            }
            .status-absent {
              color: #EF4444;
            }
            .contractor-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .contractor-header {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              padding: 15px 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #0a41b1;
            }
            .contractor-name {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0a41b1;
              margin: 0 0 5px 0;
            }
            .contractor-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a41b1;
            }
            .stat-label {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 2px;
            }
            .contractor-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-top: 15px;
            }
            .contractor-table th {
              background: #64748b;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
            }
            .contractor-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-align: center;
            }
            .contractor-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              .attendance-table, .contractor-table { font-size: 0.8rem; }
              .attendance-table th, .attendance-table td, .contractor-table th, .contractor-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Attendance Distribution Comprehensive Report</h1>
            <p>Generated on ${currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
         
          <div class="report-info">
            <h3>Executive Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">${monthName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${uniqueContractors.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Days Tracked</span>
                <span class="info-value">${totalDays}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Overall Attendance Rate</span>
                <span class="info-value">${presentPercentage}%</span>
              </div>
            </div>
          </div>
         
          <!-- Overall Summary Section -->
          <div class="section">
            <div class="section-title">Overall Attendance Summary</div>
            <div class="attendance-summary">
              <div class="summary-card present">
                <div class="summary-value">${totalPresent}</div>
                <div class="summary-label">Present Days</div>
                <div class="summary-percentage">${presentPercentage}%</div>
              </div>
              <div class="summary-card absent">
                <div class="summary-value">${totalAbsent}</div>
                <div class="summary-label">Absent Days</div>
                <div class="summary-percentage">${absentPercentage}%</div>
              </div>
              <div class="summary-card total">
                <div class="summary-value">${totalDays}</div>
                <div class="summary-label">Total Days</div>
                <div class="summary-percentage">100%</div>
              </div>
            </div>
          </div>
         
          <!-- Overall Attendance Table -->
          <div class="section">
            <div class="section-title">Overall Attendance Distribution</div>
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                  <th>Color Code</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="status-cell status-present">Present</td>
                  <td class="status-cell">${totalPresent}</td>
                  <td class="status-cell">${presentPercentage}%</td>
                  <td class="status-cell" style="color: #4ECDC4;">●</td>
                </tr>
                <tr>
                  <td class="status-cell status-absent">Absent</td>
                  <td class="status-cell">${totalAbsent}</td>
                  <td class="status-cell">${absentPercentage}%</td>
                  <td class="status-cell" style="color: #FF6B6B;">●</td>
                </tr>
              </tbody>
            </table>
          </div>
         
          <!-- Individual Contractor Details -->
          <div class="section page-break">
            <div class="section-title">Individual Contractor Details</div>
            ${uniqueContractors.map((contractor, index) => {
              const contractorData = allContractorsData[contractor];
              if (!contractorData || contractorData.error) {
                return `
                  <div class="contractor-section">
                    <div class="contractor-header">
                      <div class="contractor-name">${contractor}</div>
                      <div style="color: #EF4444; font-size: 0.9rem;">Data not available</div>
                </div>
                </div>
                `;
              }
             
              const attendanceRate = contractorData.totalDays > 0 ? ((contractorData.presentDays / contractorData.totalDays) * 100).toFixed(1) : 0;
             
              return `
                <div class="contractor-section">
                  <div class="contractor-header">
                    <div class="contractor-name">${contractor}</div>
                    <div class="contractor-stats">
                <div class="stat-item">
                        <div class="stat-value">${contractorData.presentDays}</div>
                        <div class="stat-label">Present Days</div>
                </div>
                <div class="stat-item">
                        <div class="stat-value">${contractorData.absentDays}</div>
                        <div class="stat-label">Absent Days</div>
                </div>
                <div class="stat-item">
                        <div class="stat-value">${attendanceRate}%</div>
                        <div class="stat-label">Attendance Rate</div>
                </div>
                <div class="stat-item">
                        <div class="stat-value">${contractorData.totalDays}</div>
                        <div class="stat-label">Total Days</div>
                </div>
              </div>
            </div>
                 
                  <table class="contractor-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="status-cell status-present">Present</td>
                        <td class="status-cell">${contractorData.presentDays}</td>
                        <td class="status-cell">${attendanceRate}%</td>
                      </tr>
                      <tr>
                        <td class="status-cell status-absent">Absent</td>
                        <td class="status-cell">${contractorData.absentDays}</td>
                        <td class="status-cell">${(100 - parseFloat(attendanceRate)).toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
          </div>
              `;
            }).join('')}
          </div>
         
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Monthly_Attendance_Distribution_Comprehensive_All_Contractors_${selectedMonth}_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object
      URL.revokeObjectURL(url);
     
      console.log('✅ Comprehensive Monthly Attendance Distribution PDF generated successfully');
     
    } catch (error) {
      console.error('Error generating comprehensive Monthly Attendance Distribution PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to fetch Monthly Attendance data for a specific contractor
  const fetchMonthlyAttendanceForContractor = async (contractor) => {
    try {
      console.log(`🔄 Fetching Monthly Attendance data for contractor: ${contractor}`);
     
      // Format the selected month for API call
      const [year, month] = selectedMonth.split('-');
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
     
      // Fetch muster data
      const response = await fetch(`/server/attendance_muster_function?startDate=${startDate}&endDate=${endDate}&source=both`);
      const data = await response.json();
     
      if (data && data.muster && data.muster.length > 0) {
        // Get employees under this contractor
        const employeesUnderContractor = await fetchEmployeesByContractor(contractor);
       
        if (employeesUnderContractor.length === 0) {
          return {
            presentDays: 0,
            absentDays: 0,
            totalDays: 0,
            attendanceRate: 0,
            error: false
          };
        }
       
        // Find indices of these employees in the muster data
        const filteredEmployeeIndices = [];
        data.employees.forEach((employee, empIndex) => {
          const employeeId = employee;
          if (employeesUnderContractor.includes(employeeId) ||
              employeesUnderContractor.includes(String(employeeId)) ||
              employeesUnderContractor.includes(Number(employeeId))) {
            filteredEmployeeIndices.push(empIndex);
          }
        });
       
        // Count attendance for this contractor
        let presentDays = 0;
        let absentDays = 0;
        let statusCounts = { Present: 0, Absent: 0, 'Half Day Present': 0, Other: 0 };
       
        data.muster.forEach((employeeAttendance, empIndex) => {
          if (!filteredEmployeeIndices.includes(empIndex)) {
            return; // Skip this employee
          }
         
          if (employeeAttendance && employeeAttendance.length > 0) {
            employeeAttendance.forEach((dayStatus) => {
              if (dayStatus === 'Present' || dayStatus === 'P') {
                presentDays += 1;
                statusCounts.Present += 1;
              } else if (dayStatus === 'Absent' || dayStatus === 'A') {
                absentDays += 1;
                statusCounts.Absent += 1;
              } else if (dayStatus === '0.5' || dayStatus === 0.5 || dayStatus === 'Half Day Present') {
                presentDays += 0.5;
                absentDays += 0.5;
                statusCounts['Half Day Present'] += 1;
              } else {
                statusCounts.Other += 1;
              }
            });
          }
        });
       
        const totalDays = presentDays + absentDays;
        const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;
       
        return {
          presentDays: Math.round(presentDays),
          absentDays: Math.round(absentDays),
          totalDays: Math.round(totalDays),
          attendanceRate: parseFloat(attendanceRate),
          error: false
        };
      } else {
        return {
          presentDays: 0,
          absentDays: 0,
          totalDays: 0,
          attendanceRate: 0,
          error: false
        };
      }
    } catch (error) {
      console.error(`❌ Error fetching attendance data for contractor ${contractor}:`, error);
      return {
        presentDays: 0,
        absentDays: 0,
        totalDays: 0,
        attendanceRate: 0,
        error: true
      };
    }
  };

  // Handle PDF Download for Last 7 Days Attendance Percentage
  // Handle PDF Download for Last 7 Days Attendance Percentage - Enhanced with All Contractors Data
  const handleDownloadAttendanceTrendPDF = async () => {
    try {
      // Get current date for filename
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0];
      const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
     
      console.log('🔄 Starting comprehensive Last 7 Days Attendance Percentage PDF generation...');
     
      // Fetch all contractors data for comprehensive report
      const allContractorsData = {};
      const contractorsList = [];
     
      // Get all contractors from the current contractor list
      if (contractorList && contractorList.length > 0) {
        // Filter out 'All' option as it's just a filter, not an actual contractor
        const actualContractors = contractorList.filter(contractor => contractor !== 'All');
        contractorsList.push(...actualContractors);
        console.log('📋 Contractors from state (excluding All):', actualContractors);
      }
     
      // Also get contractors from employee data
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/server/cms_function/employees?returnAll=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
       
        if (data.status === 'success' && data.data && data.data.employees) {
          const employees = data.data.employees;
          const employeeContractors = [...new Set(
            employees
              .map(emp => emp.contractor)
              .filter(contractor => contractor && contractor.trim() !== '')
          )];
          contractorsList.push(...employeeContractors);
          console.log('📋 Contractors from employee data:', employeeContractors);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch contractors from employee data:', error);
      }
     
      console.log('📋 All contractors before deduplication:', contractorsList);
     
      // Remove duplicates and get unique contractors with advanced deduplication
      const uniqueContractors = [];
      contractorsList.forEach(contractor => {
        if (!contractor || contractor.trim() === '') return;
       
        const normalizedContractor = contractor.trim();
        const isDuplicate = uniqueContractors.some(existing => {
          const normalizedExisting = existing.trim();
          // Check for exact match or if one contains the other (case insensitive)
          return normalizedExisting.toLowerCase() === normalizedContractor.toLowerCase() ||
                 normalizedExisting.toLowerCase().includes(normalizedContractor.toLowerCase()) ||
                 normalizedContractor.toLowerCase().includes(normalizedExisting.toLowerCase());
        });
       
        if (!isDuplicate) {
          uniqueContractors.push(normalizedContractor);
        }
      });
     
      console.log('📊 Unique contractors found after advanced deduplication:', uniqueContractors);
      console.log('📊 Total contractors count:', uniqueContractors.length);
     
      // Fetch attendance trend data for each contractor
      for (const contractor of uniqueContractors) {
        try {
          console.log(`🔄 Fetching attendance trend data for contractor: ${contractor}`);
          const contractorData = await fetchAttendanceTrendForContractor(contractor);
          allContractorsData[contractor] = contractorData;
        } catch (error) {
          console.error(`❌ Error fetching attendance trend data for contractor ${contractor}:`, error);
          allContractorsData[contractor] = {
            trendData: [],
            averageAttendance: 0,
            highestDay: 0,
            lowestDay: 0,
            error: true
          };
        }
      }
     
      // Calculate statistics from current attendance trend data
      const totalDays = attendanceTrendData.length;
      const averageAttendance = totalDays > 0 ? (attendanceTrendData.reduce((sum, day) => sum + day.value, 0) / totalDays).toFixed(1) : 0;
      const highestDay = totalDays > 0 ? Math.max(...attendanceTrendData.map(day => day.value)) : 0;
      const lowestDay = totalDays > 0 ? Math.min(...attendanceTrendData.map(day => day.value)) : 0;
      const highestDayName = totalDays > 0 ? attendanceTrendData.find(day => day.value === highestDay)?.label : '';
      const lowestDayName = totalDays > 0 ? attendanceTrendData.find(day => day.value === lowestDay)?.label : '';
     
      // Create comprehensive HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Last 7 Days Attendance Percentage Comprehensive Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 25px;
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(10, 65, 177, 0.3);
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 2.5rem;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 1.2rem;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 25px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .report-info h3 {
              margin: 0 0 20px 0;
              color: #0a41b1;
              font-size: 1.4rem;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #0a41b1;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 0.9rem;
              margin-bottom: 5px;
            }
            .info-value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 700;
            }
            .section {
              background: white;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 25px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 700;
              color: #0a41b1;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .attendance-summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              border: 2px solid transparent;
              transition: all 0.3s ease;
            }
            .summary-card.average {
              background: linear-gradient(135deg, #0a41b1 0%, #3cd9e8 100%);
              color: white;
            }
            .summary-card.highest {
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
            }
            .summary-card.lowest {
              background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
              color: white;
            }
            .summary-value {
              font-size: 2.5rem;
              font-weight: 800;
              margin-bottom: 10px;
            }
            .summary-label {
              font-size: 1.1rem;
              font-weight: 600;
              opacity: 0.9;
            }
            .summary-day {
              font-size: 1rem;
              font-weight: 500;
              margin-top: 5px;
              opacity: 0.8;
            }
            .trend-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
              margin-top: 20px;
            }
            .trend-table th {
              background: linear-gradient(135deg, #0a41b1, #3cd9e8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9rem;
            }
            .trend-table td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .trend-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .day-cell {
              font-weight: 600;
              color: #0a41b1;
            }
            .percentage-cell {
              text-align: center;
              font-weight: 700;
              font-size: 1.1rem;
            }
            .percentage-excellent {
              color: #10B981;
            }
            .percentage-good {
              color: #3B82F6;
            }
            .percentage-average {
              color: #F59E0B;
            }
            .percentage-poor {
              color: #EF4444;
            }
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #e2e8f0;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 5px;
            }
            .progress-fill {
              height: 100%;
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            .contractor-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .contractor-header {
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              padding: 15px 20px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #0a41b1;
            }
            .contractor-name {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0a41b1;
              margin: 0 0 5px 0;
            }
            .contractor-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 10px;
            }
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0a41b1;
            }
            .stat-label {
              font-size: 0.8rem;
              color: #64748b;
              margin-top: 2px;
            }
            .contractor-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-top: 15px;
            }
            .contractor-table th {
              background: #64748b;
              color: white;
              padding: 10px 8px;
              text-align: center;
              font-weight: 600;
            }
            .contractor-table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-align: center;
            }
            .contractor-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { margin-bottom: 20px; }
              .trend-table, .contractor-table { font-size: 0.8rem; }
              .trend-table th, .trend-table td, .contractor-table th, .contractor-table td { padding: 6px 4px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Last 7 Days Attendance Percentage Comprehensive Report</h1>
            <p>Generated on ${currentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
         
          <div class="report-info">
            <h3>Executive Summary</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Period</span>
                <span class="info-value">Last 7 Days</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Contractors</span>
                <span class="info-value">${uniqueContractors.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Average Attendance</span>
                <span class="info-value">${averageAttendance}%</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Points</span>
                <span class="info-value">${totalDays} days</span>
              </div>
            </div>
          </div>
         
          <!-- Overall Summary Section -->
          <div class="section">
            <div class="section-title">Overall Attendance Performance Summary</div>
            <div class="attendance-summary">
              <div class="summary-card average">
                <div class="summary-value">${averageAttendance}%</div>
                <div class="summary-label">Average Attendance</div>
                <div class="summary-day">Last 7 Days</div>
              </div>
              <div class="summary-card highest">
                <div class="summary-value">${highestDay}%</div>
                <div class="summary-label">Highest Day</div>
                <div class="summary-day">${highestDayName}</div>
              </div>
              <div class="summary-card lowest">
                <div class="summary-value">${lowestDay}%</div>
                <div class="summary-label">Lowest Day</div>
                <div class="summary-day">${lowestDayName}</div>
              </div>
            </div>
          </div>
         
          <!-- Overall Trend Table -->
          <div class="section">
            <div class="section-title">Overall Daily Attendance Breakdown</div>
            <table class="trend-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Attendance %</th>
                  <th>Performance</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceTrendData.map((day, index) => {
                  const performance = day.value >= 90 ? 'excellent' :
                                   day.value >= 80 ? 'good' :
                                   day.value >= 70 ? 'average' : 'poor';
                  const performanceText = day.value >= 90 ? 'Excellent' :
                                        day.value >= 80 ? 'Good' :
                                        day.value >= 70 ? 'Average' : 'Poor';
                 
                  return `
                    <tr>
                      <td class="day-cell">${day.label}</td>
                      <td class="percentage-cell percentage-${performance}">${day.value}%</td>
                      <td class="percentage-cell percentage-${performance}">${performanceText}</td>
                      <td>
                        <div class="progress-bar">
                          <div class="progress-fill" style="width: ${day.value}%; background: ${
                            day.value >= 90 ? '#10B981' :
                            day.value >= 80 ? '#3B82F6' :
                            day.value >= 70 ? '#F59E0B' : '#EF4444'
                          }"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
         
          <!-- Individual Contractor Details -->
          <div class="section page-break">
            <div class="section-title">Individual Contractor Performance</div>
            ${uniqueContractors.map((contractor, index) => {
              const contractorData = allContractorsData[contractor];
              if (!contractorData || contractorData.error) {
                return `
                  <div class="contractor-section">
                    <div class="contractor-header">
                      <div class="contractor-name">${contractor}</div>
                      <div style="color: #EF4444; font-size: 0.9rem;">Data not available</div>
                </div>
                </div>
                `;
              }
             
              return `
                <div class="contractor-section">
                  <div class="contractor-header">
                    <div class="contractor-name">${contractor}</div>
              <div class="contractor-stats">
                <div class="stat-item">
                        <div class="stat-value">${contractorData.averageAttendance}%</div>
                  <div class="stat-label">Average</div>
                </div>
                <div class="stat-item">
                        <div class="stat-value">${contractorData.highestDay}%</div>
                  <div class="stat-label">Best Day</div>
                </div>
                <div class="stat-item">
                        <div class="stat-value">${contractorData.lowestDay}%</div>
                  <div class="stat-label">Worst Day</div>
                </div>
              </div>
            </div>
                 
                  <table class="contractor-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Attendance %</th>
                        <th>Performance</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${contractorData.trendData.map((day, dayIndex) => {
                        const performance = day.value >= 90 ? 'excellent' :
                                         day.value >= 80 ? 'good' :
                                         day.value >= 70 ? 'average' : 'poor';
                        const performanceText = day.value >= 90 ? 'Excellent' :
                                              day.value >= 80 ? 'Good' :
                                              day.value >= 70 ? 'Average' : 'Poor';
                       
                        return `
                          <tr>
                            <td class="day-cell">${day.label}</td>
                            <td class="percentage-cell percentage-${performance}">${day.value}%</td>
                            <td class="percentage-cell percentage-${performance}">${performanceText}</td>
                            <td>
                              <div class="progress-bar">
                                <div class="progress-fill" style="width: ${day.value}%; background: ${
                                  day.value >= 90 ? '#10B981' :
                                  day.value >= 80 ? '#3B82F6' :
                                  day.value >= 70 ? '#F59E0B' : '#EF4444'
                                }"></div>
          </div>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
            }).join('')}
          </div>
         
          <div class="footer">
            <p>This comprehensive report was generated automatically by the Contractor Management System</p>
            <p>Includes data for all contractors with individual performance breakdowns</p>
            <p>For questions or support, please contact your system administrator</p>
          </div>
        </body>
        </html>
      `;
     
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
     
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Last_7_Days_Attendance_Percentage_Comprehensive_All_Contractors_${dateString}_${timeString}.html`;
     
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
     
      // Clean up the URL object
      URL.revokeObjectURL(url);
     
      console.log('✅ Comprehensive Last 7 Days Attendance Percentage PDF generated successfully');
     
    } catch (error) {
      console.error('Error generating comprehensive Last 7 Days Attendance Percentage PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to fetch Attendance Trend data for a specific contractor
  const fetchAttendanceTrendForContractor = async (contractor) => {
    try {
      console.log(`🔄 Fetching Attendance Trend data for contractor: ${contractor}`);
     
      // Calculate last 7 days
      const today = new Date();
      const last7Days = [];
     
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days.push({
          date: date.toISOString().split('T')[0],
          day: dayName
        });
      }
     
      // Fetch attendance data for each day
      const attendancePromises = last7Days.map(async ({ date, day }) => {
        try {
          const response = await fetch(`/server/attendance_muster_function?startDate=${date}&endDate=${date}&source=both`);
          const data = await response.json();
         
          if (data && data.muster && data.muster.length > 0) {
            // Get employees under this contractor
            const employeesUnderContractor = await fetchEmployeesByContractor(contractor);
           
            if (employeesUnderContractor.length === 0) {
              return { day, present: 0 };
            }
           
            // Find indices of these employees in the muster data
            const filteredEmployeeIndices = [];
            data.employees.forEach((employee, empIndex) => {
              const employeeId = employee;
              if (employeesUnderContractor.includes(employeeId) ||
                  employeesUnderContractor.includes(String(employeeId)) ||
                  employeesUnderContractor.includes(Number(employeeId))) {
                filteredEmployeeIndices.push(empIndex);
              }
            });
           
            // Count attendance for this contractor
            let presentCount = 0;
            const totalEmployees = filteredEmployeeIndices.length;
           
            if (totalEmployees > 0) {
              data.muster.forEach((employeeAttendance, empIndex) => {
                if (!filteredEmployeeIndices.includes(empIndex)) {
                  return; // Skip this employee
                }
               
                if (employeeAttendance && employeeAttendance.length > 0) {
                  const dayStatus = employeeAttendance[0]; // First (and only) day in the range
                  if (dayStatus === 'Present' || dayStatus === 'P') {
                    presentCount += 1; // Full day present
                  } else if (dayStatus === 'Half Day Present' || dayStatus === '0.5' || dayStatus === 0.5) {
                    presentCount += 0.5; // Half day present
                  }
                }
              });
            }
           
            // Calculate percentage
            const attendancePercentage = totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0;
            return { day, present: Math.round(attendancePercentage * 100) / 100 };
          } else {
            return { day, present: 0 };
          }
        } catch (err) {
          console.error(`Failed to fetch attendance for ${date}:`, err);
          return { day, present: 0 };
        }
      });
     
      const results = await Promise.all(attendancePromises);
     
      // Calculate statistics
      const averageAttendance = results.length > 0 ? (results.reduce((sum, day) => sum + day.present, 0) / results.length).toFixed(1) : 0;
      const highestDay = results.length > 0 ? Math.max(...results.map(day => day.present)) : 0;
      const lowestDay = results.length > 0 ? Math.min(...results.map(day => day.present)) : 0;
     
      return {
        trendData: results,
        averageAttendance: parseFloat(averageAttendance),
        highestDay: Math.round(highestDay),
        lowestDay: Math.round(lowestDay),
        error: false
      };
    } catch (error) {
      console.error(`❌ Error fetching attendance trend data for contractor ${contractor}:`, error);
      return {
        trendData: [],
        averageAttendance: 0,
        highestDay: 0,
        lowestDay: 0,
        error: true
      };
    }
  };

  useEffect(() => {
    fetchContractorScoringData();
  }, []);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      // Destroy all charts to prevent memory leaks
      if (diversityChartRef.current && diversityChartRef.current.chart) {
        diversityChartRef.current.chart.destroy();
      }
      if (attendanceChartRef.current && attendanceChartRef.current.chart) {
        attendanceChartRef.current.chart.destroy();
      }
      if (shiftChartRef.current && shiftChartRef.current.chart) {
        shiftChartRef.current.chart.destroy();
      }

      if (clAdditionChartRef.current && clAdditionChartRef.current.chart) {
        clAdditionChartRef.current.chart.destroy();
      }
      if (clAttritionChartRef.current && clAttritionChartRef.current.chart) {
        clAttritionChartRef.current.chart.destroy();
      }
    };
  }, []);

  // Function to refresh all dashboard data
  const refreshAllDashboardData = async () => {
    console.log('🔄 Refreshing all dashboard data including real-time shift data...');
   
    // Refresh all data sources including shift data
  await Promise.all([
    fetchContractorScoringData(),
    fetchClAdditionTrend(),
      fetchClAttritionTrend(),
      // Add shift data refresh
      (async () => {
        try {
          console.log('🔄 Refreshing real-time shift data...');
          const today = new Date();
          const last7Days = [];
         
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
           
            last7Days.push({ date: dateStr, day: dayName });
          }
         
          const dailyData = [];
         
          for (const { date, day } of last7Days) {
            try {
              const shiftmapsResponse = await fetch(`/server/Shiftmap_function/shiftmaps?date=${date}`);
              const shiftmapsData = await shiftmapsResponse.json();

              if (shiftmapsData.status === 'success' && shiftmapsData.data && shiftmapsData.data.shiftmaps) {
                const shiftmaps = shiftmapsData.data.shiftmaps || [];
                const dailyDistribution = {};
               
                shiftmaps.forEach(mapping => {
                  const shiftName = mapping.shiftName || mapping.assignedShift || 'Unknown';
                  const employeeId = mapping.employeeId;
                 
                  if (shiftName && employeeId) {
                    if (!dailyDistribution[shiftName]) {
                      dailyDistribution[shiftName] = 0;
                    }
                    dailyDistribution[shiftName]++;
                  }
                });

                dailyData.push({
                  date: day,
                  shifts: dailyDistribution
                });
              } else {
                dailyData.push({
                  date: day,
                  shifts: {}
                });
              }
            } catch (err) {
              console.error(`❌ Failed to fetch shift data for ${date}:`, err);
              dailyData.push({
                date: day,
                shifts: {}
              });
            }
          }
         
          setDailyShiftData(dailyData);
          console.log('✅ Real-time shift data refreshed successfully');
        } catch (err) {
          console.error('❌ Failed to refresh shift data:', err);
        }
      })()
  ]);
 
  // Force re-render of charts
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  };

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

  // Set loading to false after initial setup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Try to create CL charts after initial load
      setTimeout(() => {
        createCLCharts();
      }, 500);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'white',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Animated Background */}
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
                <button
                  className="dashboard-btn dashboard-interactive-btn"
                  onClick={refreshAllDashboardData}
                  title="Refresh Dashboard Data"
                  style={{padding: '8px 12px'}}
                >
                  <Activity size={20} />
                </button>
                <img src={userAvatar} alt="User" className="cms-user-avatar" />
                <div className="cms-logout-icon">
                  <Button title="" className="cms-logout-btn" />
                </div>
              </div>
            </div>
          </header>

          {/* Contractor Filter Icon */}
          <div className="dashboard-filter-icon-container">
            <div
              className="dashboard-filter-icon-btn"
              onClick={() => setShowContractorDropdown(!showContractorDropdown)}
              title="Filter by Contractor"
            >
              <Filter size={20} />
            </div>
           
            {/* Contractor Filter Dropdown */}
            {showContractorDropdown && (
              <div className="dashboard-filter-dropdown-panel">
                <div className="dashboard-filter-dropdown-header">
                  <h3>Filter by Contractor</h3>
                  <button
                    className="dashboard-filter-close-btn"
                    onClick={() => setShowContractorDropdown(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="dashboard-filter-search-container">
                  <input
                    type="text"
                    placeholder="Search contractors..."
                    className="dashboard-filter-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="dashboard-filter-dropdown-content">
                  <div className="dashboard-filter-option" onClick={() => {
                        setSelectedContractor('all');
                    setShowContractorDropdown(false);
                    setSearchTerm('');
                  }}>
                    <span>All Contractors</span>
                    {selectedContractor === 'all' && <CheckCircle size={16} />}
                  </div>
                  {contractors
                    .filter(c => c !== 'All')
                    .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((contractor) => (
                    <div
                      key={contractor}
                      className="dashboard-filter-option"
                      onClick={() => {
                        setSelectedContractor(contractor);
                        setShowContractorDropdown(false);
                        setSearchTerm('');
                      }}
                    >
                      <span>{contractor}</span>
                      {selectedContractor === contractor && <CheckCircle size={16} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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



          {/* Dashboard Header */}
         

          {/* Dashboard Content */}
          <main className="cms-dashboard-content">
            {/* Row 1: Animated Stats Cards */}
            <div className="dashboard-stats-grid">
              <div
                className="dashboard-stat-card dashboard-animated-card"
                style={{ cursor: 'pointer' }}
                onClick={async (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 10
                  });
                  await fetchContractorDataForTooltip();
                  setShowContractorTooltip(true);
                }}
              >
                <div className="dashboard-stat-header">
                  <div>
                    <div className="dashboard-stat-value dashboard-pulse-animation">{animatedStats.total}</div>
                    <div className="dashboard-stat-label">Total Workmen</div>
                    <div className="dashboard-stat-change positive">
                      <TrendingUp size={16} /> +5% from last month
                    </div>
                  </div>
                  <div className="dashboard-stat-icon dashboard-gradient-bg-blue">
                    <Users size={28} />
                  </div>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill" style={{width: '75%'}}></div>
                </div>
              </div>

              <div
                className="dashboard-stat-card dashboard-animated-card"
                style={{ cursor: 'pointer' }}
                onClick={async (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPresentTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 10
                  });
                  
                  // Debug: Log imported data
                  const importedDataStr = localStorage.getItem('importedAttendanceData');
                  if (importedDataStr) {
                    const importedData = JSON.parse(importedDataStr) || [];
                    console.log('🔍 DEBUG: Imported data in localStorage:', importedData.length, 'records');
                    console.log('🔍 DEBUG: Sample imported record:', importedData[0]);
                    
                    const today = new Date().toISOString().split('T')[0];
                    const toYMD = (s) => {
                      if (!s) return '';
                      const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
                      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
                      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                      const d = new Date(s);
                      return isNaN(d) ? '' : d.toISOString().slice(0,10);
                    };
                    const todaysImported = importedData.filter(r => toYMD(r.Date) === today);
                    console.log('🔍 DEBUG: Today\'s imported records:', todaysImported.length);
                    console.log('🔍 DEBUG: Today\'s imported data:', todaysImported);
                  } else {
                    console.log('🔍 DEBUG: No imported data found in localStorage');
                  }
                  
                  await fetchPresentEmployeesData();
                  setShowPresentTooltip(true);
                }}
                title="Click to view present employee details"
              >
                <div className="dashboard-stat-header">
                  <div>
                    <div className="dashboard-stat-value dashboard-pulse-animation">{animatedStats.present}</div>
                    <div className="dashboard-stat-label">Present Today (First In)</div>
                    <div className="dashboard-stat-change positive">
                      <TrendingUp size={16} /> {todayAttendance.total > 0 ? `${Math.round((todayAttendance.present / todayAttendance.total) * 100)}%` : '0%'} check-in rate
                    </div>
                   
                  </div>
                  <div className="dashboard-stat-icon dashboard-gradient-bg-green">
                    <CheckCircle size={28} />
                  </div>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill dashboard-green" style={{width: `${todayAttendance.total > 0 ? (todayAttendance.present / todayAttendance.total) * 100 : 0}%`}}></div>
                </div>
              </div>

              <div
                className="dashboard-stat-card dashboard-animated-card"
                style={{ cursor: 'pointer' }}
                onClick={async (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setAbsentTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 10
                  });
                  
                  // Debug: Log imported data for absent calculation
                  const importedDataStr = localStorage.getItem('importedAttendanceData');
                  if (importedDataStr) {
                    const importedData = JSON.parse(importedDataStr) || [];
                    console.log('🔍 DEBUG ABSENT: Imported data in localStorage:', importedData.length, 'records');
                    console.log('🔍 DEBUG ABSENT: Sample imported record:', importedData[0]);
                    
                    const today = new Date().toISOString().split('T')[0];
                    const toYMD = (s) => {
                      if (!s) return '';
                      const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
                      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
                      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                      const d = new Date(s);
                      return isNaN(d) ? '' : d.toISOString().slice(0,10);
                    };
                    const todaysImported = importedData.filter(r => toYMD(r.Date) === today);
                    console.log('🔍 DEBUG ABSENT: Today\'s imported records:', todaysImported.length);
                    console.log('🔍 DEBUG ABSENT: Today\'s imported data:', todaysImported);
                    
                    // Show which employees have FirstIN (present) vs no FirstIN (absent)
                    const presentFromImport = todaysImported.filter(r => r.FirstIN && String(r.FirstIN).trim() !== '');
                    const absentFromImport = todaysImported.filter(r => !r.FirstIN || String(r.FirstIN).trim() === '');
                    console.log('🔍 DEBUG ABSENT: Present from import:', presentFromImport.length, presentFromImport.map(r => r.EmployeeID));
                    console.log('🔍 DEBUG ABSENT: Absent from import:', absentFromImport.length, absentFromImport.map(r => r.EmployeeID));
                  } else {
                    console.log('🔍 DEBUG ABSENT: No imported data found in localStorage');
                  }
                  
                  await fetchAbsentEmployeesData();
                  setShowAbsentTooltip(true);
                }}
                title="Click to view absent employee details"
              >
                <div className="dashboard-stat-header">
                  <div>
                    <div className="dashboard-stat-value dashboard-pulse-animation">{animatedStats.absent}</div>
                    <div className="dashboard-stat-label">Absent Today (No Check-in)</div>
                    <div className="dashboard-stat-change negative">
                      <TrendingDown size={16} /> {todayAttendance.total > 0 ? `${Math.round((todayAttendance.absent / todayAttendance.total) * 100)}%` : '0%'} no-show rate
                    </div>
                    
                  </div>
                  <div className="dashboard-stat-icon dashboard-gradient-bg-red">
                    <User size={28} />
                  </div>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill dashboard-red" style={{width: `${todayAttendance.total > 0 ? (todayAttendance.absent / todayAttendance.total) * 100 : 0}%`}}></div>
              </div>
            </div>

            {/* Refresh Button for Attendance Data */}

              {/* Critical Incidents Card - moved to first row */}
              <div className="dashboard-stat-card dashboard-animated-card">
                <div className="dashboard-stat-header">
                  <div>
                    <div className="dashboard-stat-value dashboard-pulse-animation">{criticalIncidentsCount}</div>
                    <div className="dashboard-stat-label">Last 30 days Critical Incidents</div>
                    <div className="dashboard-stat-change negative">
                      <AlertTriangle size={16} /> Safety Alert
                  </div>
                  </div>
                  <div className="dashboard-stat-icon dashboard-gradient-bg-orange">
                    <AlertTriangle size={28} />
                </div>
                  </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill dashboard-orange" style={{width: '60%'}}></div>
                </div>
              </div>

              {/* EHS Violations Card - moved to first row */}
              <div className="dashboard-stat-card dashboard-animated-card">
                <div className="dashboard-stat-header">
                  <div>
                    <div className="dashboard-stat-value dashboard-pulse-animation">{ehsViolationsCount}</div>
                    <div className="dashboard-stat-label">Last 30 days EHS Violations</div>
                    <div className="dashboard-stat-change negative">
                      <Shield size={16} /> Compliance Alert
                  </div>
                </div>
                  <div className="dashboard-stat-icon dashboard-gradient-bg-purple">
                    <Shield size={28} />
              </div>
                </div>
                <div className="dashboard-progress-bar">
                  <div className="dashboard-progress-fill dashboard-purple" style={{width: '40%'}}></div>
                </div>
              </div>
            </div>


            {/* Row 3: Shift Distribution Card */}
            <div className="dashboard-shift-overview">
              <div className="dashboard-shift-header">
                <h3>Live Shift Distribution</h3>
                <div className="dashboard-shift-time">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="dashboard-shift-grid">
                {Object.entries(shiftDistribution)
                  .sort(([a], [b]) => {
                    // Define the desired order: A, B, C, D
                    const order = ['A', 'B', 'C', 'D'];
                    const aIndex = order.indexOf(a);
                    const bIndex = order.indexOf(b);
                   
                    // If both are in the order array, sort by their position
                    if (aIndex !== -1 && bIndex !== -1) {
                      return aIndex - bIndex;
                    }
                    // If only one is in the order array, prioritize it
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    // If neither is in the order array, sort alphabetically
                    return a.localeCompare(b);
                  })
                  .map(([shiftType, data], index) => {
                  // Generate colors dynamically based on shift type
                  const colorMap = {
                    'A': '#6BCF7F', // Green for A
                    'B': '#FFD93D', // Yellow for B
                    'C': '#4D96FF', // Blue for C
                    'D': '#9B59B6', // Purple for D
                  };
                 
                  const color = colorMap[shiftType] || '#4ECDC4'; // Default teal for other shifts
                 
                  return (
                    <div key={shiftType} className="dashboard-shift-card" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="dashboard-shift-indicator" style={{backgroundColor: color}}></div>
                      <div className="dashboard-shift-info">
                        <h4>{shiftType}</h4>
                        <p className="dashboard-shift-count">{data.attended}</p>
                        <div className="dashboard-shift-progress">
                          <div
                            className="dashboard-shift-progress-fill"
                            style={{
                              width: `${data.assigned > 0 ? (data.attended / data.assigned) * 100 : 0}%`,
                              backgroundColor: color
                            }}
                          ></div>
                        </div>
                        <div className="dashboard-shift-details">
                          <span className="dashboard-shift-attended">{data.attended} attended</span>
                          <span className="dashboard-shift-assigned">of {data.assigned} assigned</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Interactive Charts Grid */}
            <div className="dashboard-charts-mega-grid">
              {/* Monthly Attendance Distribution */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <Activity className="dashboard-chart-icon" size={20} />
                    Monthly Attendance Distribution (Muster Reports)
                  </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="dashboard-btn dashboard-interactive-btn"
                        onClick={() => {
                          // Force refresh the attendance data
                          console.log('Force refreshing attendance data for month:', selectedMonth, 'contractor:', selectedContractor);
                          setAttendancePieData([]); // Clear data first
                          // The useEffect will trigger when selectedMonth or selectedContractor changes
                          const [year, month] = selectedMonth.split('-');
                          const startDate = `${selectedMonth}-01`;
                          const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                         
                          // Manually trigger the fetch with contractor filtering
                          fetch(`/server/attendance_muster_function?startDate=${startDate}&endDate=${endDate}&source=both`)
                            .then(res => res.json())
                            .then(async (data) => {
                              console.log('Manual refresh - API Response:', data);
                              if (data && data.muster && data.muster.length > 0) {
                                let presentTotal = 0;
                                let absentTotal = 0;
                               
                                // Filter employees by selected contractor
                                let filteredEmployeeIndices = [];
                                if (selectedContractor === 'all') {
                                  filteredEmployeeIndices = data.muster.map((_, index) => index);
                                } else {
                                  // Get employees under the selected contractor
                                  const employeesUnderContractor = await fetchEmployeesByContractor(selectedContractor);
                                 
                                  if (employeesUnderContractor.length === 0) {
                                    console.log(`Manual refresh - No employees found under contractor ${selectedContractor}`);
                                    setAttendancePieData([
                                      { name: 'Present', value: 0, color: '#4ECDC4' },
                                      { name: 'Absent', value: 0, color: '#FF6B6B' },
                                    ]);
                                    return;
                                  }
                                 
                                  // Find indices of these employees in the muster data
                                  data.employees.forEach((employeeId, empIndex) => {
                                    if (employeesUnderContractor.includes(employeeId)) {
                                      filteredEmployeeIndices.push(empIndex);
                                    }
                                  });
                                }
                               
                                console.log('Manual refresh - Filtered employee indices:', filteredEmployeeIndices);
                               
                                data.muster.forEach((employeeAttendance, empIndex) => {
                                  // Only process employees that belong to the selected contractor
                                  if (!filteredEmployeeIndices.includes(empIndex)) {
                                    return; // Skip this employee
                                  }
                                 
                                  if (employeeAttendance && employeeAttendance.length > 0) {
                                    employeeAttendance.forEach((dayStatus) => {
                                      if (dayStatus === 'Present' || dayStatus === 'P') {
                                        presentTotal += 1;
                                      } else if (dayStatus === 'Absent' || dayStatus === 'A') {
                                        absentTotal += 1;
                                      } else if (dayStatus === '0.5' || dayStatus === 0.5 || dayStatus === 'Half Day Present') {
                                        presentTotal += 0.5;
                                        absentTotal += 0.5;
                                      }
                                    });
                                  }
                                });
                               
                                const newPieData = [
                                  { name: 'Present', value: Math.round(presentTotal), color: '#4ECDC4' },
                                  { name: 'Absent', value: Math.round(absentTotal), color: '#FF6B6B' },
                                ];
                               
                                console.log('Manual refresh - Setting data:', newPieData);
                                setAttendancePieData(newPieData);
                              }
                            })
                            .catch(err => console.error('Manual refresh failed:', err));
                        }}
                        title="Refresh Attendance Data"
                      >
                        <Zap size={20} />
                      </button>
                      <button
                        className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                        onClick={async () => {
                          console.log('=== DEBUG BUTTON CLICKED ===');
                          try {
                            const today = new Date().toISOString().split('T')[0];
                            console.log('Testing debug endpoint for today:', today);
                            
                            const response = await fetch(`/server/importattendance_function/attendance/debug`);
                            const debugData = await response.json();
                            console.log('Debug endpoint response:', debugData);
                            
                            // Also test the regular attendance endpoint
                            const attendanceResponse = await fetch(`/server/importattendance_function/attendance?startDate=${today}&endDate=${today}&perPage=1000`);
                            const attendanceData = await attendanceResponse.json();
                            console.log('Regular attendance endpoint response:', attendanceData);
                            
                            alert(`Debug Results:\n\nDebug Endpoint:\n- Total Records: ${debugData.debug?.totalRecords || 0}\n- Records with FirstIn: ${debugData.debug?.recordsWithFirstIn || 0}\n\nRegular Endpoint:\n- Records Returned: ${attendanceData.data?.attendanceRecords?.length || 0}\n\nCheck console for detailed logs.`);
                          } catch (error) {
                            console.error('Debug button error:', error);
                            alert('Debug failed: ' + error.message);
                          }
                        }}
                        title="Debug Attendance Data"
                      >
                        <Activity size={20} />
                      </button>
                      <button
                        className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                        onClick={handleDownloadMonthlyAttendancePDF}
                        title="Download Monthly Attendance Distribution PDF"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10,9 9,9 8,9"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="dashboard-chart-controls">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="dashboard-month-filter"
                    />
                    <select
                      value={selectedContractor}
                      onChange={(e) => setSelectedContractor(e.target.value)}
                      className="dashboard-month-filter"
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="all">All Contractors</option>
                      {contractorList.length > 0 ? (
                        contractorList.map((contractor, index) => (
                          <option key={contractor} value={contractor}>
                            {contractor}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading contractors...</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  {isAttendanceLoading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#4facfe',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      Loading attendance data...
                    </div>
                  ) : attendancePieData ? (
                    <canvas ref={diversityChartRef} width={350} height={300}></canvas>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#64748b',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ marginBottom: '10px' }}>No attendance data available for the selected month</div>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                          Present: 0 (0%) | Absent: 0 (0%)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Trend */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <BarChart3 className="dashboard-chart-icon" size={20} />
                    Last 7 Days Attendance Percentage
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="dashboard-btn dashboard-interactive-btn"
                      onClick={() => {
                        // Trigger a re-fetch of the trend data
                            console.log('Refreshing attendance trend data for contractor:', selectedContractorTrend);
                        setAttendanceTrendData([]); // Clear data first
                            // The useEffect will trigger when selectedContractorTrend changes
                      }}
                        title="Refresh Attendance Trend"
                    >
                        <Target size={20} />
                    </button>
                    <button
                      className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                      onClick={handleDownloadAttendanceTrendPDF}
                      title="Download Last 7 Days Attendance Percentage PDF"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </button>
                  </div>
                  </div>
                  <div className="dashboard-chart-controls">
                    <select
                      value={selectedContractorTrend}
                      onChange={(e) => setSelectedContractorTrend(e.target.value)}
                      className="dashboard-month-filter"
                    >
                      <option value="all">All Contractors</option>
                      {contractorList.length > 0 ? (
                        contractorList.map((contractor, index) => (
                          <option key={contractor} value={contractor}>
                            {contractor}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading contractors...</option>
                      )}
                    </select>
                    <div style={{fontSize: '12px', color: '#666', marginLeft: '10px', alignSelf: 'center'}}>
                      {selectedContractorTrend !== 'all' ? `Filtered by: ${selectedContractorTrend}` : 'All Contractors'}
                    </div>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  {isTrendLoading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#4facfe',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      Loading trend data...
                    </div>
                  ) : (
                    <canvas ref={attendanceChartRef} width={350} height={300}></canvas>
                  )}
                </div>
              </div>

              {/* Daily Shift Distribution */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <Clock className="dashboard-chart-icon" size={20} />
                    {Object.values(shiftDistribution).reduce((sum, shift) => sum + (shift.assigned || 0), 0) > 0
                      ? 'General Shift - L-Shaped Daily Employee Count'
                      : 'General Shift - Daily Employee Count (No Assignments)'}
                  </h3>
                  <button
                    className="dashboard-btn dashboard-interactive-btn"
                    onClick={() => {
                      // Trigger a re-fetch of the daily shift data
                        console.log('Refreshing shift data...');
                        setDailyShiftData([]);
                        setShiftDistribution({});
                        // Force re-fetch by triggering the useEffects
                        setTimeout(() => {
                          // Re-trigger the shift data fetch
                          const fetchDailyShiftData = async () => {
                            try {
                              console.log('Re-fetching daily shift data...');
                             
                              // Calculate last 7 days
                              const today = new Date();
                              const last7Days = [];
                             
                              for (let i = 6; i >= 0; i--) {
                                const date = new Date(today);
                                date.setDate(today.getDate() - i);
                                const dateStr = date.toISOString().split('T')[0];
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                               
                                last7Days.push({ date: dateStr, day: dayName });
                              }
                             
                              // First, get all available shifts from the shift module
                              const shiftsResponse = await fetch('/server/Shift_function/shifts');
                              const shiftsData = await shiftsResponse.json();
                             
                              let availableShifts = [];
                              if (shiftsData.status === 'success' && shiftsData.data && shiftsData.data.shifts) {
                                availableShifts = shiftsData.data.shifts.map(shift => shift.shiftName).filter(Boolean);
                                availableShifts = [...new Set(availableShifts)];
                                console.log('Available shifts from shift module (deduplicated):', availableShifts);
                              }
                             
                              // If no shifts found, use empty array instead of hardcoded names
                              if (availableShifts.length === 0) {
                                availableShifts = [];
                                console.log('No shifts found in database, using empty array');
                              }
                             
                              // Fetch shift data for each day
                              const dailyData = [];
                             
                              for (const { date, day } of last7Days) {
                                try {
                                  // Fetch shift mappings for this specific date
                                  const shiftmapsResponse = await fetch('/server/Shiftmap_function/shiftmaps');
                                  const shiftmapsData = await shiftmapsResponse.json();

                                  if (shiftmapsData.status === 'success') {
                                    const shiftmaps = shiftmapsData.data.shiftmaps || [];

                                    // Initialize daily shift distribution with all available shifts
                                    const dailyDistribution = {};
                                    availableShifts.forEach(shiftName => {
                                      dailyDistribution[shiftName] = 0;
                                    });

                                    // Process shift mappings for this specific date
                                    console.log(`Processing shift mappings for date: ${date}`);
                                    console.log('Available shift mappings:', shiftmaps.length);
                                   
                                    shiftmaps.forEach(mapping => {
                                      const assignedShift = mapping.assignedShift;
                                      const actualShift = mapping.actualShift;
                                      const fromDate = mapping.fromdate;
                                      const toDate = mapping.todate;

                                      console.log('Mapping:', { assignedShift, fromDate, toDate, date });

                                      // Check if this mapping covers the current date
                                      if (assignedShift) {
                                        // If we have date range, check if current date is within the mapping period
                                        if (fromDate && toDate) {
                                        const currentDate = new Date(date);
                                        const startDate = new Date(fromDate);
                                        const endDate = new Date(toDate);
                                       
                                        // Check if current date is within the mapping period
                                        if (currentDate >= startDate && currentDate <= endDate) {
                                            // Count based on assigned shift
                                            if (dailyDistribution.hasOwnProperty(assignedShift)) {
                                              dailyDistribution[assignedShift]++;
                                              console.log(`Added to ${assignedShift} (date range match): ${dailyDistribution[assignedShift]}`);
                                            }
                                          }
                                        } else {
                                          // If no date range, count all mappings for this shift
                                          if (dailyDistribution.hasOwnProperty(assignedShift)) {
                                          dailyDistribution[assignedShift]++;
                                            console.log(`Added to ${assignedShift} (no date range): ${dailyDistribution[assignedShift]}`);
                                          }
                                        }
                                      }
                                    });

                                    dailyData.push({
                                      date: day,
                                      shifts: dailyDistribution
                                    });
                                  } else {
                                    // If API fails, create empty data for all shifts
                                    const emptyDistribution = {};
                                    availableShifts.forEach(shiftName => {
                                      emptyDistribution[shiftName] = 0;
                                    });
                                    dailyData.push({
                                      date: day,
                                      shifts: emptyDistribution
                                    });
                                  }
                                } catch (err) {
                                  console.error(`Failed to fetch shift data for ${date}:`, err);
                                  // Create empty data for all shifts
                                  const emptyDistribution = {};
                                  availableShifts.forEach(shiftName => {
                                    emptyDistribution[shiftName] = 0;
                                  });
                                  dailyData.push({
                                    date: day,
                                    shifts: emptyDistribution
                                  });
                                }
                              }
                             
                              console.log('Daily shift data with real shifts:', dailyData);
                             
                              // If no real data found, generate sample data for the available shifts
                              if (dailyData.every(day => Object.values(day.shifts).every(count => count === 0))) {
                                console.log('No real shift data found, generating sample data for available shifts...');
                                const sampleDailyData = last7Days.map(({ day }, dayIndex) => {
                                  const sampleShifts = {};
                                  availableShifts.forEach((shiftName, shiftIndex) => {
                                    // Generate different sample data for each shift and day
                                    const baseCount = 5 + (shiftIndex * 2);
                                    const variation = Math.floor(Math.random() * 6) - 3;
                                    sampleShifts[shiftName] = Math.max(1, baseCount + variation);
                                  });
                                  return {
                                  date: day,
                                    shifts: sampleShifts
                                  };
                                });
                                setDailyShiftData(sampleDailyData);
                              } else {
                                setDailyShiftData(dailyData);
                              }
                             
                            } catch (err) {
                              console.error('Failed to fetch daily shift data:', err);
                              setDailyShiftData([]);
                            }
                          };
                         
                          fetchDailyShiftData();
                        }, 100);
                      }}
                      title="Refresh Shift Data"
                    >
                      <Star size={20} />
                    </button>
                    <button
                      className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                      onClick={handleDownloadGeneralShiftPDF}
                      title="Download General Shift Daily Employee Count PDF"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dashboard-chart-controls">
                    <select
                      value={selectedContractorShift}
                      onChange={(e) => setSelectedContractorShift(e.target.value)}
                      className="dashboard-month-filter"
                      style={{ marginRight: '10px' }}
                    >
                      <option value="all">All Contractors</option>
                      {contractorList.length > 0 ? (
                        contractorList.map((contractor, index) => (
                          <option key={contractor} value={contractor}>
                            {contractor}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading contractors...</option>
                      )}
                    </select>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="dashboard-month-filter"
                      style={{ marginRight: '10px' }}
                    >
                      <option value="all">All Shifts</option>
                      {shiftList.length > 0 ? (
                        shiftList.map((shift, index) => (
                          <option key={shift} value={shift}>
                            {shift}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading shifts...</option>
                      )}
                    </select>
                    <div style={{fontSize: '12px', color: '#666', marginLeft: '10px', alignSelf: 'center'}}>
                      General shift data: {dailyShiftData.length} days | Total employees: {Object.values(shiftDistribution).reduce((sum, shift) => sum + (shift.attended || 0), 0)}
                    </div>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  <canvas ref={shiftChartRef} width={350} height={300}></canvas>
                </div>
              </div>

              {/* Contractor Heatmap */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <Shield className="dashboard-chart-icon" size={20} />
                    Contractor Performance Scoring
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="dashboard-btn dashboard-interactive-btn"
                      onClick={() => {
                        // Trigger a re-fetch of the contractor scoring data
                        fetchContractorScoringData();
                      }}
                      title="Refresh Contractor Scoring"
                    >
                      <Activity size={20} />
                    </button>
                    <button
                      className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                      onClick={handleDownloadContractorScoringPDF}
                      title="Download Contractor Performance Scoring PDF"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </button>
                  </div>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  {isScoringLoading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#4facfe',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      Loading contractor scoring data...
                    </div>
                  ) : contractorScoringData.length > 0 ? (
                    <div className="contractor-scoring-table-container">
                      <table className="contractor-scoring-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Contractor</th>
                            <th>Employees</th>
                            <th>CIR Count</th>
                            <th>EHS Violations</th>
                            <th>Overall Score</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contractorScoringData.map((contractor, index) => (
                            <tr key={index} className={`scoring-row score-${Math.floor(contractor.overallScore / 20)}`}>
                              <td className="rank-cell">
                                <div className="rank-badge">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="contractor-name">{contractor.contractor}</td>
                              <td className="employee-count-cell">
                                <div className="employee-count-display">
                                  <span className="employee-count-value">{contractor.employeeCount}</span>
                                  <div className="employee-count-label">employees</div>
                                </div>
                              </td>
                              <td className="cir-cell">
                                <div className="metric-display">
                                  <span className="metric-count">{contractor.cirCount}</span>
                                  <span className="metric-score">({contractor.cirScore})</span>
                                  <div className="metric-remark">{contractor.cirRemark}</div>
                                </div>
                              </td>
                              <td className="ehs-cell">
                                <div className="metric-display">
                                  <span className="metric-count">{contractor.ehsCount}</span>
                                  <span className="metric-score">({contractor.ehsScore})</span>
                                  <div className="metric-remark">{contractor.ehsRemark}</div>
                                </div>
                              </td>
                              <td className="overall-score-cell">
                                <div className="score-display">
                                  <span className="score-value">{contractor.overallScore}</span>
                                  <div className="score-bar">
                                    <div
                                      className="score-fill"
                                      style={{
                                        width: `${contractor.overallScore}%`,
                                        backgroundColor: contractor.overallScore >= 80 ? '#4ecdc4' :
                                                       contractor.overallScore >= 60 ? '#ffd93d' :
                                                       contractor.overallScore >= 40 ? '#ff9f43' : '#ff6b6b'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="status-cell">
                                <div className={`status-badge status-${Math.floor(contractor.overallScore / 20)}`}>
                                  {contractor.overallScore >= 80 ? 'Excellent' :
                                   contractor.overallScore >= 60 ? 'Good' :
                                   contractor.overallScore >= 40 ? 'Fair' : 'Poor'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#64748b',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      No contractor data available.<br/>
                      <button
                        className="dashboard-btn dashboard-interactive-btn"
                        style={{marginTop: '15px'}}
                        onClick={() => fetchContractorScoringData()}
                      >
                        <Activity size={16} />
                        Load Data
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* CL Addition Trend */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <TrendingUp className="dashboard-chart-icon" size={20} />
                    CL Addition Trend (Last 6 Months) - {clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? 'LIVE' : 'SAMPLE'}
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? '#4ECDC4' : '#FF6B6B',
                      borderRadius: '50%',
                      marginLeft: '8px',
                      animation: clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? 'pulse 2s infinite' : 'none'
                    }} title={clAdditionTrendData.length > 0 && clAdditionTrendData[0].isRealTime ? "Real-time data" : "Sample data"}></span>
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="dashboard-btn dashboard-interactive-btn"
                      onClick={() => {
                        // Trigger a re-fetch of the CL addition trend data
                          console.log('Refreshing CL Addition Trend data...');
                        fetchClAdditionTrend(selectedContractorForCLAddition);
                          // Also recreate the chart
                          setTimeout(() => {
                            createCLCharts();
                          }, 1000);
                      }}
                        title="Refresh CL Addition Trend"
                    >
                        <Heart size={20} />
                    </button>
                    <button
                      className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                      onClick={handleDownloadCLAdditionTrendPDF}
                      title="Download CL Addition Trend PDF"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </button>
                  </div>
                  </div>
                 
                  {/* Contractor Filter Dropdown */}
                  <div className="dashboard-filter-row" style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <div className="dashboard-filter-group">
                      <label className="dashboard-filter-label">Filter by Contractor:</label>
                      <select
                        className="dashboard-filter-select"
                        value={selectedContractorForCLAddition}
                        onChange={(e) => handleClAdditionContractorChange(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: 'white',
                          fontSize: '14px',
                          minWidth: '200px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Contractors</option>
                        {contractorList.length > 0 ? (
                          contractorList.map((contractor, index) => {
                            console.log('Rendering contractor option:', contractor);
                            return (
                              <option key={index} value={contractor}>
                                {contractor}
                              </option>
                            );
                          })
                        ) : (
                          <option value="all" disabled>Loading contractors... ({contractorList.length} contractors found)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  {isClAdditionLoading ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#4facfe',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      <div style={{ marginBottom: '10px' }}>
                        🔄 Loading REAL-TIME CL addition trend data...
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Auto-refreshing every 30 seconds
                      </div>
                    </div>
                  ) : clAdditionTrendData && clAdditionTrendData.length > 0 ? (
                    <canvas ref={clAdditionChartRef} width={400} height={250}></canvas>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#64748b',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      No CL addition data available
                    </div>
                  )}
                </div>
              </div>

              {/* Month Employee Details Modal */}
              {showMonthDetails && (
                <div className="dashboard-modal-overlay" onClick={() => setShowMonthDetails(false)}>
                  <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="dashboard-modal-header">
                      <h3 className="dashboard-modal-title">
                        <Users size={20} />
                        Employee Details - {selectedChartMonth} {new Date().getFullYear()}
                        {selectedContractorForCLAddition !== 'all' && ` (${selectedContractorForCLAddition})`}
                      </h3>
                      <button
                        className="dashboard-modal-close"
                        onClick={() => setShowMonthDetails(false)}
                      >
                        ×
                      </button>
                    </div>
                   
                    <div className="dashboard-modal-body">
                      {isLoadingMonthDetails ? (
                        <div className="dashboard-modal-no-data">
                          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                            🔄 Loading employee details...
                          </div>
                          <div style={{ color: '#666' }}>
                            Fetching data for {selectedChartMonth} {new Date().getFullYear()}
                          </div>
                        </div>
                      ) : monthEmployeeDetails.length > 0 ? (
                        <div>
                          <div className="dashboard-modal-summary">
                            <div className="dashboard-modal-stat">
                              <span className="dashboard-modal-stat-label">Total Employees Joined:</span>
                              <span className="dashboard-modal-stat-value">{monthEmployeeDetails.length}</span>
                            </div>
                            <div className="dashboard-modal-stat">
                              <span className="dashboard-modal-stat-label">Last Updated:</span>
                              <span className="dashboard-modal-stat-value">{new Date().toLocaleTimeString()}</span>
                            </div>
                          </div>
                         
                          <div className="dashboard-modal-employee-list">
                            <h4>Employee List:</h4>
                            <div className="dashboard-modal-employee-grid">
                              {monthEmployeeDetails.map((emp, index) => (
                                <div key={index} className="dashboard-modal-employee-card">
                                  <div className="dashboard-modal-employee-info">
                                    <div className="dashboard-modal-employee-name">
                                      {emp.name || 'Unknown Employee'}
                                    </div>
                                    <div className="dashboard-modal-employee-details">
                                      <div><strong>ID:</strong> {emp.employeeId || 'N/A'}</div>
                                      <div><strong>Contractor:</strong> {emp.contractor || 'Unknown'}</div>
                                      <div><strong>Department:</strong> {emp.department || 'N/A'}</div>
                                      <div><strong>Designation:</strong> {emp.designation || 'N/A'}</div>
                                      <div><strong>Joining Date:</strong> {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</div>
                                      <div><strong>Phone:</strong> {emp.phone || 'N/A'}</div>
                                      <div><strong>Email:</strong> {emp.email || 'N/A'}</div>
                                      <div><strong>Location:</strong> {emp.location || 'N/A'}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dashboard-modal-no-data">
                          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                            📊 No employees found for {selectedChartMonth} {new Date().getFullYear()}
                          </div>
                          <div style={{ color: '#666' }}>
                            {selectedContractorForCLAddition !== 'all'
                              ? `No employees joined for contractor "${selectedContractorForCLAddition}" in this month.`
                              : 'No employees joined in this month.'
                            }
                          </div>
                        </div>
                      )}
                    </div>
                   
                    <div className="dashboard-modal-footer">
                      <button
                        className="dashboard-btn dashboard-primary-btn"
                        onClick={() => setShowMonthDetails(false)}
                      >
                        Close
                      </button>
                      <button
                        className="dashboard-btn dashboard-secondary-btn"
                        onClick={() => {
                          fetchMonthEmployeeDetails(selectedChartMonth, selectedContractorForCLAddition);
                        }}
                      >
                        🔄 Refresh Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CL Attrition Trend */}
              <div className="dashboard-chart-card dashboard-interactive-card">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-title-row">
                  <h3 className="dashboard-chart-title">
                    <TrendingDown className="dashboard-chart-icon" size={20} />
                    CL Attrition Trend (Last 6 Months)
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="dashboard-btn dashboard-interactive-btn"
                      onClick={() => {
                        // Trigger a re-fetch of the CL attrition trend data
                          console.log('Refreshing CL Attrition Trend data...');
                          fetchClAttritionTrend(selectedContractorForCLAttrition);
                          // Also recreate the chart
                          setTimeout(() => {
                            createCLCharts();
                          }, 1000);
                        }}
                        title="Refresh CL Attrition Trend"
                      >
                        <Award size={20} />
                    </button>
                    <button
                      className="dashboard-btn dashboard-interactive-btn dashboard-pdf-btn"
                      onClick={handleDownloadCLAttritionTrendPDF}
                      title="Download CL Attrition Trend PDF"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </button>
                  </div>
                  </div>
                 
                  <div className="dashboard-filter-row" style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <div className="dashboard-filter-group">
                      <label className="dashboard-filter-label">Filter by Contractor:</label>
                      <select
                        className="dashboard-filter-select"
                        value={selectedContractorForCLAttrition}
                        onChange={(e) => handleClAttritionContractorChange(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: 'white',
                          fontSize: '14px',
                          minWidth: '200px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Contractors</option>
                        {contractorList.map((contractor, index) => (
                          <option key={index} value={contractor}>
                            {contractor}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="dashboard-chart-canvas">
                  {isClAttritionLoading ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#4facfe',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      Loading employee exit data...
                    </div>
                  ) : clAttritionTrendData && clAttritionTrendData.length > 0 ? (
                    <canvas ref={clAttritionChartRef} width={400} height={250}></canvas>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '300px',
                      color: '#64748b',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      No CL attrition data available
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* User Welcome Message for App Users */}
            {userRole === 'App User' && (
              <div className="dashboard-welcome-section">
                <div className="dashboard-welcome-card">
                  <div className="dashboard-welcome-icon">
                    <Users size={48} />
                  </div>
                  <div className="dashboard-welcome-content">
                    <h2>Welcome to Your Interactive Dashboard</h2>
                    <p>
                      Experience the power of real-time data visualization and gamified interactions.
                      Your dashboard includes Employee Management, Attendance Tracking, Candidate Management,
                      and Attendance Muster with beautiful animations and insights.
                    </p>
                    <div className="dashboard-feature-highlights">
                      <div className="dashboard-feature-item">
                        <CheckCircle size={20} />
                        <span>Real-time Updates</span>
                      </div>
                      <div className="dashboard-feature-item">
                        <Activity size={20} />
                        <span>Interactive Charts</span>
                      </div>
                      <div className="dashboard-feature-item">
                        <Trophy size={20} />
                        <span>Achievement System</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contractor Tooltip */}
            {showContractorTooltip && (
              <div
                className="contractor-tooltip"
                style={{
                  position: 'fixed',
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 1000
                }}
              >
                <div className="contractor-tooltip-content">
                  <div className="contractor-tooltip-header">
                    <h3>
                      {contractorViewMode === 'overview' ? 'Contractor Employee Distribution' : `Employees - ${selectedContractorForDetails?.contractorName}`}
                    </h3>
                    <div className="contractor-tooltip-controls">
                      <button
                        className="contractor-tooltip-close"
                        onClick={handleCloseContractorTooltip}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="contractor-tooltip-body">
                    {contractorViewMode === 'overview' ? (
                      // Contractor overview
                      contractorEmployeeData.length > 0 ? (
                        <div className="contractor-list-container">
                          <div style={{
                            background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                            color: 'white',
                            padding: '12px 16px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <span>Contractor</span>
                            <span>Count</span>
                          </div>
                          <div style={{border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 8px 8px'}}>
                            {contractorEmployeeData.map((contractor, index) => {
                              console.log('Rendering contractor:', contractor);
                              console.log('Contractor name:', contractor.contractorName);
                              return (
                                <div
                                  key={index}
                                  onClick={() => handleContractorDetailsClick(contractor)}
                                  style={{
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    backgroundColor: 'white',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #ddd',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(135, 206, 235, 0.1)'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                  <span>{contractor.contractorName || 'Unknown'}</span>
                                  <span style={{color: '#4682B4', fontWeight: '800'}}>{contractor.employeeCount}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="no-data" style={{color: '#64748b', padding: '20px', textAlign: 'center'}}>
                          {userRole === 'App User' || userRole === 'Contractor' ? (
                            <div>
                              <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '8px'}}>
                                Limited Access
                              </div>
                              <div style={{fontSize: '14px'}}>
                                You can only view data for your assigned contractor.
                              </div>
                              <div style={{fontSize: '12px', marginTop: '8px', color: '#94a3b8'}}>
                                Contact your administrator for full access.
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '8px'}}>
                                No Data Available
                              </div>
                              <div style={{fontSize: '14px'}}>
                                No contractor data found. Please check your data import.
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      // Employee list view
                      selectedContractorForDetails && (
                        <div className="contractor-employees-list">
                          <div className="contractor-employees-header">
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                              <span className="contractor-employees-title">
                                {selectedContractorForDetails.contractorName} ({selectedContractorForDetails.employeeCount} employees)
                              </span>
                              <button
                                onClick={handleBackToContractorOverview}
                                style={{
                                  background: 'white',
                                  border: '1px solid #ddd',
                                  color: 'black',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '32px',
                                  minHeight: '32px',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#f0f0f0';
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'white';
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                }}
                                title="Back to contractors"
                              >
                                ←
                              </button>
                            </div>
                          </div>
                          <div className="employee-list">
                            {(showAllEmployees ? selectedContractorForDetails.employees : selectedContractorForDetails.employees.slice(0, 5)).map((employee, index) => (
                              <div key={index} className="employee-item">
                                <span className="employee-code">{employee.employeeCode || employee.EmployeeCode || employee.id || 'N/A'}</span>
                                <span className="employee-name">{employee.employeeName}</span>
                              </div>
                            ))}
                            {!showAllEmployees && selectedContractorForDetails.employees.length > 5 && (
                              <button
                                onClick={handleShowAllEmployees}
                                style={{
                                  background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                                  border: 'none',
                                  color: 'white',
                                  padding: '12px 24px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  width: '100%',
                                  marginTop: '10px',
                                  transform: 'translateY(0)',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                }}
                              >
                                Show All {selectedContractorForDetails.employees.length} Employees
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Present Employees Tooltip */}
            {showPresentTooltip && (
              <div
                className="present-tooltip"
                style={{
                  position: 'fixed',
                  left: `${presentTooltipPosition.x}px`,
                  top: `${presentTooltipPosition.y}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 1000
                }}
              >
                <div className="present-tooltip-content">
                  <div className="present-tooltip-header">
                    <h3>
                      {presentViewMode === 'contractors' ? 'Active Employees - By Contractor' : `Employees - ${selectedPresentContractor}`}
                    </h3>
                    <div className="present-tooltip-controls">
                      {presentViewMode === 'employees' && (
                        <button
                          className="present-tooltip-back"
                          onClick={handleBackToContractors}
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        className="present-tooltip-close"
                        onClick={handleClosePresentTooltip}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="present-tooltip-body">
                    {presentViewMode === 'contractors' ? (
                      <div className="contractor-list">
                        <div className="present-summary">
                          <span className="present-count">{presentEmployeesData.length} employees present today</span>
                        </div>
                        {contractorEmployeeCounts.map((contractor, index) => (
                          <div
                            key={index}
                            className="contractor-item"
                            onClick={() => handleContractorClick(contractor.contractorName)}
                          >
                            <div className="contractor-info single-line">
                              <div className="contractor-name-count">
                                {contractor.contractorName}
                              </div>
                              <div className="contractor-count">
                                {contractor.employeeCount}
                              </div>
                            </div>
                          </div>
                        ))}
                        {contractorEmployeeCounts.length === 0 && (
                          <div className="no-data">No employees present today</div>
                        )}
                      </div>
                    ) : (
                      <div className="present-employees-list">
                        <div className="present-summary">
                          <span className="present-count">
                            {contractorEmployeeCounts.find(c => c.contractorName === selectedPresentContractor)?.employeeCount || 0} employees from {selectedPresentContractor}
                          </span>
                        </div>
                        <div className="employee-codes-table">
                          {contractorEmployeeCounts
                            .find(c => c.contractorName === selectedPresentContractor)
                            ?.employees?.map((employee, index) => (
                              <div key={index} className="employee-code-cell">
                                {employee.employeeCode || employee.EmployeeCode || employee.id || 'N/A'}
                              </div>
                            ))}
                        </div>
                        {(!contractorEmployeeCounts.find(c => c.contractorName === selectedPresentContractor)?.employees || 
                          contractorEmployeeCounts.find(c => c.contractorName === selectedPresentContractor)?.employees?.length === 0) && (
                          <div className="no-data">No employees found for this contractor</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Absent Employees Tooltip */}
            {showAbsentTooltip && (
              <div
                className="absent-tooltip"
                style={{
                  position: 'fixed',
                  left: `${absentTooltipPosition.x}px`,
                  top: `${absentTooltipPosition.y}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 1000
                }}
              >
                <div className="absent-tooltip-content">
                  <div className="absent-tooltip-header">
                    <h3>
                      {absentViewMode === 'contractors' ? 'Absent Employees - By Contractor' : `Employees - ${selectedAbsentContractor}`}
                    </h3>
                    <div className="absent-tooltip-controls">
                      {absentViewMode === 'employees' && (
                        <button
                          className="absent-tooltip-back"
                          onClick={handleBackToAbsentContractors}
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        className="absent-tooltip-close"
                        onClick={handleCloseAbsentTooltip}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="absent-tooltip-body">
                    {absentViewMode === 'contractors' ? (
                      <div className="contractor-list">
                        <div className="absent-summary">
                          <span className="absent-count">{absentEmployeesData.length} employees absent today</span>
                        </div>
                        {absentContractorEmployeeCounts.map((contractor, index) => (
                          <div
                            key={index}
                            className="contractor-item absent-contractor-item"
                            onClick={() => handleAbsentContractorClick(contractor.contractorName)}
                          >
                            <div className="contractor-info single-line">
                              <div className="contractor-name-count">
                                {contractor.contractorName}
                              </div>
                              <div className="contractor-count absent-count">
                                {contractor.employeeCount}
                              </div>
                            </div>
                          </div>
                        ))}
                        {absentContractorEmployeeCounts.length === 0 && (
                          <div className="no-data">No employees absent today</div>
                        )}
                      </div>
                    ) : (
                      <div className="absent-employees-list">
                        <div className="absent-summary">
                          <span className="absent-count">
                            {absentContractorEmployeeCounts.find(c => c.contractorName === selectedAbsentContractor)?.employeeCount || 0} employees from {selectedAbsentContractor}
                          </span>
                        </div>
                        <div className="employee-codes-table">
                          {absentContractorEmployeeCounts
                            .find(c => c.contractorName === selectedAbsentContractor)
                            ?.employees?.map((employee, index) => (
                              <div key={index} className="employee-code-cell">
                                {employee.employeeCode || employee.EmployeeCode || employee.id || 'N/A'}
                              </div>
                            ))}
                        </div>
                        {(!absentContractorEmployeeCounts.find(c => c.contractorName === selectedAbsentContractor)?.employees || 
                          absentContractorEmployeeCounts.find(c => c.contractorName === selectedAbsentContractor)?.employees?.length === 0) && (
                          <div className="no-data">No employees found for this contractor</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Dashboard;