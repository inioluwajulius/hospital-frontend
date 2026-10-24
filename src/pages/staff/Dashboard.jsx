import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Microscope, Pill, Activity, CreditCard, ArrowRight, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { PageHeader } from './StaffUI';
import { getCurrentUser, listOf, ROLE_LABELS } from './staffUtils';

// What each staff role can open, plus a live count shown on the card
const ROLE_TOOLS = {
  nurse: [
    { label: 'Patients', description: 'View patients and their medical records', path: '/staff/patients', icon: Users, count: () => api.getPatients() },
    { label: 'Appointments', description: "See the hospital's upcoming appointments", path: '/staff/appointments', icon: Calendar, count: () => api.getAppointments(), countFilter: (a) => a.status === 'scheduled' },
  ],
  receptionist: [
    { label: 'Patients', description: 'Register walk-in patients and look up records', path: '/staff/patients', icon: Users, count: () => api.getPatients() },
    { label: 'Appointments', description: 'Book, view and cancel appointments', path: '/staff/appointments', icon: Calendar, count: () => api.getAppointments(), countFilter: (a) => a.status === 'scheduled' },
  ],
  lab_technician: [
    { label: 'Lab Work', description: 'Process ordered tests and record results', path: '/staff/lab', icon: Microscope, count: () => api.getLabOrders(), countFilter: (t) => t.status !== 'Completed' },
  ],
  pharmacist: [
    { label: 'Pharmacy', description: 'Manage inventory and dispense prescriptions', path: '/staff/pharmacy', icon: Pill, count: () => api.getPrescriptions(), countFilter: (p) => p.status === 'pending' },
  ],
  radiologist: [
    { label: 'Radiology', description: 'Report on ordered imaging exams', path: '/staff/radiology', icon: Activity, count: () => api.getRadiologyExams(), countFilter: (e) => !['reviewed', 'completed'].includes(e.status) },
  ],
  accountant: [
    { label: 'Billing', description: 'Create invoices and record payments', path: '/staff/billing', icon: CreditCard, count: () => api.getInvoices(), countFilter: (i) => i.status === 'unpaid' },
  ],
};

const COUNT_LABELS = {
  '/staff/patients': 'patients',
  '/staff/appointments': 'scheduled',
  '/staff/lab': 'open orders',
  '/staff/pharmacy': 'to dispense',
  '/staff/radiology': 'awaiting report',
  '/staff/billing': 'unpaid',
};

const StaffDashboard = () => {
  const user = getCurrentUser();
  const role = user?.role?.toLowerCase() || '';
  const tools = ROLE_TOOLS[role] || [];
  const [counts, setCounts] = useState({});

  useEffect(() => {
    tools.forEach(async (tool) => {
      try {
        const items = listOf(await tool.count());
        const value = tool.countFilter ? items.filter(tool.countFilter).length : items.length;
        setCounts((prev) => ({ ...prev, [tool.path]: value }));
      } catch {
        // Counts are a convenience; the card still links to the page
      }
    });
    // tools is derived from the stored role, which doesn't change while mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome${user?.name ? `, ${user.name}` : ''}`}
        description={`${ROLE_LABELS[role] || 'Staff'} workspace`}
      />

      {tools.length === 0 ? (
        <p className="text-slate-500 font-medium">No tools are set up for your role yet. Please contact your hospital administrator.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, idx) => (
            <motion.div key={tool.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Link
                to={tool.path}
                className="group block bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                    <tool.icon size={28} />
                  </div>
                  {counts[tool.path] !== undefined && (
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-slate-900">{counts[tool.path]}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{COUNT_LABELS[tool.path]}</div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">{tool.label}</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">{tool.description}</p>
                <span className="text-sm font-bold text-primary flex items-center gap-2">
                  Open <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
