import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

/**
 * The split layout used by the account pages (forgot password, verify email):
 * gradient brand panel on the left (desktop only) and the content card on the right.
 */
const AuthSplitLayout = ({ tagline, title, subtitle, children }) => (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-linear-to-br from-blue-600 to-emerald-600 text-white p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)]" style={{ backgroundSize: '24px 24px' }}></div>
            <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
                <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20 mb-8 inline-block shadow-xl">
                    <BrandLogo size="hero" showText={false} />
                </div>
                <h2 className="text-4xl font-extrabold mb-4 text-white tracking-tight">MediCare System</h2>
                <p className="text-blue-100 text-lg font-medium leading-relaxed">{tagline}</p>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="lg:hidden flex justify-center mb-6">
                    <BrandLogo size="hero" showText={false} />
                </div>
                {(title || subtitle) && (
                    <div className="text-center mb-8">
                        {title && <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{title}</h1>}
                        {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
                    </div>
                )}
                {children}
            </motion.div>
        </div>
    </div>
);

export default AuthSplitLayout;
