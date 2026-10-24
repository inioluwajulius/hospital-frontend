import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, FileText, Phone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { PageHeader, PrimaryButton, SearchInput, Panel, Modal, Field, TextInput, Select, SubmitRow, LoadingBlock, EmptyRow, StatusBadge } from './StaffUI';
import { getCurrentUser, listOf, patientName, errorText, formatDate } from './staffUtils';

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const EMPTY_PATIENT = { name: '', email: '', phone: '', age: '', gender: '', address: '' };

const StaffPatients = () => {
  const role = getCurrentUser()?.role;
  const canRegister = role === 'receptionist';
  const canViewRecords = role === 'nurse';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newPatient, setNewPatient] = useState(EMPTY_PATIENT);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setPatients(listOf(await api.getPatients()));
    } catch (error) {
      toast.error(errorText(error, 'Could not load patients'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [patientName(p), p.patientCardNumber, p.phone].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [patients, search]);

  const openPatient = async (patient) => {
    setSelected(patient);
    if (!canViewRecords) return;
    try {
      setRecordsLoading(true);
      setRecords(listOf(await api.get(`/medical-records/patient/${patient._id}`)));
    } catch (error) {
      setRecords([]);
      toast.error(errorText(error, 'Could not load medical records'));
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim() || !newPatient.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.createPatient({ ...newPatient, age: newPatient.age ? Number(newPatient.age) : undefined });
      const card = res?.data?.patientCardNumber;
      toast.success(card ? `Patient registered. Card number: ${card}` : 'Patient registered', { duration: 8000 });
      setIsRegisterOpen(false);
      setNewPatient(EMPTY_PATIENT);
      loadPatients();
    } catch (error) {
      toast.error(errorText(error, 'Could not register patient'));
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (e) => setNewPatient((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        icon={Users}
        title="Patients"
        description={canRegister ? 'Register walk-in patients and look up existing records.' : 'Look up patients and review their medical records.'}
        action={canRegister && (
          <PrimaryButton onClick={() => setIsRegisterOpen(true)}>
            <UserPlus size={18} /> Register Patient
          </PrimaryButton>
        )}
      />

      <div className="grid grid-cols-12 gap-6">
        <Panel className="col-span-12 lg:col-span-7">
          <div className="p-6 border-b border-slate-50">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, card number or phone..." />
          </div>
          {loading ? (
            <LoadingBlock text="Loading patients..." />
          ) : filtered.length === 0 ? (
            <EmptyRow>No patients found.</EmptyRow>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <button
                  key={p._id}
                  onClick={() => openPatient(p)}
                  className={`w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-center gap-4 ${selected?._id === p._id ? 'bg-primary/5' : ''}`}
                >
                  <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black shrink-0">
                    {patientName(p).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{patientName(p)}</p>
                    <p className="text-xs text-slate-500 font-medium">{p.patientCardNumber} · {p.phone || 'No phone'}</p>
                  </div>
                  {!p.userId && <StatusBadge tone="amber">Walk-in</StatusBadge>}
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="col-span-12 lg:col-span-5 p-6 h-fit">
          {!selected ? (
            <EmptyRow>Select a patient to see their details.</EmptyRow>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{patientName(selected)}</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CreditCard size={14} /> {selected.patientCardNumber}</p>
                  <p className="flex items-center gap-2"><Phone size={14} /> {selected.phone || '—'}</p>
                  <p>Age: {selected.age ?? '—'} · Gender: {selected.gender || '—'} · Blood group: {selected.bloodGroup || '—'}</p>
                  {selected.allergies?.length > 0 && <p className="text-red-600">Allergies: {selected.allergies.join(', ')}</p>}
                </div>
              </div>

              {canViewRecords && (
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2"><FileText size={16} /> Medical records</h4>
                  {recordsLoading ? (
                    <LoadingBlock text="Loading records..." />
                  ) : records.length === 0 ? (
                    <p className="text-sm text-slate-500">No medical records yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {records.map((r) => (
                        <div key={r._id} className="bg-slate-50 rounded-2xl p-4 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-slate-900">{r.diagnosis || 'Consultation'}</span>
                            <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                          </div>
                          {r.symptoms && <p className="text-slate-600">Symptoms: {r.symptoms}</p>}
                          {r.treatment && <p className="text-slate-600">Treatment: {r.treatment}</p>}
                          {r.vitals && (
                            <p className="text-slate-500 text-xs mt-1">
                              BP {r.vitals.bloodPressure || '—'} · HR {r.vitals.heartRate || '—'} · Temp {r.vitals.temperature || '—'}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">By {r.doctorId?.name || 'Unknown doctor'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Modal open={isRegisterOpen} title="Register walk-in patient" onClose={() => setIsRegisterOpen(false)}>
        <form onSubmit={handleRegister} className="space-y-4">
          <Field label="Full name"><TextInput name="name" value={newPatient.name} onChange={setField} required /></Field>
          <Field label="Phone number"><TextInput name="phone" type="tel" value={newPatient.phone} onChange={setField} required /></Field>
          <Field label="Email (optional)"><TextInput name="email" type="email" value={newPatient.email} onChange={setField} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Age"><TextInput name="age" type="number" min="0" max="130" value={newPatient.age} onChange={setField} /></Field>
            <Field label="Gender"><Select name="gender" value={newPatient.gender} onChange={setField} options={GENDERS} placeholder="Select" /></Field>
          </div>
          <Field label="Address (optional)"><TextInput name="address" value={newPatient.address} onChange={setField} /></Field>
          <p className="text-xs text-slate-500">
            The patient gets a card number. They can later create an online account by choosing
            "I have an existing record" and entering that card number and this phone number.
          </p>
          <div className="flex gap-3 pt-2">
            <SubmitRow onCancel={() => setIsRegisterOpen(false)} submitting={submitting} label="Register" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPatients;
