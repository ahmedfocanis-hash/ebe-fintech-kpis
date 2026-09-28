import React from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { 
  ChevronsRight, 
  Calculator, 
  Printer, 
  LogOut 
} from 'lucide-react';

export default function Header({ 
  onOpenWeightModal, 
  activeView, 
  setActiveView 
}) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const handlePrint = () => {
    window.print();
  };

  const getRoleLabel = () => {
    if (currentUser.role === 'TEAM_LEAD') return 'Team Lead BA';
    if (currentUser.role === 'EXECUTIVE_AUDITOR') return 'Executive Manager';
    return `${currentUser.level || 'Fintech'} BA`;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#032125] text-white border-b border-[#0b363b] h-16 shrink-0 no-print select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        
        {/* Brand & Double-Chevron Mark */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#00191c] border border-[#0b363b] flex items-center justify-center text-[#abffae]">
              <ChevronsRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-[475] text-sm tracking-wide text-white">EBE FINTECH</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0b363b] text-[#abffae] border border-[#0b363b]">
                  Q3 2026
                </span>
              </div>
              <div className="text-[11px] text-[#a1c2c6] font-[475] hidden sm:block leading-none mt-0.5">
                BA Performance Evaluation System
              </div>
            </div>
          </div>

          {/* Subtitle / Context */}
          <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-[#0b363b]">
            <span className="text-xs text-[#a1c2c6] font-[475]">
              {currentUser.role === 'EMPLOYEE' && 'Personal KPI Performance Scorecard'}
              {currentUser.role === 'TEAM_LEAD' && 'Team Lead Evaluation & Governance Hub'}
              {currentUser.role === 'EXECUTIVE_AUDITOR' && 'Executive Performance Audit & Sign-Off Panel'}
            </span>
          </div>
        </div>

        {/* Action Controls & User Pill */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Scoring Rules Pill Button */}
          <button
            type="button"
            onClick={onOpenWeightModal}
            className="rounded-full px-3.5 py-1.5 text-xs font-[475] border border-[#0b363b] bg-[#032125] text-[#a1c2c6] hover:text-white hover:border-[#abffae] hover:shadow-glow-verdant transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-[#abffae]" />
            <span className="hidden md:inline">Scoring Rules</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-full px-3.5 py-1.5 text-xs font-[475] border border-[#0b363b] bg-[#032125] text-[#a1c2c6] hover:text-white hover:border-[#a1c2c6] transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print / PDF</span>
          </button>

          {/* User Profile Pill Badge */}
          <div className="flex items-center pl-2 sm:pl-3 border-l border-[#0b363b]">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-[2px] bg-[#0b363b] border border-[#0b363b] mr-2">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                role={currentUser.role}
                level={currentUser.level}
                className="w-6 h-6 rounded-[6px] object-cover"
                initialsClassName="text-[10px] font-bold"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-[475] text-white leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#a1c2c6] font-mono leading-none mt-1">
                  {getRoleLabel()}
                </div>
              </div>
            </div>

            {/* Pill Logout Button */}
            <button
              type="button"
              onClick={logout}
              title="Log Out of Portal"
              className="rounded-full px-3 py-1.5 bg-[#00191c] hover:bg-[#863d1c] text-[#a1c2c6] hover:text-white border border-[#0b363b] hover:border-[#863d1c] text-xs font-[475] transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
