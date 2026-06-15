import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-400"></div>
                    
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100/50">
                        <ShieldAlert className="w-10 h-10 text-red-500" strokeWidth={1.5} />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Access Restricted</h1>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        You don't have the necessary administrative privileges to view or modify this section of the system.
                    </p>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-sm text-slate-600 border border-slate-100/60 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-medium">Current Role</span>
                            <span className="px-2.5 py-1 bg-slate-200/60 rounded-lg text-slate-700 font-mono text-xs font-semibold tracking-wide uppercase">
                                {user.role?.replace('_', ' ') || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Required Role</span>
                            <span className="px-2.5 py-1 bg-red-100/80 text-red-700 rounded-lg font-mono text-xs font-semibold tracking-wide uppercase">
                                {requiredRole || 'Admin'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.history.back()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-slate-700 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                        <Link 
                            to="/"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
