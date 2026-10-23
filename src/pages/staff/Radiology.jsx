import React, { useEffect, useMemo, useState } from 'react';
import { Activity, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { PageHeader, PrimaryButton, SearchInput, Panel, Modal, Field, TextArea, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { listOf, patientName, errorText, formatDate } from './staffUtils';

const EXAM_LABELS = { xray: 'X-Ray', ct: 'CT Scan', mri: 'MRI', ultrasound: 'Ultrasound', pet: 'PET Scan', mammography: 'Mammography', fluoroscopy: 'Fluoroscopy', other: 'Other' };
const PRIORITY_TONES = { routine: 'slate', urgent: 'amber', stat: 'red' };
const PRIORITY_ORDER = { stat: 0, urgent: 1, routine: 2 };
const isReported = (exam) => ['reviewed', 'completed'].includes(exam.status);

const EMPTY_REPORT = { reportFindings: '', impression: '', recommendations: '' };

const RadiologyDesk = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [search, setSearch] = useState('');
  const [reportFor, setReportFor] = useState(null);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [submitting, setSubmitting] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setExams(listOf(await api.getRadiologyExams()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load imaging exams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams
      .filter((e) => (tab === 'open' ? !isReported(e) : isReported(e)))
      .filter((e) => !q || [patientName(e.patientId), EXAM_LABELS[e.examType], e.bodyPart, e.examOrder].some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) || new Date(a.createdAt) - new Date(b.createdAt));
  }, [exams, tab, search]);

  const openReport = (exam) => {
    setReport(EMPTY_REPORT);
    setReportFor(exam);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!report.reportFindings.trim() || !report.impression.trim()) {
      toast.error('Findings and impression are required');
      return;
    }
    try {
      setSubmitting(true);
      await api.fileRadiologyReport(reportFor._id, report);
      toast.success('Report filed');
      setReportFor(null);
      loadExams();
    } catch (error) {
      toast.error(errorText(error, 'Could not file the report'));
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (e) => setReport((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader icon={Activity} title="Radiology" description="Imaging exams ordered by doctors. File the report once the exam is read." />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by patient, exam or order number..." />
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 self-start">
            {[['open', 'Awaiting report'], ['done', 'Reported']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <LoadingBlock text="Loading exams..." />
        ) : visible.length === 0 ? (
          <EmptyRow>{tab === 'open' ? 'No exams awaiting a report.' : 'No reported exams yet.'}</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map((exam) => (
              <div key={exam._id} className="p-5 flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    {EXAM_LABELS[exam.examType] || exam.examType}{exam.bodyPart ? ` — ${exam.bodyPart}` : ''}
                    <StatusBadge tone={PRIORITY_TONES[exam.priority] || 'slate'}>{exam.priority || 'routine'}</StatusBadge>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {patientName(exam.patientId)} · {exam.examOrder} · ordered {formatDate(exam.orderedDate || exam.createdAt)} by {exam.doctorId?.name || 'unknown doctor'}
                  </p>
                  {isReported(exam) && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-3 text-sm text-slate-700 space-y-1">
                      <p><span className="font-bold">Findings:</span> {exam.reportFindings}</p>
                      <p><span className="font-bold">Impression:</span> {exam.impression}</p>
                      {exam.recommendations && <p><span className="font-bold">Recommendations:</span> {exam.recommendations}</p>}
                      <p className="text-xs text-slate-400">Reported {formatDate(exam.reportGeneratedDate)} by {exam.radiologist?.name || 'radiologist'}</p>
                    </div>
                  )}
                </div>
                {!isReported(exam) && (
                  <PrimaryButton onClick={() => openReport(exam)} className="px-4 py-2.5 rounded-xl"><FileText size={16} /> File report</PrimaryButton>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={!!reportFor} title="File radiology report" onClose={() => setReportFor(null)}>
        <form onSubmit={submitReport} className="space-y-4">
          <p className="text-sm text-slate-500">
            {EXAM_LABELS[reportFor?.examType] || ''}{reportFor?.bodyPart ? ` — ${reportFor.bodyPart}` : ''} for{' '}
            <span className="font-bold text-slate-900">{patientName(reportFor?.patientId)}</span>
          </p>
          <Field label="Findings"><TextArea rows={5} name="reportFindings" value={report.reportFindings} onChange={setField} /></Field>
          <Field label="Impression"><TextArea name="impression" value={report.impression} onChange={setField} /></Field>
          <Field label="Recommendations (optional)"><TextArea name="recommendations" value={report.recommendations} onChange={setField} /></Field>
          <p className="text-xs text-slate-500">Filed reports can't be edited; corrections go through an administrator.</p>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setReportFor(null)} submitting={submitting} label="File report" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RadiologyDesk;
