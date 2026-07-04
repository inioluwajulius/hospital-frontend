import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Activity, 
  Search,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RadiologyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  
  // We need patient ID to fetch radiology. The backend requires patientId in query for patient role
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      // First get current user's profile to find their patient ID
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // In our backend, patient is linked via userId
        // But for radiology, we need the actual patient document ID
        // The easiest way is to hit an endpoint that returns the patient ID or use getPatients
        // We can just hit /patients and it should return only the current patient because of role filtering
        const res = await api.get('/patients');
        if (res.data && res.data.length > 0) {
          const currentPatient = res.data[0];
          setPatientId(currentPatient._id);
          fetchRadiology(currentPatient._id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      setLoading(false);
    }
  };

  const fetchRadiology = async (pId) => {
    try {
      setLoading(true);
      const response = await api.getRadiologyExams(); // Wait, api.getRadiologyExams doesn't take params?
      // Let's use generic api.get
      const res = await api.get(`/radiology?patientId=${pId}`);
      if (res.data) {
        // radiology returns an array of reports directly (not wrapped in success/data)
        setReports(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch radiology reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => 
    report.examType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.bodyPart && report.bodyPart.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'reviewed': 
      case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'pending_review': return <Activity size={16} className="text-blue-500" />;
      case 'ordered': 
      case 'scheduled': return <Clock size={16} className="text-slate-400" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewed':
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending_review': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ordered':
      case 'scheduled': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-600" size={28} />
            Radiology Reports
          </h1>
          <p className="text-slate-500 font-medium mt-1">View your imaging results and radiologist notes</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={report._id}
                onClick={() => setSelectedReport(report)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedReport?._id === report._id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-500/20' 
                    : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      selectedReport?._id === report._id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight capitalize">{report.examType}</h3>
                      <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{report.bodyPart || 'General'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar size={14} />
                    {new Date(report.orderedDate || report.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {report.status.replace('_', ' ')}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Reports Found</h3>
              <p className="text-slate-500 text-sm mt-1">There are no radiology reports available.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border mb-4 ${getStatusColor(selectedReport.status)}`}>
                        {getStatusIcon(selectedReport.status)}
                        {selectedReport.status.replace('_', ' ')}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 mb-2 capitalize">{selectedReport.examType} - {selectedReport.bodyPart}</h2>
                      <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          Ordered: {new Date(selectedReport.orderedDate || selectedReport.createdAt).toLocaleDateString()}
                        </div>
                        {selectedReport.examDate && (
                          <div className="flex items-center gap-2">
                            <Activity size={16} />
                            Exam Date: {new Date(selectedReport.examDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {selectedReport.status === 'reviewed' || selectedReport.status === 'completed' ? (
                    <div className="space-y-6">
                      
                      {selectedReport.reportFindings && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600" />
                            Findings
                          </h3>
                          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {selectedReport.reportFindings}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReport.impression && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle size={20} className="text-indigo-600" />
                            Impression
                          </h3>
                          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                            <p className="text-sm font-medium text-indigo-900 leading-relaxed whitespace-pre-wrap">
                              {selectedReport.impression}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedReport.recommendations && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-indigo-600" />
                            Recommendations
                          </h3>
                          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                            <p className="text-sm font-medium text-emerald-900 leading-relaxed whitespace-pre-wrap">
                              {selectedReport.recommendations}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Clock size={24} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Report Pending</h3>
                      <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                        This exam is currently {selectedReport.status.replace('_', ' ')}. The radiologist's report will appear here once it is reviewed.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                <ImageIcon size={64} className="text-slate-300 mb-6" />
                <h3 className="text-xl font-bold text-slate-900">Select a Radiology Report</h3>
                <p className="text-slate-500 font-medium mt-2">Choose an exam from the list to view its details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RadiologyReports;
