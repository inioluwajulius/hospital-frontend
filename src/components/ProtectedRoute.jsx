import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // No token = not logged in
    if (!token || !user) {
        return <Navigate to="/auth/login/patient" replace />;
    }

    // Normalize roles for comparison
    const userRole = user.role?.toLowerCase() || '';
    const normalizedRequiredRole = requiredRole?.toLowerCase() || '';

    // Check if user is an admin (either admin, hospital_admin or super_admin)
    const isUserAdmin = ['admin', 'hospital_admin', 'super_admin'].includes(userRole);
    const isAdminRequired = normalizedRequiredRole === 'admin';

    // Allow access if no role is required, or user matches the role, or user is admin and admin is required
    const hasAccess = !normalizedRequiredRole || (userRole === normalizedRequiredRole) || (isAdminRequired && isUserAdmin);

    console.log(`[ProtectedRoute Debug] userRole: "${userRole}", requiredRole: "${normalizedRequiredRole}", isUserAdmin: ${isUserAdmin}, isAdminRequired: ${isAdminRequired}, hasAccess: ${hasAccess}`);

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-lg text-slate-600 mb-6">You do not have permission to access this page.</p>
                    <p className="text-sm text-slate-500">Required role: <strong>{requiredRole}</strong> | Your role: <strong>{user.role}</strong></p>
                    <a href="/" className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
