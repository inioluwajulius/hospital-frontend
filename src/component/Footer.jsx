import { Heart, Shield, Globe, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Hospital HMS</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Next-generation hospital management system designed for efficiency, security, and patient-centric care.
            </p>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-teal-600 transition-colors">
                <Twitter size={18} />
              </button>
              <button className="text-slate-400 hover:text-teal-600 transition-colors">
                <Linkedin size={18} />
              </button>
              <button className="text-slate-400 hover:text-teal-600 transition-colors">
                <Github size={18} />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><button className="hover:text-teal-600 transition-colors">Dashboard</button></li>
              <li><button className="hover:text-teal-600 transition-colors">Patient Portal</button></li>
              <li><button className="hover:text-teal-600 transition-colors">Clinical Records</button></li>
              <li><button className="hover:text-teal-600 transition-colors">Laboratory</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Support</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><button className="hover:text-teal-600 transition-colors">Help Center</button></li>
              <li><button className="hover:text-teal-600 transition-colors">System Status</button></li>
              <li><button className="hover:text-teal-600 transition-colors">API Documentation</button></li>
              <li><button className="hover:text-teal-600 transition-colors">Security Whitepaper</button></li>
            </ul>
          </div>

          {/* Compliance */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-teal-600" />
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
                ISO 27001 CERTIFIED
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            © {currentYear} Hospital Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <button className="hover:text-slate-600 transition-colors">Privacy Policy</button>
            <button className="hover:text-slate-600 transition-colors">Terms of Service</button>
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
