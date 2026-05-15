import React from 'react';
import { ProjectType } from '../types';

interface UsageTrackerProps {
  featureName: ProjectType;
  used: number;
  limit: number;
}

const UsageTracker: React.FC<UsageTrackerProps> = ({ featureName, used, limit }) => {
  const isPremium = limit === Infinity;
  const percentage = !isPremium && limit > 0 ? (used / limit) * 100 : 0;
  const isLimitReached = !isPremium && used >= limit;

  const progressBarColor = isLimitReached ? 'bg-red-500' : 'bg-indigo-500';

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col justify-between h-full shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300">
      <div>
        <h4 className="font-bold text-lg text-slate-200">{featureName}</h4>
        <p className={`text-2xl font-mono font-bold mt-2 ${isLimitReached ? 'text-red-400' : 'text-white'}`}>
          {used} <span className="text-slate-400 text-lg">/ {isPremium ? '∞' : limit}</span>
        </p>
      </div>
      <div className="mt-4">
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div
            className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-slate-500 mt-1">
          {isPremium ? 'غير محدود' : `${limit - used} متبقي`}
        </p>
      </div>
    </div>
  );
};

export default UsageTracker;