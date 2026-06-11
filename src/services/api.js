import axios from "axios";

// Determine base URL based on environment
const getBaseURL = () => {
    // In production (Vercel), use relative URLs
    if (import.meta.env.PROD) {
        return "/api/v1";
    }
    // In development, use localhost
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
};

const getBaseURLLegacy = () => {
    // In production (Vercel), use relative URLs
    if (import.meta.env.PROD) {
        return "/api";
    }
    // In development, use localhost
    return import.meta.env.VITE_API_BASE_URL_LEGACY || "http://localhost:5000/api";
};

const API = axios.create({
    baseURL: getBaseURL(), // API v1 endpoints
    headers: {
        "Content-Type": "application/json",
    },
});

// Fallback API for backward compatibility
const API_LEGACY = axios.create({
    baseURL: getBaseURLLegacy(), // Legacy endpoints
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

API_LEGACY.interceptors.request.use(
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

API_LEGACY.interceptors.response.use(
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

// GET methods - Legacy Endpoints (backward compatibility)
export const getAppointments = () => API_LEGACY.get("/appointments");
export const getAppointment = (id) => API_LEGACY.get(`/appointments/${id}`);
export const getMedicalRecords = () => API_LEGACY.get("/medical-records");
export const getMedicalRecord = (id) => API_LEGACY.get(`/medical-records/${id}`);
export const getLabTests = () => API_LEGACY.get("/lab");
export const getLabTest = (id) => API_LEGACY.get(`/lab/${id}`);
export const getDrugs = () => API_LEGACY.get("/drugs");
export const getDrug = (id) => API_LEGACY.get(`/drugs/${id}`);
export const getRadiologyExams = () => API_LEGACY.get("/radiology");
export const getRadiologyExam = (id) => API_LEGACY.get(`/radiology/${id}`);
export const getInvoices = () => API_LEGACY.get("/billing");
export const getInvoice = (id) => API_LEGACY.get(`/billing/${id}`);
export const getPrescriptions = () => API_LEGACY.get("/prescriptions");
export const getPrescription = (id) => API_LEGACY.get(`/prescriptions/${id}`);
export const getRecords = () => API_LEGACY.get("/records");
export const getAuditLogs = () => API_LEGACY.get("/audit-logs");
export const getHealth = () => API_LEGACY.get("/health");

// POST methods - V1 Endpoints
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const createPatient = (data) => API.post("/patients", data);
export const createDoctor = (data) => API.post("/doctors", data);

// POST methods - Legacy Endpoints
export const createAppointment = (data) => API_LEGACY.post("/appointments", data);
export const createMedicalRecord = (data) => API_LEGACY.post("/medical-records", data);
export const createLabTest = (data) => API_LEGACY.post("/lab", data);
export const createDrug = (data) => API_LEGACY.post("/drugs", data);
export const createRadiologyExam = (data) => API_LEGACY.post("/radiology", data);
export const createInvoice = (data) => API_LEGACY.post("/billing", data);
export const createPrescription = (data) => API_LEGACY.post("/prescriptions", data);
export const createRecord = (data) => API_LEGACY.post("/medical-records", data);

// UPDATE methods - V1 Endpoints
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const updateDoctor = (id, data) => API.put(`/doctors/${id}`, data);

// UPDATE methods - Legacy Endpoints
export const updateAppointment = (id, data) => API_LEGACY.put(`/appointments/${id}`, data);
export const updateMedicalRecord = (id, data) => API_LEGACY.put(`/medical-records/${id}`, data);
export const updateLabTest = (id, data) => API_LEGACY.put(`/lab/${id}`, data);
export const updatePrescription = (id, data) => API_LEGACY.put(`/prescriptions/${id}`, data);
export const updateDrug = (id, data) => API_LEGACY.put(`/drugs/${id}`, data);
export const updateRadiologyExam = (id, data) => API_LEGACY.put(`/radiology/${id}`, data);
export const updateInvoice = (id, data) => API_LEGACY.put(`/billing/${id}`, data);

// DELETE methods - V1 Endpoints
export const deletePatient = (id) => API.delete(`/patients/${id}`);
export const deleteDoctor = (id) => API.delete(`/doctors/${id}`);

// DELETE methods - Legacy Endpoints
export const deleteAppointment = (id) => API_LEGACY.delete(`/appointments/${id}`);
export const deletePrescription = (id) => API_LEGACY.delete(`/prescriptions/${id}`);
export const deleteMedicalRecord = (id) => API_LEGACY.delete(`/medical-records/${id}`);
export const deleteLabTest = (id) => API_LEGACY.delete(`/lab/${id}`);
export const deleteDrug = (id) => API_LEGACY.delete(`/drugs/${id}`);
export const deleteRadiologyExam = (id) => API_LEGACY.delete(`/radiology/${id}`);
export const deleteInvoice = (id) => API_LEGACY.delete(`/billing/${id}`);

// Export API instances for direct use if needed
export { API, API_LEGACY };

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
    // UPDATE methods
    updatePatient,
    updateAppointment,
    updateMedicalRecord,
    updateLabTest,
    updateDoctor,
    updatePrescription,
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