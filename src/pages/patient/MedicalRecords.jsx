import React, { useState, useEffect } from 'react';
import { FolderHeart, Stethoscope, FileText, Activity, Download, Eye, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../component/SkeletonLoader';
import { EmptyState } from '../../component/EmptyState';

const getIconForType = (type) => {
  switch(type) {
    case 'diagnosis': return <Stethoscope size={24} className="text-blue-600" />;
    case 'lab_result': return <Activity size={24} className="text-emerald-600" />;
    default: return <FileText size={24} className="text-amber-600" />;
  }
};

const getBgForType = (type) => {
  switch(type) {
    case 'diagnosis': return "bg-blue-100 text-blue-800 border-blue-200";
    case 'lab_result': return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default: return "bg-amber-100 text-amber-800 border-amber-200";
  }
};

const RecordCard = ({ record, index }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="relative pl-8 md:pl-0"
  >
    {/* Timeline Line (Desktop) */}
    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>
    {/* Timeline Line (Mobile) */}
    <div className="md:hidden absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>

    <div className={`md:flex items-center justify-between w-full ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
      
      {/* Timeline Node */}
      <div className="absolute left-3 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm -translate-x-1/2 top-8 z-10"></div>

      {/* Content Card */}
      <div className="w-full md:w-[45%] mb-8 md:mb-0">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl flex items-center justify-center ${getBgForType(record.recordType).split(' ')[0]}`}>
                {getIconForType(record.recordType)}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors leading-tight mb-1">
                  {record.title || record.recordType?.replace('_', ' ')}
                </h4>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getBgForType(record.recordType)}`}>
                  {record.recordType?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Calendar size={16} className="text-slate-400" />
              {new Date(record.date || record.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <User size={16} className="text-slate-400" />
              Dr. {record.doctorId?.name || 'Unknown'} • {record.doctorId?.specialization || 'General'}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
              {record.notes || record.description || 'No additional notes provided.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
              <Eye size={18} />
              View Details
            </button>
            {record.hasAttachment && (
              <button className="flex-1 py-3 bg-primary text-white hover:bg-primary/90 border-2 border-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                <Download size={18} />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  </motion.div>
);

const PatientMedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.getMedicalRecords();
      setRecords(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === 'all' || r.recordType === filter;
    const matchesSearch = search === '' || 
      (r.title && r.title.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase())) ||
      (r.doctorId?.name && r.doctorId.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <FolderHeart size={28} />
            </div>
            Medical Records
          </h1>
          <p className="text-slate-500 font-medium">Access your clinical notes, diagnoses, and lab results securely.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <input 
          type="text" 
          placeholder="Search records by keyword, doctor..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-700 bg-white"
        />
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-700 bg-white md:w-64"
        >
          <option value="all">All Record Types</option>
          <option value="diagnosis">Diagnoses</option>
          <option value="lab_result">Lab Results</option>
          <option value="clinical_note">Clinical Notes</option>
        </select>
      </div>

      {/* Timeline Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="space-y-6">
            <SkeletonCard count={2} />
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="relative py-8 md:py-12">
            <AnimatePresence mode="popLayout">
              {filteredRecords.map((record, index) => (
                <RecordCard key={record._id} record={record} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
            <EmptyState 
              icon={FolderHeart} 
              title="No records found" 
              description={search || filter !== 'all' ? "No records match your current filters. Try adjusting your search." : "Your medical history will appear here once your doctors add records."}
              action={search || filter !== 'all' ? () => { setSearch(''); setFilter('all'); } : undefined}
              actionLabel="Clear Filters"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
