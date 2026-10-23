// Shared helpers for the staff portal pages

// Staff roles that use the /staff portal (doctors and admins have their own areas)
export const STAFF_ROLES = ['nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'accountant'];

export const ROLE_LABELS = {
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
  pharmacist: 'Pharmacist',
  radiologist: 'Radiologist',
  accountant: 'Accountant',
  doctor: 'Doctor',
  hospital_admin: 'Hospital Admin',
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// API responses come as a bare array or as { success, data: [...] }
export const listOf = (res) => {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

// Patient docs keep the account (with name) in userId; walk-in records have their own name
export const patientName = (patient) =>
  patient?.userId?.name || patient?.name || patient?.patientCardNumber || 'Unknown patient';

export const errorText = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
