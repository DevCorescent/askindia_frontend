import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title, value, change, changeLabel, icon, iconBg, trend = 'up',
}) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        {change !== undefined && (
          <div className="mt-1.5 flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : null}
            <span className={clsx(
              'text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
            )}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
          </div>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl', iconBg)}>
        {icon}
      </div>
    </div>
  </div>
);
