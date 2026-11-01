import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Volume2 } from 'lucide-react';
import { 
  BD_DISTRICTS, 
  PrayerSchedule, 
  getWaqtListWithJamat 
} from '../services/prayerTimes';

interface PrayerTimeBannerProps {
  schedule: PrayerSchedule;
  selectedDistrict: string;
  onDistrictChange: (districtId: string) => void;
  onOpenCalendarSync?: () => void;
}

export const PrayerTimeBanner: React.FC<PrayerTimeBannerProps> = ({
  schedule,
  selectedDistrict,
  onDistrictChange,
  onOpenCalendarSync,
}) => {
  const [waqts, setWaqts] = useState(() => getWaqtListWithJamat(schedule));

  useEffect(() => {
    setWaqts(getWaqtListWithJamat(schedule));
    const timer = setInterval(() => {
      setWaqts(getWaqtListWithJamat(schedule));
    }, 20000);
    return () => clearInterval(timer);
  }, [schedule]);

  const currentWaqt = waqts.find((w) => w.isCurrent) || waqts[0];
  const nextWaqt = waqts.find((w) => w.isNext) || waqts[1];

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
      
      {/* Top Header: Next Prayer & District Selection */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              চলমান: <strong className="text-emerald-600">{currentWaqt.nameBn}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">
              পরবর্তী: <strong className="text-amber-600">{nextWaqt.nameBn} ({nextWaqt.azanTime})</strong>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            বাংলাদেশ সময় (Asia/Dhaka) • <span className="text-emerald-700 font-semibold">হানাফী আসর পদ্ধতি</span>
          </p>
        </div>

        {/* District Picker */}
        <select
          value={selectedDistrict}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {BD_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id} className="bg-white text-slate-800">
              {d.nameBn}
            </option>
          ))}
        </select>
      </div>

      {/* Split Timings: Azan & Jamat Time Cards */}
      <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
        {waqts.map((w) => {
          return (
            <div
              key={w.nameBn}
              className={`p-2 rounded-2xl border transition-all ${
                w.isCurrent
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70'
              }`}
            >
              <p className={`text-[11px] font-bold ${w.isCurrent ? 'text-emerald-800' : 'text-slate-700'}`}>
                {w.nameBn.split(' ')[0]}
              </p>

              {/* Azan Time */}
              <div className="mt-1">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none block">
                  আযান
                </span>
                <p className="text-[11px] font-extrabold text-slate-800 font-mono mt-0.5 leading-tight">
                  {w.azanTime.replace(' AM', '').replace(' PM', '')}
                </p>
              </div>

              {/* Jamat Time */}
              <div className="mt-1 pt-1 border-t border-slate-200/60">
                <span className="text-[8px] uppercase tracking-wider text-emerald-600 font-bold leading-none block">
                  জামাত
                </span>
                <p className="text-[11px] font-extrabold text-emerald-700 font-mono mt-0.5 leading-tight">
                  {w.jamatTime.replace(' AM', '').replace(' PM', '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Timings: Tahajjud, Sehri, Ishraq */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
        <span>🌙 তাহাজ্জুদ: <strong className="text-slate-700">{schedule.tahajjudStart}</strong></span>
        <span>•</span>
        <span>⏳ সেহরি শেষ: <strong className="text-slate-700">{schedule.sehriEnd}</strong></span>
        <span>•</span>
        <span>☀️ ইশরাক: <strong className="text-slate-700">{schedule.ishraq}</strong></span>
      </div>

    </div>
  );
};
