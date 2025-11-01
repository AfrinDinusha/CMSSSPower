import React from 'react';
import { 
  Users, Calendar, FileText, AlertTriangle, FolderOpen, 
  ClipboardList, Building, Handshake, Landmark, Clock, 
  Map, BarChart3, Search, CreditCard, Shield, LayoutDashboard, Home as HomeIcon, AlertOctagon, Clock3
} from 'lucide-react';

// Single source of truth for sidebar modules so all pages stay in sync
export const allModules = [
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

export default allModules;


