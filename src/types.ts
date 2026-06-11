export type UserRole = 
  | 'ADMIN' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'RECEPTIONIST' 
  | 'LAB_TECHNICIAN' 
  | 'PHARMACIST' 
  | 'RADIOLOGIST' 
  | 'PATIENT' 
  | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  staffId?: string;
  department?: string;
  shift?: 'Morning' | 'Afternoon' | 'Night';
  phone?: string;
}

export interface StaffMember extends User {
  specialization?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  joiningDate: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  lastVisit?: string;
  nextAppointment?: string;
  status: 'Active' | 'Inactive';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In-Progress';
  reason: string;
  type: 'Checkup' | 'Follow-up' | 'Emergency' | 'Surgery';
  notes?: string;
}

export interface LabParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: string;
  requestedBy: string;
  date: string;
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Urgent';
  result?: string;
  parameters?: LabParameter[];
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName?: string;
  date: string;
  time?: string;
  type?: string;
  diagnosis: string;
  treatment: string;
  prescription: string[];
  notes: string;
  chiefComplaint?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorAvatar?: string;
  isImmutable?: boolean;
}

export interface Drug {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiryDate: string;
  price: number;
  manufacturer: string;
  batch?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Reorder Soon' | 'Expired';
}

export interface RadiologyExam {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  modality: 'X-Ray' | 'MRI' | 'CT Scan' | 'Ultrasound' | 'PET Scan';
  date: string;
  status: 'Pending' | 'Completed' | 'In-Progress' | 'In Review' | 'Pending Technician';
  priority: 'Normal' | 'Urgent' | 'STAT';
  technicianId?: string;
  radiologist?: string;
  radiologistSpecialization?: string;
  radiologistAvatar?: string;
  report?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid' | 'Pending';
  method: 'Insurance' | 'Credit Card' | 'Cash' | 'Bank Transfer';
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string;
  action: string;
  module: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  ipAddress?: string;
  details?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  drugs: {
    drugId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  status: 'Active' | 'Completed' | 'Cancelled';
}

export interface Billing {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  services: {
    description: string;
    cost: number;
  }[];
  total: number;
  paid: number;
  balance: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
}
