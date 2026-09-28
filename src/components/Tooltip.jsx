import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function Tooltip({ text, title, position = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center ml-1.5"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-label="Criteria details tooltip"
        className="text-[#437278] hover:text-[#032125] focus:text-[#032125] focus:outline-none transition-colors p-0.5 rounded-full cursor-pointer"
      >
        <Info className="w-3.5 h-3.5 inline-block" />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-72 sm:w-80 p-3 bg-[#00191c] border border-[#0b363b] rounded-[2px] text-xs text-[#a1c2c6] left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-auto animate-in fade-in zoom-in-95 duration-100"
          role="tooltip"
        >
          {title && (
            <div className="font-[475] text-[#abffae] mb-1 border-b border-[#0b363b] pb-1 text-[11px] uppercase tracking-wider">
              {title}
            </div>
          )}
          <p className="leading-relaxed text-[#a1c2c6] font-[475]">
            {text}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0b363b]" />
        </div>
      )}
    </div>
  );
}
