import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Loader2, Users, Stethoscope, CheckCircle2 } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import BrandLogo from '../../component/BrandLogo';
import { cn } from '../../lib/utils';

// Import custom hooks
import { useForm, useValidation, useAuth } from '../../hooks/index.js';

// Import form components
import {
    FormInput,
    PasswordInput,
    SelectField,
    FormError,
    FormSuccess,
} from '../../component/forms/index.js';

// Import validation utilities
import { validateEmailForUserType, isPasswordStrong } from '../../utils/validation/index.js';

// Import constants
import {
    GENDER_OPTIONS,
    BLOOD_GROUP_OPTIONS,
    FORM_PLACEHOLDERS,
} from '../../constants/validation.constants.js';

const Register = () => {
    const { type } = useParams(); // 'patient' or 'doctor' from URL
    
    // Initialize userType based on URL parameter
    const [userType, setUserType] = useState(type === 'patient' ? 'patient' : type === 'doctor' ? 'staff' : null);
    const [patientChoice, setPatientChoice] = useState(type === 'patient' ? 'new' : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    
    // Hospitals state
    const [hospitals, setHospitals] = useState([]);
    const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const response = await api.getHospitals();
                setHospitals(response.data.data);
            } catch (err) {
                console.error('Failed to load hospitals', err);
            } finally {
                setIsLoadingHospitals(false);
            }
        };
        fetchHospitals();
    }, []);

    // Use custom hooks for form and auth management
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: 'DOCTOR',
        phone: '',
        age: '',
        gender: '',
        bloodGroup: '',
        hospitalId: '',
    });

    const validation = useValidation();
    const { register: registerUser, isSubmitting, error: authError, message: authMessage, setError } = useAuth();

    // Check if password is strong
    const passwordIsStrong = useMemo(() => {
        return isPasswordStrong(form.formData.password);
    }, [form.formData.password]);

    // Determine if form can be submitted
    const canSubmit = useMemo(() => {
        const hasValidName = form.formData.name.trim().length >= 2;
        const emailValidation = validateEmailForUserType(form.formData.email, userType);
        const hasValidEmail = emailValidation.isValid;
        const hasPassword = form.formData.password && passwordIsStrong;

        if (userType === 'patient') {
            return hasValidName && hasValidEmail && hasPassword && form.formData.phone && form.formData.age && form.formData.gender && form.formData.hospitalId;
        } else if (userType === 'staff') {
            return hasValidName && hasValidEmail && hasPassword && form.formData.role && form.formData.hospitalId;
        }

        return false;
    }, [form.formData, userType, passwordIsStrong]);

    // Handle patient search
    const handleSearchPatient = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/patients/search/existing?query=${encodeURIComponent(query)}`);
            setSearchResults(response.data || []);
            setError('');
        } catch {
            setSearchResults([]);
            setError('Error searching patients. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Handle patient selection
    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordIsStrong) {
            setError('Please use a stronger password that satisfies all requirements.');
            return;
        }

        try {
            const payload = {
                name: form.formData.name.trim(),
                email: form.formData.email.trim(),
                password: form.formData.password,
                userType: userType,
                role: userType === 'staff' ? form.formData.role : 'PATIENT',
                hospitalId: form.formData.hospitalId,
            };

            if (userType === 'patient') {
                payload.phone = form.formData.phone;
                payload.age = parseInt(form.formData.age);
                payload.gender = form.formData.gender;
                payload.bloodGroup = form.formData.bloodGroup || null;

                if (selectedPatient) {
                    payload.existingPatientId = selectedPatient._id;
                }
            }

            // Debug log removed
            await registerUser(payload);
            
            // Redirect after successful registration
            setTimeout(() => {
                window.location.href = userType === 'patient' ? '/auth/login/patient' : '/auth/login/doctor';
            }, 2000);
        } catch (err) {
            console.error('Registration error:', err);
        }
    };

    // Reset form when user type changes
    const resetFormState = () => {
        setUserType(null);
        setPatientChoice(null);
        setSelectedPatient(null);
        form.resetForm();
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-linear-to-br from-emerald-600 to-teal-600 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)]" style={{ backgroundSize: '24px 24px' }}></div>
                <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
                   <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20 mb-8 inline-block shadow-xl">
                       <BrandLogo size="hero" showText={false} className="text-white" />
                   </div>
                   <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tight">Join MediCare</h2>
                   <p className="text-emerald-100 text-lg font-medium leading-relaxed">
                     Register to access your comprehensive healthcare management system.
                   </p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex-1 flex flex-col justify-center p-6 lg:p-12 overflow-y-auto h-screen">
                <div className="w-full max-w-xl mx-auto">
                    <Motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="text-center mb-10">
                            <div className="lg:hidden flex justify-center mb-6">
                                <BrandLogo size="hero" showText={false} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Create Account</h1>
                            <p className="text-sm text-slate-500 font-medium">Join MediCare Hospital System</p>
                        </div>

                {/* Role Selection Screen */}
                {!userType && !type && (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <p className="text-sm font-bold text-slate-700 text-center mb-6">Are you registering as:</p>
                        
                        <Motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setUserType('staff')}
                            className="w-full p-6 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group bg-white"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-200 transition-colors">
                                    <Stethoscope size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Healthcare Staff</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Doctor, Nurse, or Admin</p>
                                </div>
                            </div>
                        </Motion.button>

                        <Motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setUserType('patient')}
                            className="w-full p-6 border-2 border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-left group bg-white"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Patient</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Access your medical records</p>
                                </div>
                            </div>
                        </Motion.button>
                    </Motion.div>
                )}

                {/* Registration Form */}
                {userType && (
                    <>
                        {/* Patient Choice Screen */}
                        {userType === 'patient' && !patientChoice && (
                            <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <Motion.button
                                    type="button"
                                    onClick={resetFormState}
                                    className="text-xs text-primary font-bold mb-4 hover:underline"
                                >
                                    ← Back to role selection
                                </Motion.button>

                                <p className="text-sm font-bold text-slate-700 text-center mb-6">Do you already have a patient record at our hospital?</p>
                                
                                <Motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPatientChoice('existing')}
                                    className="w-full p-6 border-2 border-blue-200 bg-blue-50 rounded-2xl hover:border-blue-500 transition-all text-left group"
                                >
                                    <h3 className="font-bold text-slate-900 mb-2">Yes, I have an existing record</h3>
                                    <p className="text-xs text-slate-500">I'll search for my patient ID and link my account</p>
                                </Motion.button>

                                <Motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPatientChoice('new')}
                                    className="w-full p-6 border-2 border-emerald-200 bg-emerald-50 rounded-2xl hover:border-emerald-500 transition-all text-left group"
                                >
                                    <h3 className="font-bold text-slate-900 mb-2">No, create a new record</h3>
                                    <p className="text-xs text-slate-500">I'm registering for the first time</p>
                                </Motion.button>
                            </Motion.div>
                        )}

                        {/* Search Existing Patient */}
                        {userType === 'patient' && patientChoice === 'existing' && !selectedPatient && (
                            <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <Motion.button
                                    type="button"
                                    onClick={() => setPatientChoice(null)}
                                    className="text-xs text-primary font-bold mb-4 hover:underline"
                                >
                                    ← Back
                                </Motion.button>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">Search Your Record</label>
                                    <p className="text-xs text-slate-500 mb-3">Search by Patient ID, Phone Number, or Card Number</p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter patient ID or phone..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchPatient(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={18} />
                                        )}
                                    </div>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {searchResults.map((patient) => (
                                            <Motion.button
                                                key={patient._id}
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                onClick={() => handleSelectPatient(patient)}
                                                className="w-full p-4 border-2 border-slate-200 bg-white rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-slate-900">ID: {patient.patientCardNumber}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Phone: {patient.phone || 'N/A'}</p>
                                                    </div>
                                                    <CheckCircle2 className="text-primary mt-1" size={18} />
                                                </div>
                                            </Motion.button>
                                        ))}
                                    </div>
                                )}

                                {searchQuery && !isSearching && searchResults.length === 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                                        No patient records found. Try searching with a different ID or phone number.
                                    </div>
                                )}
                            </Motion.div>
                        )}

                        {/* Selected Patient Confirmation */}
                        {selectedPatient && (
                            <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <Motion.button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-xs text-primary font-bold mb-4 hover:underline"
                                >
                                    ← Change selection
                                </Motion.button>

                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Selected Patient Record</p>
                                    <p className="font-bold text-slate-900">ID: {selectedPatient.patientCardNumber}</p>
                                    {selectedPatient.phone && (
                                        <p className="text-sm text-slate-600 mt-2">Phone: {selectedPatient.phone}</p>
                                    )}
                                </div>
                            </Motion.div>
                        )}

                        {/* Main Registration Form */}
                        {userType === 'staff' || (userType === 'patient' && (patientChoice === 'new' || selectedPatient)) || type ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!type && (
                                    <Motion.button
                                        type="button"
                                        onClick={resetFormState}
                                        className="text-xs text-primary font-bold mb-4 hover:underline"
                                    >
                                        ← Back to role selection
                                    </Motion.button>
                                )}

                                {/* Error and Success Messages */}
                                <AnimatePresence>
                                    {(authError || form.errors.form) && (
                                        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <FormError error={authError || form.errors.form} />
                                        </Motion.div>
                                    )}
                                    {authMessage && (
                                        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <FormSuccess message={authMessage} />
                                        </Motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Hospital Selection Field */}
                                <Motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    {isLoadingHospitals ? (
                                        <div className="flex items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <Loader2 size={16} className="animate-spin text-primary mr-2" />
                                            <span className="text-sm text-slate-500">Loading hospitals...</span>
                                        </div>
                                    ) : (
                                        <SelectField
                                            label="Select Hospital"
                                            name="hospitalId"
                                            options={hospitals.map(h => ({ label: h.name, value: h.id }))}
                                            value={form.formData.hospitalId}
                                            onChange={form.handleChange}
                                            onBlur={() => form.handleBlur('hospitalId')}
                                            placeholder="Choose a hospital to join"
                                            required
                                        />
                                    )}
                                </Motion.div>

                                {/* Full Name Field */}
                                <Motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <FormInput
                                        label="Full Name"
                                        name="name"
                                        placeholder={userType === 'staff' ? 'Dr. John Smith' : FORM_PLACEHOLDERS.PATIENT_NAME}
                                        value={form.formData.name}
                                        onChange={form.handleChange}
                                        onBlur={() => form.handleBlur('name')}
                                        touched={form.touched.name}
                                        error={form.formData.name && form.touched.name && form.formData.name.trim().length < 2 ? 'Name must be at least 2 characters' : null}
                                        required
                                    />
                                </Motion.div>

                                {/* Email Field */}
                                <Motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <FormInput
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        placeholder={userType === 'staff' ? 'doctor@hospital.com' : 'yourname@gmail.com'}
                                        value={form.formData.email}
                                        onChange={form.handleChange}
                                        onBlur={() => form.handleBlur('email')}
                                        touched={form.touched.email}
                                        error={validation.fieldErrors.email}
                                        required
                                    />
                                </Motion.div>

                                {/* Password Field */}
                                <Motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <PasswordInput
                                        label="Password"
                                        name="password"
                                        placeholder="Create a strong password"
                                        value={form.formData.password}
                                        onChange={form.handleChange}
                                        onBlur={() => form.handleBlur('password')}
                                        touched={form.touched.password}
                                        error={validation.fieldErrors.password}
                                        required
                                        showStrength={true}
                                    />
                                </Motion.div>

                                {/* Role Selection (Staff only) */}
                                {userType === 'staff' && !type && (
                                    <Motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        <SelectField
                                            label="Your Role"
                                            name="role"
                                            options={[
                                                { label: 'Doctor', value: 'DOCTOR' },
                                                { label: 'Nurse', value: 'NURSE' },
                                                { label: 'Administrator', value: 'ADMIN' },
                                                { label: 'Other Staff', value: 'STAFF' },
                                            ]}
                                            value={form.formData.role}
                                            onChange={form.handleChange}
                                            onBlur={() => form.handleBlur('role')}
                                            placeholder="Select your role"
                                            required
                                        />
                                    </Motion.div>
                                )}

                                {/* Patient Specific Fields */}
                                {userType === 'patient' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Phone Field */}
                                        <Motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.25 }}
                                        >
                                            <FormInput
                                                label="Phone Number"
                                                name="phone"
                                                type="tel"
                                                placeholder={FORM_PLACEHOLDERS.PHONE}
                                                value={form.formData.phone}
                                                onChange={form.handleChange}
                                                onBlur={() => form.handleBlur('phone')}
                                                touched={form.touched.phone}
                                                error={validation.fieldErrors.phone}
                                                required
                                            />
                                        </Motion.div>

                                        {/* Age Field */}
                                        <Motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <FormInput
                                                label="Age"
                                                name="age"
                                                type="number"
                                                placeholder="25"
                                                value={form.formData.age}
                                                onChange={form.handleChange}
                                                onBlur={() => form.handleBlur('age')}
                                                touched={form.touched.age}
                                                error={validation.fieldErrors.age}
                                                required
                                            />
                                        </Motion.div>

                                        {/* Gender Field */}
                                        <Motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.35 }}
                                        >
                                            <SelectField
                                                label="Gender"
                                                name="gender"
                                                options={GENDER_OPTIONS}
                                                value={form.formData.gender}
                                                onChange={form.handleChange}
                                                onBlur={() => form.handleBlur('gender')}
                                                placeholder="Select your gender"
                                                error={validation.fieldErrors.gender}
                                                required
                                            />
                                        </Motion.div>

                                        {/* Blood Group Field */}
                                        <Motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <SelectField
                                                label="Blood Group (Optional)"
                                                name="bloodGroup"
                                                options={BLOOD_GROUP_OPTIONS}
                                                value={form.formData.bloodGroup}
                                                onChange={form.handleChange}
                                                placeholder="Not specified"
                                            />
                                        </Motion.div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Motion.button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                                    whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                                    className={cn(
                                        'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                                        canSubmit
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-lg hover:shadow-primary/40'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Create Account
                                        </>
                                    )}
                                </Motion.button>
                            </form>
                        ) : null}
                    </>
                )}
                        
                <div className="text-center text-sm text-slate-600 mt-8">
                            Already have an account?{' '}
                            <Link to="/auth/login" className="text-primary font-bold hover:underline">
                                Login here
                            </Link>
                        </div>
                    </Motion.div>
                </div>
            </div>
        </div>
    );
};

export default Register;
