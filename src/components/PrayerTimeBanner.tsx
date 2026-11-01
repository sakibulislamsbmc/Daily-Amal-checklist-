import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Volume2, Users } from 'lucide-react';
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
    <div className="w-full glass-panel rounded-3xl p-4 relative overflow-hidden bg-[#0c0c0c]/80 border border-white/10">
      
      {/* Top Bar: Next Prayer & District */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">
              চলমান: <strong className="text-emerald-300">{currentWaqt.nameBn}</strong>
            </span>
            <span className="text-[10px] text-zinc-500">•</span>
            <span className="text-[11px] text-zinc-400">
              পরবর্তী: <strong className="text-amber-300">{nextWaqt.nameBn} ({nextWaqt.azanTime})</strong>
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            বাংলাদেশ সময় (Asia/Dhaka) • <span className="text-emerald-400 font-medium">হানাফী মাযহাব অনুযায়ী আসর</span>
          </p>
        </div>

        {/* District Picker */}
        <select
          value={selectedDistrict}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="text-[11px] bg-white/5 border border-white/10 text-zinc-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {BD_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id} className="bg-black text-white">
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
                  ? 'bg-emerald-950/60 border-emerald-500/50 shadow-md shadow-emerald-950/50'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <p className={`text-[11px] font-bold ${w.isCurrent ? 'text-emerald-300' : 'text-zinc-200'}`}>
                {w.nameBn.split(' ')[0]}
              </p>

              {/* Azan Time */}
              <div className="mt-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-400 flex items-center justify-center gap-0.5 leading-none">
                  আযান
                </span>
                <p className="text-[11px] font-extrabold text-white font-mono mt-0.5 leading-tight">
                  {w.azanTime.replace(' AM', '').replace(' PM', '')}
                </p>
              </div>

              {/* Jamat Time */}
              <div className="mt-1 pt-1 border-t border-white/10">
                <span className="text-[8px] uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-0.5 leading-none">
                  জামাত
                </span>
                <p className="text-[11px] font-extrabold text-emerald-300 font-mono mt-0.5 leading-tight">
                  {w.jamatTime.replace(' AM', '').replace(' PM', '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Timings: Tahajjud, Sehri, Ishraq */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 px-1">
        <span>🌙 তাহাজ্জুদ: <strong className="text-zinc-200">{schedule.tahajjudStart}</strong></span>
        <span>•</span>
        <span>⏳ সেহরি শেষ: <strong className="text-zinc-200">{schedule.sehriEnd}</strong></span>
        <span>•</span>
        <span>☀️ ইশরাক: <strong className="text-zinc-200">{schedule.ishraq}</strong></span>
      </div>

    </div>
  );
};
