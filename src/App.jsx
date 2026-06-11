import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RegistrationSelector from "./pages/RegistrationSelector";

// Admin Pages
import DoctorRegister from "./pages/admin/DoctorRegister";
import AdminDoctors from "./pages/admin/Doctors";
import AdminPatients from "./pages/admin/Patients";
import AdminPendingDoctors from "./pages/admin/PendingPatients";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import DoctorMedicalRecords from "./pages/doctor/MedicalRecords";
import DoctorLabTest from "./pages/doctor/LabTest";
import DoctorRadiology from "./pages/doctor/Radiology";

// Patient Pages
import PatientBilling from "./pages/patient/Billing";
import PatientPharmacy from "./pages/patient/Pharmacy";

// Shared
import DashboardLayout from "./layouts/DashboardLayout";
import { AuditLogs } from "./component/AuditLogs";
import { Settings } from "./component/Settings";
import { AdminSetup } from "./component/AdminSetup";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const handleAdminRegister = async (data) => {
    console.log("Admin registration:", data);
  };

  const handleAdminCancel = () => {
    // Handle admin setup cancellation
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        
        {/* ========== AUTH ROUTES (Public) ========== */}
        <Route path="/auth/login/:role" element={<Login />} />
        <Route path="/auth/register/:type" element={<Register />} />
        <Route path="/register" element={<RegistrationSelector />} />
        <Route path="/auth/admin-setup" element={<AdminSetup onRegister={handleAdminRegister} onCancel={handleAdminCancel} />} />
        
        {/* ========== ADMIN ROUTES ========== */}
        <Route element={<DashboardLayout />}>
          {/* Doctor Registration (by admin) */}
          <Route path="/admin/register-doctor" element={<ProtectedRoute requiredRole="admin"><DoctorRegister /></ProtectedRoute>} />
          
          {/* Admin Management Pages */}
          <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="admin"><AdminDoctors /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminPatients /></ProtectedRoute>} />
          <Route path="/admin/pending-approvals" element={<ProtectedRoute requiredRole="admin"><AdminPendingDoctors /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRole="admin"><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
        </Route>

        {/* ========== DOCTOR ROUTES ========== */}
        <Route element={<DashboardLayout />}>
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="doctor"><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor/prescriptions" element={<ProtectedRoute requiredRole="doctor"><DoctorPrescriptions /></ProtectedRoute>} />
          <Route path="/doctor/medical-records" element={<ProtectedRoute requiredRole="doctor"><DoctorMedicalRecords /></ProtectedRoute>} />
          <Route path="/doctor/lab-tests" element={<ProtectedRoute requiredRole="doctor"><DoctorLabTest /></ProtectedRoute>} />
          <Route path="/doctor/radiology" element={<ProtectedRoute requiredRole="doctor"><DoctorRadiology /></ProtectedRoute>} />
        </Route>

        {/* ========== PATIENT ROUTES ========== */}
        <Route element={<DashboardLayout />}>
          <Route path="/patient/billing" element={<ProtectedRoute requiredRole="patient"><PatientBilling /></ProtectedRoute>} />
          <Route path="/patient/pharmacy" element={<ProtectedRoute requiredRole="patient"><PatientPharmacy /></ProtectedRoute>} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
