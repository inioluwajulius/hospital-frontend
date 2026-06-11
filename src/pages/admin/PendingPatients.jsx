import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const PendingApprovals = () => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
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
      const pendingDoctors = doctorsResponse.data?.filter(user => user.role === 'doctor') || [];
      setDoctors(pendingDoctors);

      // Fetch pending patients
      const patientsResponse = await api.get('/patients/registrations/pending');
      const pendingPatients = patientsResponse.data || [];
      setPatients(pendingPatients);
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

  const handleApprovePatient = async (patientId) => {
    try {
      setApproving(prev => ({ ...prev, [patientId]: true }));
      setError('');
      await api.put(`/patients/${patientId}/approve`, { notes: 'Verification documents approved by admin' });
      setSuccess('Patient approved successfully!');
      setPatients(prev => prev.filter(p => p._id !== patientId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve patient');
      console.error('Patient approval error:', err);
    } finally {
      setApproving(prev => ({ ...prev, [patientId]: false }));
    }
  };

  const handleRejectPatient = async (patientId) => {
    try {
      setRejecting(prev => ({ ...prev, [patientId]: true }));
      setError('');
      await api.put(`/patients/${patientId}/reject`, { reason: 'Verification failed' });
      setSuccess('Patient registration rejected');
      setPatients(prev => prev.filter(p => p._id !== patientId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject patient');
      console.error('Patient rejection error:', err);
    } finally {
      setRejecting(prev => ({ ...prev, [patientId]: false }));
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
          <p className="text-slate-500 text-sm mt-1">Review and approve new doctor and patient registrations.</p>
        </div>
        <button
          onClick={fetchPendingData}
          disabled={loading}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* --- DOCTOR REGISTRATIONS --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Pending Doctor Registrations</h3>
          <p className="text-xs text-slate-500 mt-1">
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

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApproveDoctor(doctor._id)}
                    disabled={approving[doctor._id] || rejecting[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {approving[doctor._id] ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectDoctor(doctor._id)}
                    disabled={rejecting[doctor._id] || approving[doctor._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- PATIENT REGISTRATIONS --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Pending Patient Registrations</h3>
          <p className="text-xs text-slate-500 mt-1">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {patients.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No pending patient approvals.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <div key={patient._id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Name</p>
                      <p className="text-sm font-bold text-slate-900">{patient.userId?.name || patient.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-sm text-slate-700">{patient.userId?.email || patient.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Card</p>
                      <p className="text-sm text-slate-700 font-mono">{patient.patientCardNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registered At</p>
                      <p className="text-sm text-slate-700">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApprovePatient(patient._id)}
                    disabled={approving[patient._id] || rejecting[patient._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {approving[patient._id] ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectPatient(patient._id)}
                    disabled={rejecting[patient._id] || approving[patient._id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
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
