import React, { useState } from 'react';

export const NotificationToggleBar: React.FC = () => {
  const [enabled, setEnabled] = useState(true);

  const handleToggle = () => {
    setEnabled(!enabled);
    if (!enabled && typeof Notification !== 'undefined') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div>
        <h4 className="text-sm font-bold text-slate-800 leading-tight">
          দৈনিক নোটিফিকেশন
        </h4>
        <p className="text-[11px] text-slate-500 font-medium">
          আপনার অভ্যাসগুলো সম্পন্ন করতে নোটিফিকেশন পান
        </p>
      </div>

      {/* iOS style toggle switch */}
      <button
        onClick={handleToggle}
        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
          enabled ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
            enabled ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
