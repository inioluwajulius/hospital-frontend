import React from 'react';
import { motion as Motion } from 'framer-motion';
import { FormInput, SelectField } from '../../../component/forms/index.js';
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS, FORM_PLACEHOLDERS } from '../../../constants/validation.constants.js';

export const PatientFields = ({ form, selectedPatient }) => {
    // If selectedPatient exists, we don't render these fields
    if (selectedPatient) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    required
                />
            </Motion.div>

            <Motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <FormInput
                    label="Age"
                    name="age"
                    type="number"
                    placeholder={FORM_PLACEHOLDERS.AGE}
                    value={form.formData.age}
                    onChange={form.handleChange}
                    onBlur={() => form.handleBlur('age')}
                    touched={form.touched.age}
                    required
                />
            </Motion.div>

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
                    placeholder="Select gender"
                    required
                />
            </Motion.div>

            <Motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
            >
                <SelectField
                    label="Blood Group"
                    name="bloodGroup"
                    options={BLOOD_GROUP_OPTIONS}
                    value={form.formData.bloodGroup}
                    onChange={form.handleChange}
                    onBlur={() => form.handleBlur('bloodGroup')}
                    placeholder="Select blood group (Optional)"
                />
            </Motion.div>
        </div>
    );
};
