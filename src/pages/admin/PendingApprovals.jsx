import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users, Stethoscope, Mail, Award, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmptyState } from '../../component/EmptyState';
import { SkeletonCard } from '../../component/SkeletonLoader';

const PendingApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      const doctorsResponse = await api.get('/users/registrations/pending');
      const pendingDoctors = doctorsResponse.data?.filter(user => user.role === 'doctor') || doctorsResponse.data || [];
      setDoctors(pendingDoctors);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch pending registrations');
      console.error('Error fetching pending registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      setApproving(prev => ({ ...prev, [doctorId]: true }));
      await api.put(`/users/${doctorId}/approve`);
      toast.success('Doctor approved successfully!');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve doctor');
      console.error('Approval error:', err);
    } finally {
      setApproving(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      setRejecting(prev => ({ ...prev, [doctorId]: true }));
      await api.put(`/users/${doctorId}/reject`, { reason: 'Documents invalid or rejected' });
      toast.success('Doctor rejected successfully');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject doctor');
      console.error('Rejection error:', err);
    } finally {
      setRejecting(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pending Approvals</h2>
          <p className="text-slate-500 font-medium mt-2">Loading pending approvals...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600">
              <Users size={28} />
            </div>
            Pending Approvals
          </h1>
          <p className="text-slate-500 font-medium">Review and approve new registrations and account requests.</p>
        </div>
        <button 
          onClick={fetchPendingData}
          className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold text-sm flex justify-center items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <RefreshCw size={18} />
          Refresh List
        </button>
      </motion.div>

      {doctors.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All Caught Up!"
          description="There are no pending doctor registrations awaiting your approval at this time."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">Doctor Registrations</h2>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {doctors.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {doctors.map((doctor, idx) => (
                <motion.div 
                  layout
                  key={doctor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl font-black group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {doctor.name?.charAt(0) || 'D'}
                    </div>
                    <span className="bg-amber-50 text-amber-600 border border-amber-200/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Pending
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">{doctor.name || 'Unknown User'}</h3>
                  <p className="text-sm font-bold text-primary mb-6">{doctor.specialization || 'General Practice'}</p>

                  <div className="space-y-4 mb-8 flex-1">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{doctor.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award size={16} className="text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License No.</p>
                          <p className="text-sm font-bold text-slate-700">{doctor.licenseNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => handleRejectDoctor(doctor._id)}
                      disabled={rejecting[doctor._id] || approving[doctor._id]}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-extrabold text-sm shadow-sm"
                    >
                      {rejecting[doctor._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle size={18} />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveDoctor(doctor._id)}
                      disabled={approving[doctor._id] || rejecting[doctor._id]}
                      className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-white rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-extrabold text-sm shadow-lg shadow-primary/20"
                    >
                      {approving[doctor._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 size={18} />}
                      Approve
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
