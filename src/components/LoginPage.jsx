import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { 
  ChevronsRight, 
  LogIn, 
  KeyRound, 
  ShieldCheck, 
  Award, 
  Users, 
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const USER_CREDENTIALS = {
  'a.hashim@ebetech.com.eg': 'Hashim#Lead2026!',
  'a.nasser@ebetech.com.eg': 'Nasser@Exec2026!',
  'nour.asser@ebe.com.eg': 'Asser#Audit2026!',
  'youssif.ali@ebetech.com.eg': 'Yousef*Sr2026!',
  'aly.alaaEldin@ebetech.com.eg': 'Aly@Jr2026!',
  'rawan.mohamed@ebetech.com.eg': 'Rawan#Jr2026!',
  'rawan.mohamed@ebe.com.eg': 'Rawan#Jr2026!'
};

export default function LoginPage() {
  const { login, users } = useAuth();
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
      setError(res.message || 'Invalid email or password');
    }
  };

  const handleQuickSignIn = async (userEmail) => {
    setError('');
    const userPass = USER_CREDENTIALS[userEmail] || 'password123';
    setEmail(userEmail);
    setPassword(userPass);
    setSubmitting(true);
    const res = await login({ email: userEmail, password: userPass });
    setSubmitting(false);
    if (!res.success) {
      setError(res.message || 'Sign in failed');
    }
  };

  const teamLead = users.find(u => u.role === 'TEAM_LEAD') || {
    name: 'Ahmed Hashim',
    email: 'a.hashim@ebetech.com.eg',
    role: 'TEAM_LEAD',
    level: 'Lead',
    title: 'Team Lead BA',
    avatar: '/avatars/a.hashim.png'
  };

  const bas = users.filter(u => u.role === 'EMPLOYEE').length > 0
    ? users.filter(u => u.role === 'EMPLOYEE')
    : [
        { name: 'Yousef Ali', email: 'youssif.ali@ebetech.com.eg', role: 'EMPLOYEE', level: 'Senior', avatar: '/avatars/youssif.ali.png' },
        { name: 'ALy Alaa', email: 'aly.alaaEldin@ebetech.com.eg', role: 'EMPLOYEE', level: 'Junior', avatar: '/avatars/aly.alaaEldin.png' },
        { name: 'Rawan Mohamed', email: 'rawan.mohamed@ebetech.com.eg', role: 'EMPLOYEE', level: 'Junior', avatar: '/avatars/rawan.mohamed.png' }
      ];

  const managers = users.filter(u => u.role === 'EXECUTIVE_AUDITOR').length > 0
    ? users.filter(u => u.role === 'EXECUTIVE_AUDITOR')
    : [
        { name: 'Ahmed Nasser', email: 'a.nasser@ebetech.com.eg', role: 'EXECUTIVE_AUDITOR', level: 'Lead', avatar: '/avatars/a.nasser.png' },
        { name: 'Nour Asser', email: 'nour.asser@ebe.com.eg', role: 'EXECUTIVE_AUDITOR', level: 'Lead', avatar: '/avatars/nour.asser.png' }
      ];

  return (
    <div className="min-h-screen bg-[#fffcf6] text-[#032125] flex flex-col font-sans">
      
      {/* Editorial Top Hero Banner - Dark Spruce Forest */}
      <div className="bg-[#032125] text-white border-b border-[#0b363b] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-[2px] bg-[#00191c] border border-[#0b363b]">
              <div className="w-5 h-5 rounded-[2px] bg-[#0b363b] flex items-center justify-center text-[#abffae]">
                <ChevronsRight className="w-3.5 h-3.5" />
              </div>
              <span className="font-[475] text-xs tracking-wider text-white">EBE FINTECH GOVERNANCE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0b363b] text-[#abffae]">
                CYCLE Q3 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-[475] tracking-tight text-white leading-tight">
              Fintech BA <span className="text-[#abffae]">KPI Performance</span> Evaluation System
            </h1>
            <p className="text-sm text-[#a1c2c6] font-[475] max-w-2xl leading-relaxed">
              Standardized evaluation framework across 7 weighted categories and 27 granular sub-criteria. Connecting team self-assessments, lead reviews, and executive audit sign-off.
            </p>
          </div>

          <div className="flex md:flex-col items-end justify-between md:justify-center shrink-0 border-t md:border-t-0 md:border-l border-[#0b363b] pt-4 md:pt-0 md:pl-8 text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#a1c2c6] font-mono">Architecture</span>
            <span className="text-sm text-white font-[475] mt-0.5">Dark Spruce & Cream</span>
            <span className="text-xs text-[#abffae] font-mono mt-1">6 Active Accounts</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Surface on Cream Paper */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Credentials Form */}
          <div className="lg:col-span-5 bg-white border border-[#ebebeb] rounded-[2px] p-6 sm:p-7">
            <div className="flex items-center space-x-2.5 mb-6 pb-4 border-b border-[#ebebeb]">
              <div className="p-2 bg-[#fffcf6] border border-[#ebebeb] rounded-[2px] text-[#032125]">
                <KeyRound className="w-4 h-4 text-[#032125]" />
              </div>
              <div>
                <h2 className="text-sm font-[475] text-[#032125] uppercase tracking-wider">
                  Corporate Authentication
                </h2>
                <p className="text-xs text-[#354d51] font-[475]">Sign in with authorized staff credentials</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#fdf0e9] border border-[#863d1c]/30 rounded-[2px] text-xs text-[#863d1c] mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-[475] text-[#032125] mb-1.5">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. a.hashim@ebetech.com.eg"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#ebebeb] rounded-[2px] text-[#032125] text-sm focus-glow placeholder-[#437278]/60 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-[475] text-[#032125] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter corporate password..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#ebebeb] rounded-[2px] text-[#032125] text-sm focus-glow placeholder-[#437278]/60 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#abffae] hover:bg-[#96f799] text-[#032125] rounded-full text-xs font-[475] transition-all flex items-center justify-center space-x-2 border border-[#abffae] focus-glow cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[11px] text-[#354d51] leading-relaxed">
                  Or select any profile from the right for instant 1-click authentication.
                </span>
              </div>
            </form>
          </div>

          {/* Right Column: 1-Click Quick Demo Sign-In Cards */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#ebebeb]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#863d1c]" />
                <h2 className="text-xs font-[475] text-[#032125] uppercase tracking-wider">
                  Quick Access Directory (6 Roles)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#123a88] bg-[#e2f4ff] px-2 py-0.5 rounded-[2px] border border-[#ebebeb]">
                Instant Switch
              </span>
            </div>

            {/* Role Group 1: Team Lead BA (Ahmed Hashim) */}
            <div className="space-y-2">
              <div className="text-[11px] font-[475] uppercase tracking-wider text-[#354d51] flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#032125]" />
                <span>Team Lead BA &bull; Primary Reviewer</span>
              </div>
              
              <button
                type="button"
                onClick={() => handleQuickSignIn(teamLead.email)}
                className="w-full text-left p-3.5 rounded-[2px] border border-[#ebebeb] bg-white hover:border-[#032125] hover:bg-[#fafafa] transition-all flex items-center justify-between group cursor-pointer focus-glow"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={teamLead.avatar}
                    name={teamLead.name}
                    role={teamLead.role}
                    level={teamLead.level}
                    className="w-10 h-10 rounded-[6px] object-cover"
                  />
                  <div>
                    <div className="font-[475] text-sm text-[#032125] flex items-center space-x-2">
                      <span>{teamLead.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-[2px] font-mono bg-[#eafde8] text-[#032125] border border-[#ebebeb]">
                        Lead Evaluator
                      </span>
                    </div>
                    <div className="text-xs text-[#354d51] font-mono mt-0.5">
                      {teamLead.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-xs text-[#032125] font-[475] shrink-0">
                  <span className="hidden sm:inline">Sign In as Lead</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#032125]" />
                </div>
              </button>
            </div>

            {/* Role Group 2: Business Analysts (3 BAs) */}
            <div className="space-y-2">
              <div className="text-[11px] font-[475] uppercase tracking-wider text-[#354d51] flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#123a88]" />
                <span>Business Analysts &bull; Self-Evaluations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {bas.map((ba) => (
                  <button
                    key={ba.email}
                    type="button"
                    onClick={() => handleQuickSignIn(ba.email)}
                    className="text-left p-3 rounded-[2px] border border-[#ebebeb] bg-white hover:border-[#123a88] hover:bg-[#fafafa] transition-all group cursor-pointer flex flex-col justify-between focus-glow"
                  >
                    <div>
                      <div className="flex items-center space-x-2.5 mb-2">
                        <Avatar
                          src={ba.avatar}
                          name={ba.name}
                          role={ba.role}
                          level={ba.level}
                          className="w-8 h-8 rounded-[6px] object-cover"
                        />
                        <div className="min-w-0">
                          <div className="font-[475] text-xs text-[#032125] group-hover:text-[#123a88] truncate">
                            {ba.name}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono border ${
                            ba.level === 'Senior' 
                              ? 'bg-[#e2f4ff] text-[#123a88] border-[#ebebeb]' 
                              : 'bg-[#fdf0e9] text-[#863d1c] border-[#ebebeb]'
                          }`}>
                            {ba.level} BA
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#354d51] font-mono truncate">
                        {ba.email}
                      </div>
                    </div>

                    <div className="mt-3 pt-1.5 border-t border-[#ebebeb] flex items-center justify-between text-[10px] text-[#437278]">
                      <span>1-Click Login</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Group 3: Executive Managers (2 Reviewers) */}
            <div className="space-y-2">
              <div className="text-[11px] font-[475] uppercase tracking-wider text-[#354d51] flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-[#863d1c]" />
                <span>Executive Management &bull; Governance & Audit Sign-Off</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {managers.map((mgr) => (
                  <button
                    key={mgr.email}
                    type="button"
                    onClick={() => handleQuickSignIn(mgr.email)}
                    className="text-left p-3.5 rounded-[2px] border border-[#ebebeb] bg-white hover:border-[#863d1c] hover:bg-[#fafafa] transition-all group flex items-center justify-between cursor-pointer focus-glow"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Avatar
                        src={mgr.avatar}
                        name={mgr.name}
                        role={mgr.role}
                        level={mgr.level}
                        className="w-9 h-9 rounded-[6px] object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-[475] text-xs text-[#032125] group-hover:text-[#863d1c] truncate">
                          {mgr.name}
                        </div>
                        <div className="text-[10px] text-[#354d51] font-mono truncate">
                          {mgr.email}
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#fdf0e9] text-[#863d1c] border border-[#ebebeb] mt-1 inline-block">
                          Executive Manager
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#437278] group-hover:translate-x-1 group-hover:text-[#863d1c] transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#ebebeb] text-center text-xs text-[#437278] font-mono">
          EBE Fintech Business Analysis System &bull; Designed under Customer.io Tokens &bull; C:\KPIs\kpis.db
        </div>
      </div>

    </div>
  );
}
