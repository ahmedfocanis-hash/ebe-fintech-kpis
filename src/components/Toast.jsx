import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useAuth();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-[2px] border ${
        isSuccess
          ? 'bg-[#eafde8] border-[#abffae] text-[#032125]'
          : isError
          ? 'bg-[#fdf0e9] border-[#863d1c] text-[#863d1c]'
          : 'bg-[#e2f4ff] border-[#a1c2c6] text-[#123a88]'
      }`}>
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#032125] shrink-0" />}
        {isError && <AlertCircle className="w-4 h-4 text-[#863d1c] shrink-0" />}
        {!isSuccess && !isError && <Info className="w-4 h-4 text-[#123a88] shrink-0" />}

        <div className="text-xs font-[475]">
          {toast.message}
        </div>
      </div>
    </div>
  );
}
