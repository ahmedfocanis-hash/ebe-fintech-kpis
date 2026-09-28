import React, { useState } from 'react';

export default function Avatar({ 
  src, 
  name = 'User', 
  role, 
  level, 
  className = 'w-10 h-10 rounded-[6px]',
  initialsClassName = 'text-xs font-[475]'
}) {
  const [hasError, setHasError] = useState(false);

  // Compute initials (e.g., "Ahmed Hashim" -> "AH")
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // Fallback palette matching Customer.io tone
  const getAvatarColors = () => {
    if (role === 'TEAM_LEAD' || level === 'Lead') {
      return 'bg-spruce-900 text-verdant-300 border border-spruce-700';
    }
    if (role === 'EXECUTIVE_AUDITOR') {
      return 'bg-spruce-abyss text-spruce-200 border border-spruce-700';
    }
    if (level === 'Senior') {
      return 'bg-wave-frost text-wave-700 border border-[#ebebeb]';
    }
    return 'bg-zest-blush text-zest-700 border border-[#ebebeb]';
  };

  // Ensure rounded-[6px] is strictly applied
  const cleanClassName = className
    .replace(/rounded-(xl|2xl|3xl|lg|md|sm|full)/g, 'rounded-[6px]')
    .replace(/shadow-(sm|md|lg|xl|2xl)/g, '');

  if (!src || hasError) {
    return (
      <div 
        className={`${cleanClassName} ${getAvatarColors()} rounded-[6px] flex items-center justify-center select-none font-mono tracking-wider shrink-0`}
        title={name}
      >
        <span className={initialsClassName}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={`${cleanClassName} rounded-[6px] object-cover shrink-0 border border-spruce-700/40`}
    />
  );
}
