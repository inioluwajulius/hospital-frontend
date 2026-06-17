import React, { useState, useEffect } from 'react';
import { Pill, Calendar, RefreshCcw, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

const MedicationCard = ({ med, prescription, active = false }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          <Pill size={24} />
        </div>
        <div>
          <h4 className="font-bold text-xl text-slate-900">{med.name}</h4>
          <p className="text-sm font-semibold text-primary">{med.dosage}</p>
        </div>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-start gap-3">
        <FileText size={16} className="text-slate-400 mt-0.5" />
        <p className="text-sm text-slate-700 font-medium">{med.frequency} {med.duration ? `(${med.duration})` : ''}</p>
      </div>
      <div className="flex items-center gap-3">
        <Calendar size={16} className="text-slate-400" />
        <p className="text-sm text-slate-600">Issued: {new Date(prescription.createdAt).toLocaleDateString()} by Dr. {prescription.doctorId?.name}</p>
      </div>
    </div>

    {active && (
      <button 
        className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        <RefreshCcw size={16} />
        Refill Not Configured
      </button>
    )}
  </div>
);

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.getPrescriptions();
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'pending');
  const pastPrescriptions = prescriptions.filter(p => p.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Prescriptions</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your active medications and request refills.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Active Medications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePrescriptions.length > 0 ? (
            activePrescriptions.map(rx => (
              rx.medications?.map((med, idx) => (
                <MedicationCard key={`${rx._id}-${idx}`} med={med} prescription={rx} active={true} />
              ))
            ))
          ) : (
            <p className="text-slate-500">No active medications.</p>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Past Medications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastPrescriptions.map(rx => (
            rx.medications?.map((med, idx) => (
              <MedicationCard key={`${rx._id}-${idx}`} med={med} prescription={rx} active={false} />
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptions;
