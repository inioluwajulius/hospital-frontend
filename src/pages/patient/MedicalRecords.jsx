import React, { useState, useEffect } from 'react';
import { FolderHeart, Stethoscope, FileText, Activity, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

const getIconForType = (type) => {
  switch(type) {
    case 'diagnosis': return <Stethoscope size={20} className="text-blue-600" />;
    case 'lab_result': return <Activity size={20} className="text-emerald-600" />;
    default: return <FileText size={20} className="text-amber-600" />;
  }
};

const getBgForType = (type) => {
  switch(type) {
    case 'diagnosis': return "bg-blue-100";
    case 'lab_result': return "bg-emerald-100";
    default: return "bg-amber-100";
  }
};

const RecordCard = ({ record }) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${getBgForType(record.recordType)}`}>
          {getIconForType(record.recordType)}
        </div>
        <div>
          <h4 className="font-bold text-lg text-slate-900">{record.title || record.recordType?.replace('_', ' ')}</h4>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{record.recordType}</p>
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-500">{new Date(record.date || record.createdAt).toLocaleDateString()}</span>
    </div>

    <div className="pl-14">
      <p className="text-sm text-slate-600 font-medium mb-3">By Dr. {record.doctorId?.name || 'Unknown'} • {record.doctorId?.specialization || 'General'}</p>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
        <p className="text-sm text-slate-700 leading-relaxed">{record.notes || record.description}</p>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-2 bg-white border border-slate-200 hover:border-primary text-slate-700 hover:text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
          <Eye size={16} />
          View Details
        </button>
        {record.hasAttachment && (
          <button className="flex-1 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20">
            <Download size={16} />
            Download PDF
          </button>
        )}
      </div>
    </div>
  </div>
);

const PatientMedicalRecords = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.getMedicalRecords();
      setRecords(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <FolderHeart className="text-primary" size={32} />
          Medical Records
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Access your clinical notes, diagnoses, and lab results securely.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search records by keyword, doctor, or date..." 
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
        />
        <select className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium bg-white">
          <option value="all">All Record Types</option>
          <option value="diagnosis">Diagnoses</option>
          <option value="lab">Lab Results</option>
          <option value="note">Clinical Notes</option>
        </select>
      </div>

      <div className="space-y-6">
        {records.length > 0 ? records.map(record => (
          <RecordCard key={record._id} record={record} />
        )) : (
          <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl text-slate-500">
            No medical records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecords;
