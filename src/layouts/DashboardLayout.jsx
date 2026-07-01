import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { Header } from '../component/Header';
import { Footer } from '../component/Footer';
import { ToastContainer } from '../component/Toast';
import { initSocket } from '../services/socket';

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

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const socket = initSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        // Show a popup toast for the new notification
        addToast(notif.message, 'info', 5000);
      };
      
      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [user]);

  if (!user) return <Navigate to="/auth/login/patient" replace />;

  return (
    <div className="flex h-screen bg-slate-50 flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none z-0"></div>
      
      {/* Toast container for global notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      {/* <Footer /> optional or adjust if needed */}
    </div>
  );
};

export default DashboardLayout;