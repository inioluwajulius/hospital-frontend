import React, { useMemo } from 'react';
import { UserPlus, Loader2, Stethoscope, Award, Briefcase } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    DOCTOR_SPECIALIZATIONS,
    FORM_PLACEHOLDERS,
    LICENSE_FORMAT,
} from '../../constants/validation.constants.js';

const DoctorRegister = () => {
    const navigate = useNavigate();

    // Use custom hooks for form and auth management
    const form = useForm({
        name: '',
        email: '',
        password: '',
        specialization: '',
        licenseNumber: '',
        yearsOfExperience: '',
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
        const emailValidation = validateEmailForUserType(form.formData.email, 'staff');
        const hasValidEmail = emailValidation.isValid;
        const hasPassword = form.formData.password && passwordIsStrong;
        const hasSpecialization = form.formData.specialization.trim().length > 0;
        const hasLicense = form.formData.licenseNumber.trim().length > 0;
        const hasExperience = form.formData.yearsOfExperience && parseInt(form.formData.yearsOfExperience) >= 0;

        return hasValidName && hasValidEmail && hasPassword && hasSpecialization && hasLicense && hasExperience;
    }, [form.formData, passwordIsStrong]);

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
                userType: 'staff',
                role: 'DOCTOR',
                specialization: form.formData.specialization,
                licenseNumber: form.formData.licenseNumber.trim(),
                yearsOfExperience: parseInt(form.formData.yearsOfExperience),
            };

            console.log('Submitting doctor registration:', payload);
            await registerUser(payload);

            // Redirect after successful registration
            setTimeout(() => {
                window.location.href = '/auth/login/doctor';
            }, 2000);
        } catch (err) {
            console.error('Registration error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-slate-50 to-indigo-100 px-4 py-10">
            <Motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100"
            >
                <div className="text-center mb-12">
                    <Motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="flex justify-center mb-6"
                    >
                        <BrandLogo size="hero" showText={false} />
                    </Motion.div>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Doctor Registration</h1>
                        <p className="text-sm text-slate-500 font-medium">Register as a Healthcare Professional</p>
                    </Motion.div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    {/* Full Name Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <FormInput
                            label="Full Name"
                            name="name"
                            placeholder="Dr. Chioma Okafor"
                            value={form.formData.name}
                            onChange={form.handleChange}
                            onBlur={() => form.handleBlur('name')}
                            touched={form.touched.name}
                            error={form.formData.name && form.touched.name && form.formData.name.trim().length < 2 ? 'Name must be at least 2 characters' : null}
                            required
                        />
                    </Motion.div>

                    {/* Hospital Email Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <FormInput
                            label="Hospital Email"
                            name="email"
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={form.formData.email}
                            onChange={form.handleChange}
                            onBlur={() => form.handleBlur('email')}
                            touched={form.touched.email}
                            error={validation.fieldErrors.email}
                            helpText="Must use hospital domain: @hospital.com, @healthcare.com, or @medical.com"
                            required
                        />
                    </Motion.div>

                    {/* Specialization Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <SelectField
                            label="Medical Specialization"
                            name="specialization"
                            icon={Stethoscope}
                            options={DOCTOR_SPECIALIZATIONS}
                            value={form.formData.specialization}
                            onChange={form.handleChange}
                            onBlur={() => form.handleBlur('specialization')}
                            error={validation.fieldErrors.specialization}
                            placeholder="Select your specialization"
                            required
                        />
                    </Motion.div>

                    {/* Medical License Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <FormInput
                            label="Medical License Number"
                            name="licenseNumber"
                            icon={Award}
                            placeholder={LICENSE_FORMAT.EXAMPLE}
                            value={form.formData.licenseNumber}
                            onChange={form.handleChange}
                            onBlur={() => form.handleBlur('licenseNumber')}
                            touched={form.touched.licenseNumber}
                            error={validation.fieldErrors.licenseNumber}
                            helpText={LICENSE_FORMAT.HELP_TEXT}
                            required
                        />
                    </Motion.div>

                    {/* Years of Experience Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <FormInput
                            label="Years of Experience"
                            name="yearsOfExperience"
                            type="number"
                            icon={Briefcase}
                            placeholder="10"
                            min="0"
                            max="70"
                            value={form.formData.yearsOfExperience}
                            onChange={form.handleChange}
                            onBlur={() => form.handleBlur('yearsOfExperience')}
                            touched={form.touched.yearsOfExperience}
                            error={validation.fieldErrors.yearsOfExperience}
                            required
                        />
                    </Motion.div>

                    {/* Password Field */}
                    <Motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
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

                    {/* Submit Button */}
                    <Motion.button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                        whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                        className={cn(
                            'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                            canSubmit
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Register as Doctor
                            </>
                        )}
                    </Motion.button>
                </form>

                {/* Login Link */}
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="text-center text-sm text-slate-600 mt-8"
                >
                    Already registered?{' '}
                    <a href="/auth/login/doctor" className="text-blue-600 font-bold hover:underline">
                        Login here
                    </a>
                </Motion.div>

                {/* Footer */}
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-center text-xs text-slate-400 mt-6 pt-6 border-t border-slate-100"
                >
                    This is a secure healthcare system. Awaiting admin verification.
                </Motion.div>
            </Motion.div>
        </div>
    );
};

export default DoctorRegister;
