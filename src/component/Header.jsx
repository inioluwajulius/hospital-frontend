import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User as UserIcon, ChevronDown, Menu, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { initSocket } from '../services/socket';

export const Header = ({ user, onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications and setup socket
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await api.getNotifications();
        if (response.data?.success) {
          setNotifications(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    const socket = initSocket();
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
      };
      
      socket.on('new_notification', handleNewNotification);

      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.markNotificationAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // in minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="relative group flex-1 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search patients, records, or appointments..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 hover:bg-slate-100 border border-transparent focus:border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-600/10 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right"
              >
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Check size={14} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                      >
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{formatTime(notif.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-50 text-center bg-slate-50/50">
                  <button className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest">
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden sm:block h-8 w-[1px] bg-slate-200"></div>

        <button className="flex items-center gap-3 sm:pl-3 pr-2 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-emerald-600 transition-colors">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{user?.role?.replace('_', ' ') || 'STAFF'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200 overflow-hidden group-hover:scale-105 transition-transform shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={20} />
            )}
          </div>
          <ChevronDown size={16} className="hidden sm:block text-slate-400 group-hover:text-emerald-600 transition-colors ml-1" />
        </button>
      </div>
    </header>
  );
};
