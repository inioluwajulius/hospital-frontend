import React, { useEffect, useMemo, useState } from 'react';
import { Microscope, PlayCircle, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { PageHeader, SecondaryButton, PrimaryButton, SearchInput, Panel, Modal, Field, TextArea, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { listOf, patientName, errorText, formatDate } from './staffUtils';

const STATUS_TONES = { Pending: 'slate', 'In-Progress': 'amber', Completed: 'green' };
const PRIORITY_TONES = { Normal: 'slate', Urgent: 'amber', STAT: 'red' };
const PRIORITY_ORDER = { STAT: 0, Urgent: 1, Normal: 2 };
const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'Completed', label: 'Completed' },
];

const LabWork = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [search, setSearch] = useState('');
  const [resultFor, setResultFor] = useState(null);
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTests = async () => {
    try {
      setLoading(true);
      setTests(listOf(await api.getLabOrders()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load lab orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests
      .filter((t) => (tab === 'open' ? t.status !== 'Completed' : t.status === 'Completed'))
      .filter((t) => !q || [t.testName, patientName(t.patientId), t.category].some((v) => String(v || '').toLowerCase().includes(q)))
      // Most urgent first, then oldest first
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3) || new Date(a.createdAt) - new Date(b.createdAt));
  }, [tests, tab, search]);

  const updateTest = async (test, changes, successMessage) => {
    const res = await api.updateLabOrder(test._id, changes);
    const updated = res?.data?.data;
    setTests((prev) => prev.map((t) => (t._id === test._id ? { ...t, ...changes, ...(updated || {}), patientId: t.patientId, doctorId: t.doctorId } : t)));
    toast.success(successMessage);
  };

  const startTest = async (test) => {
    try {
      await updateTest(test, { status: 'In-Progress' }, 'Test started');
    } catch (error) {
      toast.error(errorText(error, 'Could not update the test'));
    }
  };

  const openResult = (test) => {
    setResultFor(test);
    setResult(test.result || '');
  };

  const submitResult = async (e) => {
    e.preventDefault();
    if (!result.trim()) {
      toast.error('Enter the result before completing the test');
      return;
    }
    try {
      setSubmitting(true);
      await updateTest(resultFor, { result: result.trim(), status: 'Completed' }, 'Result recorded');
      setResultFor(null);
    } catch (error) {
      toast.error(errorText(error, 'Could not save the result'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <PageHeader icon={Microscope} title="Lab Work" description="Tests ordered by doctors. Start a test, then record its result." />

      <Panel>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by test, patient or category..." />
          <div className="bg-slate-100 p-1 rounded-2xl inline-flex gap-1 self-start">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <LoadingBlock text="Loading lab orders..." />
        ) : visible.length === 0 ? (
          <EmptyRow>{tab === 'open' ? 'No open lab orders.' : 'No completed tests yet.'}</EmptyRow>
        ) : (
          <div className="divide-y divide-slate-50">
            {visible.map((t) => (
              <div key={t._id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    {t.testName}
                    <StatusBadge tone={PRIORITY_TONES[t.priority] || 'slate'}>{t.priority || 'Normal'}</StatusBadge>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {patientName(t.patientId)} · {t.category || 'Other'} · ordered {formatDate(t.createdAt)} by {t.doctorId?.name || 'unknown doctor'}
                  </p>
                  {t.result && <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-xl p-3">Result: {t.result}</p>}
                </div>
                <StatusBadge tone={STATUS_TONES[t.status] || 'slate'}>{t.status || 'Pending'}</StatusBadge>
                {t.status === 'Pending' && (
                  <SecondaryButton onClick={() => startTest(t)}><PlayCircle size={16} /> Start</SecondaryButton>
                )}
                {t.status !== 'Completed' && (
                  <PrimaryButton onClick={() => openResult(t)} className="px-4 py-2.5 rounded-xl"><ClipboardCheck size={16} /> Record result</PrimaryButton>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={!!resultFor} title={`Result: ${resultFor?.testName || ''}`} onClose={() => setResultFor(null)}>
        <form onSubmit={submitResult} className="space-y-4">
          <p className="text-sm text-slate-500">Patient: <span className="font-bold text-slate-900">{patientName(resultFor?.patientId)}</span></p>
          <Field label="Result">
            <TextArea rows={6} value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Hb 13.5 g/dL, WBC 6.2 x10^9/L ..." />
          </Field>
          <p className="text-xs text-slate-500">Saving marks the test as completed and makes the result visible to the ordering doctor.</p>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setResultFor(null)} submitting={submitting} label="Save & complete" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LabWork;
