import { Heart, Shield, Globe } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">MediCare</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Next-generation hospital management system designed for efficiency, security, and patient-centric care.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="/patient/dashboard" className="hover:text-emerald-600 transition-colors">Patient Portal</a></li>
              <li><a href="/doctor/dashboard" className="hover:text-emerald-600 transition-colors">Doctor Dashboard</a></li>
              <li><a href="/register" className="hover:text-emerald-600 transition-colors">Registration</a></li>
            </ul>
          </div>

          {/* Compliance */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <span className="text-xs uppercase tracking-widest">Compliance</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                HIPAA COMPLIANT
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                GDPR READY
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                DATA ENCRYPTED
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            © {currentYear} MediCare Hospital Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1">
              <Globe size={14} />
              <span>English (US)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            Built with <Heart size={10} className="text-red-400 fill-red-400" /> for Healthcare Excellence
          </div>
        </div>
      </div>
    </footer>
  );
};
