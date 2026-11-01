import React, { useMemo } from 'react';
import confetti from 'canvas-confetti';
import { DayAmolState, AmolItem } from '../types';
import { calculateMuhasabaScore } from '../services/amolStorage';

interface ReferenceProgressCardProps {
  state: DayAmolState;
  allAmols: AmolItem[];
  onOpenMuhasabaDetails: () => void;
}

export const ReferenceProgressCard: React.FC<ReferenceProgressCardProps> = ({
  state,
  allAmols,
  onOpenMuhasabaDetails,
}) => {
  const score = useMemo(() => {
    return calculateMuhasabaScore(state, allAmols);
  }, [state, allAmols]);

  const completedCount = state.completedAmolIds.length;
  const remainingCount = Math.max(0, allAmols.length - completedCount);

  // Confetti when hitting 90%+
  const prevPercentage = React.useRef(score.percentage);
  React.useEffect(() => {
    if (score.percentage >= 90 && prevPercentage.current < 90) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#34d399', '#fbbf24'],
      });
    }
    prevPercentage.current = score.percentage;
  }, [score.percentage]);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score.percentage / 100) * circumference;

  return (
    <div
      onClick={onOpenMuhasabaDetails}
      className="w-full progress-card-gradient rounded-3xl p-4 text-white flex items-center gap-4 cursor-pointer hover:opacity-95 transition-all shadow-md active:scale-[0.99] cc-light-swipe"
    >
      {/* Circular Progress Gauge */}
      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="text-white/25"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="text-white transition-all duration-700 ease-out"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <span className="absolute inset-0 flex items-center justify-center text-xs font-black font-mono">
          {score.percentage}%
        </span>
      </div>

      {/* Title & Stats */}
      <div className="flex-1">
        <h4 className="text-base font-bold leading-tight tracking-tight">
          আজকের অগ্রগতি
        </h4>
        <p className="text-xs text-white/80 font-medium mt-0.5">
          {completedCount} সম্পন্ন • {remainingCount} বাকি
        </p>
      </div>

      {/* Grade badge */}
      <div className="text-right shrink-0">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/25">
          {score.gradeArabic}
        </span>
      </div>
    </div>
  );
};
