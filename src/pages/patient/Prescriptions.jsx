import React, { useState, useEffect } from 'react';
import { Pill, Calendar, RefreshCcw, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const MedicationCard = ({ med, prescription, active = false, index }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className={`bg-white border-2 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full ${active ? 'border-indigo-100 hover:border-indigo-200' : 'border-slate-100'}`}
  >
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl flex items-center justify-center ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
          <Pill size={28} />
        </div>
        <div>
          <h4 className="font-bold text-xl text-slate-900 leading-tight mb-1">{med.name}</h4>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider inline-block ${active ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {med.dosage}
          </span>
        </div>
      </div>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex-1 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400"><FileText size={18} /></div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instructions</p>
          <p className="text-sm text-slate-700 font-semibold">{med.frequency} {med.duration ? `for ${med.duration}` : ''}</p>
        </div>
      </div>
      
      <div className="h-px bg-slate-200 w-full" />
      
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400"><Calendar size={18} /></div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prescription Details</p>
          <p className="text-sm text-slate-600 font-medium">Issued {new Date(prescription.createdAt).toLocaleDateString()} by Dr. {prescription.doctorId?.name}</p>
        </div>
      </div>
    </div>

    {active ? (
      <button 
        onClick={() => toast('Refill requests are handled by your pharmacy.', { icon: 'ℹ️' })}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
      >
        <RefreshCcw size={18} />
        Request Refill
      </button>
    ) : (
      <button 
        disabled
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
      >
        <CheckCircle2 size={18} />
        Completed
      </button>
    )}
  </motion.div>
);

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.getPrescriptions();
      setPrescriptions(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'pending');
  const pastPrescriptions = prescriptions.filter(p => p.status !== 'pending');

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Pill size={28} />
            </div>
            My Prescriptions
          </h1>
          <p className="text-slate-500 font-medium">Manage your active medications and view your prescription history.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="text-indigo-500" size={20} />
              Active Medications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard count={3} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <AlertCircle className="text-indigo-500" size={24} />
              Active Medications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePrescriptions.length > 0 ? (
                activePrescriptions.map((rx, rxIdx) => (
                  rx.medications?.map((med, medIdx) => (
                    <MedicationCard key={`${rx._id}-${medIdx}`} med={med} prescription={rx} active={true} index={rxIdx + medIdx} />
                  ))
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <EmptyState 
                      icon={CheckCircle2} 
                      title="No active medications" 
                      description="You don't have any active prescriptions at the moment."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <FileText className="text-slate-500" size={24} />
              Past Medications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastPrescriptions.length > 0 ? (
                pastPrescriptions.map((rx, rxIdx) => (
                  rx.medications?.map((med, medIdx) => (
                    <MedicationCard key={`${rx._id}-${medIdx}`} med={med} prescription={rx} active={false} index={rxIdx + medIdx} />
                  ))
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <EmptyState 
                      icon={FileText} 
                      title="No past prescriptions" 
                      description="Your medication history will appear here once you complete a prescription."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientPrescriptions;
