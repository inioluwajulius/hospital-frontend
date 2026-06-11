import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { Header } from '../component/Header';
import { Footer } from '../component/Footer';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;