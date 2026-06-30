import axios from "axios";

const getBaseURL = () => {
    return import.meta.env.VITE_API_BASE_URL || "/api/v1";
};

const API = axios.create({
    baseURL: getBaseURL(), // API v1 endpoints
    headers: {
        "Content-Type": "application/json",
    },
});

// Add JWT token from localStorage to request headers
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 responses - redirect to login
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/auth/login/patient';
        }
        return Promise.reject(error);
    }
);

// GET methods - V1 Endpoints
export const getPatients = () => API.get("/patients");
export const getPatient = (id) => API.get(`/patients/${id}`);
export const getDoctors = () => API.get("/doctors");
export const getDoctor = (id) => API.get(`/doctors/${id}`);
export const getMe = () => API.get("/auth/me");
export const getNotifications = () => API.get("/notifications");

// GET methods - Legacy Endpoints (backward compatibility)
export const getAppointments = () => API.get("/appointments");
export const getAppointment = (id) => API.get(`/appointments/${id}`);
export const getMedicalRecords = () => API.get("/medical-records");
export const getMedicalRecord = (id) => API.get(`/medical-records/${id}`);
export const getLabTests = () => API.get("/lab");
export const getLabTest = (id) => API.get(`/lab/${id}`);
export const getDrugs = () => API.get("/pharmacy/drugs");
export const getDrug = (id) => API.get(`/pharmacy/drugs/${id}`);
export const getRadiologyExams = () => API.get("/radiology");
export const getRadiologyExam = (id) => API.get(`/radiology/${id}`);
export const getInvoices = () => API.get("/billing");
export const getInvoice = (id) => API.get(`/billing/${id}`);
export const getPrescriptions = () => API.get("/prescriptions");
export const getPrescription = (id) => API.get(`/prescriptions/${id}`);
export const getRecords = () => API.get("/records");
export const getAuditLogs = () => API.get("/audit-logs");
export const getHealth = () => API.get("/health");
export const getHospitals = () => API.get("/public/hospitals");

// POST methods - V1 Endpoints
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);
export const resetPassword = (token, data) => API.post(`/auth/reset-password/${token}`, data);
export const createPatient = (data) => API.post("/patients", data);
export const createDoctor = (data) => API.post("/doctors", data);

// POST methods - Legacy Endpoints
export const createAppointment = (data) => API.post("/appointments", data);
export const createMedicalRecord = (data) => API.post("/medical-records", data);
export const createLabTest = (data) => API.post("/lab", data);
export const createDrug = (data) => API.post("/pharmacy/drugs", data);
export const createRadiologyExam = (data) => API.post("/radiology", data);
export const createInvoice = (data) => API.post("/billing", data);
export const createPrescription = (data) => API.post("/prescriptions", data);
export const createRecord = (data) => API.post("/medical-records", data);

// UPDATE methods - V1 Endpoints
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);
export const markNotificationAsRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => API.patch("/notifications/read-all");

// UPDATE methods - Legacy Endpoints
export const updateAppointment = (id, data) => API.put(`/appointments/${id}`, data);
export const updateMedicalRecord = (id, data) => API.put(`/medical-records/${id}`, data);
export const updateLabTest = (id, data) => API.put(`/lab/${id}`, data);
export const updatePrescription = (id, data) => API.put(`/prescriptions/${id}`, data);
export const updateDrug = (id, data) => API.put(`/pharmacy/drugs/${id}`, data);
export const updateRadiologyExam = (id, data) => API.put(`/radiology/${id}`, data);
export const updateInvoice = (id, data) => API.put(`/billing/${id}`, data);

// DELETE methods - V1 Endpoints
export const deletePatient = (id) => API.delete(`/patients/${id}`);
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);

// DELETE methods - Legacy Endpoints
export const deleteAppointment = (id) => API.delete(`/appointments/${id}`);
export const deletePrescription = (id) => API.delete(`/prescriptions/${id}`);
export const deleteMedicalRecord = (id) => API.delete(`/medical-records/${id}`);
export const deleteLabTest = (id) => API.delete(`/lab/${id}`);
export const deleteDrug = (id) => API.delete(`/pharmacy/drugs/${id}`);
export const deleteRadiologyExam = (id) => API.delete(`/radiology/${id}`);
export const deleteInvoice = (id) => API.delete(`/billing/${id}`);

// Export API instances for direct use if needed
export { API };

// Create an api object with all methods for convenience
export const api = {
    // Generic HTTP methods
    get: (url) => API.get(url),
    post: (url, data) => API.post(url, data),
    put: (url, data) => API.put(url, data),
    delete: (url) => API.delete(url),
    
    // GET methods
    getPatients,
    getPatient,
    getAppointments,
    getAppointment,
    getMedicalRecords,
    getMedicalRecord,
    getLabTests,
    getLabTest,
    getDrugs,
    getDrug,
    getRadiologyExams,
    getRadiologyExam,
    getInvoices,
    getInvoice,
    getDoctors,
    getDoctor,
    getPrescriptions,
    getPrescription,
    getRecords,
    getAuditLogs,
    getMe,
    getHealth,
    getHospitals,
    getNotifications,
    // POST methods
    createPatient,
    createAppointment,
    createMedicalRecord,
    createLabTest,
    createDrug,
    createRadiologyExam,
    createInvoice,
    createDoctor,
    createPrescription,
    createRecord,
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    // UPDATE methods
    updatePatient,
    updateAppointment,
    updateMedicalRecord,
    updateLabTest,
    updateDoctor,
    updatePrescription,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateDrug,
    updateRadiologyExam,
    updateInvoice,
    // DELETE methods
    deletePatient,
    deleteAppointment,
    deleteDoctor,
    deletePrescription,
    deleteMedicalRecord,
    deleteLabTest,
    deleteDrug,
    deleteRadiologyExam,
    deleteInvoice,
};

export default API;