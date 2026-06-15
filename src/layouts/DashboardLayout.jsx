import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { Header } from '../component/Header';
import { Footer } from '../component/Footer';

const DashboardLayout = () => {
  // Lazy initialize user from localStorage to avoid setState in effect
  const [user] = useState(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!token || !userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  });

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50 flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none z-0"></div>
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      {/* <Footer /> optional or adjust if needed */}
    </div>
  );
};

export default DashboardLayout;