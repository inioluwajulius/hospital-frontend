import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Users, Stethoscope } from 'lucide-react';
import { api } from '../../services/api';

const PendingApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [rejecting, setRejecting] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch pending doctors
      const doctorsResponse = await api.get('/users/registrations/pending');
      const pendingDoctors = doctorsResponse.data?.filter(user => user.role === 'doctor') || doctorsResponse.data || [];
      setDoctors(pendingDoctors);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch pending registrations');
      console.error('Error fetching pending registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      setApproving(prev => ({ ...prev, [doctorId]: true }));
      setError('');
      await api.put(`/users/${doctorId}/approve`);
      setSuccess('Doctor approved successfully!');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve doctor');
      console.error('Approval error:', err);
    } finally {
      setApproving(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      setRejecting(prev => ({ ...prev, [doctorId]: true }));
      setError('');
      await api.put(`/users/${doctorId}/reject`, { reason: 'Documents invalid or rejected' });
      setSuccess('Doctor rejected successfully');
      setDoctors(prev => prev.filter(d => d._id !== doctorId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject doctor');
      console.error('Rejection error:', err);
    } finally {
      setRejecting(prev => ({ ...prev, [doctorId]: false }));
    }
  };



  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pending Approvals</h2>
          <p className="text-slate-500 text-sm mt-1">Review and approve new registrations.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary mr-2" size={20} />
          <span>Loading pending approvals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pending Approvals</h2>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl shadow-slate-200/30 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="p-6 border-b border-slate-200/50 bg-slate-50/50">
          <h3 className="font-black text-slate-900 text-lg">Pending Doctor Registrations</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No pending doctor approvals.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor Name</p>
                      <p className="text-sm font-bold text-slate-900">{doctor.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-sm text-slate-700">{doctor.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specialization</p>
                      <p className="text-sm text-slate-700">{doctor.specialization || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">License Number</p>
                      <p className="text-sm text-slate-700">{doctor.licenseNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleApproveDoctor(doctor._id)}
                    disabled={approving[doctor._id] || rejecting[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm"
                  >
                    {approving[doctor._id] ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectDoctor(doctor._id)}
                    disabled={rejecting[doctor._id] || approving[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
