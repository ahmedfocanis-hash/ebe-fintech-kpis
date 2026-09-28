import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronsRight, 
  LogIn, 
  KeyRound, 
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login({ email: email.trim(), password });
    setSubmitting(false);
    if (!res.success) {
      setError(res.message || 'Invalid corporate email or password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fffcf6] text-[#032125] flex flex-col font-sans">
      
      {/* Editorial Top Hero Banner - Dark Spruce Forest */}
      <div className="bg-[#032125] text-white border-b border-[#0b363b] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-[2px] bg-[#00191c] border border-[#0b363b]">
            <div className="w-5 h-5 rounded-[2px] bg-[#0b363b] flex items-center justify-center text-[#abffae]">
              <ChevronsRight className="w-3.5 h-3.5" />
            </div>
            <span className="font-[475] text-xs tracking-wider text-white">EBE FINTECH GOVERNANCE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0b363b] text-[#abffae]">
              CYCLE Q3 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-[475] tracking-tight text-white leading-tight">
            Fintech BA <span className="text-[#abffae]">KPI Performance</span> Evaluation System
          </h1>

          <p className="text-xs sm:text-sm text-[#a1c2c6] font-[475] max-w-xl mx-auto leading-relaxed">
            Enterprise evaluation portal for Business Analysts, Team Leads, and Executive Management governance.
          </p>
        </div>
      </div>

      {/* Main Workspace Surface on Cream Paper - Centered Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-md w-full bg-white border border-[#ebebeb] rounded-[2px] p-6 sm:p-8 shadow-sm">
          
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#ebebeb]">
            <div className="p-2.5 bg-[#fffcf6] border border-[#ebebeb] rounded-[2px] text-[#032125]">
              <KeyRound className="w-4 h-4 text-[#032125]" />
            </div>
            <div>
              <h2 className="text-xs font-[475] text-[#032125] uppercase tracking-wider">
                Corporate Authentication
              </h2>
              <p className="text-xs text-[#354d51] font-[475] mt-0.5">
                Sign in with authorized staff credentials
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#fdf0e9] border border-[#863d1c]/30 rounded-[2px] text-xs text-[#863d1c] mb-5 flex items-start space-x-2">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#863d1c]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-[475] text-[#032125] mb-1.5">
                Corporate Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. a.hashim@ebetech.com.eg"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ebebeb] rounded-[2px] text-[#032125] text-sm focus-glow placeholder-[#437278]/60 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-[475] text-[#032125] mb-1.5">
                Account Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter corporate password..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#ebebeb] rounded-[2px] text-[#032125] text-sm focus-glow placeholder-[#437278]/60 transition-all outline-none"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#abffae] hover:bg-[#96f799] text-[#032125] rounded-full text-xs font-[475] transition-all flex items-center justify-center space-x-2 border border-[#abffae] focus-glow cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#ebebeb] flex items-center justify-center space-x-1.5 text-[11px] text-[#354d51]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#032125]" />
            <span>Authorized Personnel Only &bull; EBE FinTech Portal</span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="py-6 border-t border-[#ebebeb] text-center text-xs text-[#437278] font-mono">
        EBE Fintech Business Analysis System &bull; Customer.io Design Tokens &bull; Confidential & Proprietary
      </div>

    </div>
  );
}
