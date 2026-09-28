import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, UserCheck, Shield, Award, Users, CheckCircle, ChevronRight, X } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { users, login, switchUser, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'credentials'
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login({ email, password });
    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleQuickSelect = (user) => {
    switchUser(user.id);
    onClose();
  };

  const primaryAccounts = [
    {
      role: 'TEAM_LEAD',
      label: 'Team Lead (Reviewer)',
      email: 'ahmed.hashim@ebe.com',
      desc: 'Reviews all 12 BAs, inputs manager grades & finalizes evaluations',
      color: 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      role: 'EXECUTIVE_AUDITOR',
      label: 'Executive Auditor',
      email: 'management@ebe.com',
      desc: 'Leaderboard audit view, leaves feedback and revision requests',
      color: 'border-purple-500/40 bg-purple-950/20 hover:border-purple-500',
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      role: 'EMPLOYEE',
      level: 'Junior',
      label: 'Junior BA (Kareem Adel)',
      email: 'junior@ebe.com',
      desc: 'Assigned scorecard with Junior weighting (30% Delivery, 25% Docs)',
      color: 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      role: 'EMPLOYEE',
      level: 'Mid',
      label: 'Mid-Level BA (Sarah Mostafa)',
      email: 'mid@ebe.com',
      desc: 'Reviewed status, Top Performer score, shows finalized review view',
      color: 'border-blue-500/40 bg-blue-950/20 hover:border-blue-500',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      role: 'EMPLOYEE',
      level: 'Senior',
      label: 'Senior BA (Tarek Omar)',
      email: 'senior@ebe.com',
      desc: 'Audited status, shows full executive audit notes & sign-off trail',
      color: 'border-indigo-500/40 bg-indigo-950/20 hover:border-indigo-500',
      badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      role: 'EMPLOYEE',
      level: 'Lead',
      label: 'Lead BA (Noha Magdy)',
      email: 'leadba@ebe.com',
      desc: 'Draft scorecard with Lead weighting (25% Domain, 20% Stakeholders)',
      color: 'border-teal-500/40 bg-teal-950/20 hover:border-teal-500',
      badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Switch Role / Test Accounts</h2>
              <p className="text-xs text-slate-400">Instant access to all Fintech BA evaluation personas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'quick'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1-Click Test Personas</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'credentials'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Standard Credentials</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'quick' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Click any pre-configured seed account below to instantly switch roles:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {primaryAccounts.map(item => {
                  const userObj = users.find(u => u.email.toLowerCase() === item.email.toLowerCase());
                  const isCurrent = currentUser?.email.toLowerCase() === item.email.toLowerCase();

                  return (
                    <button
                      key={item.email}
                      onClick={() => userObj && handleQuickSelect(userObj)}
                      disabled={isCurrent}
                      className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between group ${item.color} ${
                        isCurrent ? 'ring-2 ring-emerald-500 opacity-90 cursor-default' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.badge}`}>
                            {item.label}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center text-[10px] text-emerald-400 font-medium">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-white text-sm">
                          {userObj?.name || item.label}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.email}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      {!isCurrent && (
                        <div className="flex items-center justify-end text-xs text-slate-400 group-hover:text-emerald-400 font-medium mt-2 pt-2 border-t border-slate-800/80">
                          <span>Switch to this user</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-xs text-slate-500">
                Default password for all seed accounts: <code className="text-slate-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">password123</code>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualLogin} className="space-y-4 max-w-md mx-auto py-2">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ahmed.hashim@ebe.com"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
