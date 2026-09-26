import React, { useState } from 'react';
import { Calendar, ChevronDown, X, Clock, CalendarDays, Filter } from 'lucide-react';

export type DatePreset =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'CUSTOM';

export interface DateFilterState {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface DateRangeFilterProps {
  filter: DateFilterState;
  onChange: (newFilter: DateFilterState) => void;
  label?: string;
  compact?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Utility to check if a date string falls within the selected date filter
 */
export function isDateInFilter(dateString?: string | null, filter?: DateFilterState): boolean {
  if (!dateString || !filter || filter.preset === 'ALL') return true;

  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return true; // fallback if invalid

  const now = new Date();
  
  // Set start of today (local time)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter.preset) {
    case 'TODAY': {
      return targetDate >= startOfToday && targetDate <= endOfToday;
    }
    case 'YESTERDAY': {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return targetDate >= startOfYesterday && targetDate <= endOfYesterday;
    }
    case 'LAST_7_DAYS': {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // past 7 days inclusive
      return targetDate >= sevenDaysAgo && targetDate <= endOfToday;
    }
    case 'LAST_30_DAYS': {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // past 30 days inclusive
      return targetDate >= thirtyDaysAgo && targetDate <= endOfToday;
    }
    case 'THIS_MONTH': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return targetDate >= startOfMonth && targetDate <= endOfMonth;
    }
    case 'CUSTOM': {
      let isMatch = true;
      if (filter.startDate) {
        const [y, m, d] = filter.startDate.split('-').map(Number);
        const startCustom = new Date(y, m - 1, d, 0, 0, 0, 0);
        if (targetDate < startCustom) isMatch = false;
      }
      if (filter.endDate) {
        const [y, m, d] = filter.endDate.split('-').map(Number);
        const endCustom = new Date(y, m - 1, d, 23, 59, 59, 999);
        if (targetDate > endCustom) isMatch = false;
      }
      return isMatch;
    }
    default:
      return true;
  }
}

/**
 * Formats a date string into readable short format e.g. "Sep 22, 2026"
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  filter,
  onChange,
  label = 'Date Filter',
  compact = false,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(filter.startDate);
  const [tempEndDate, setTempEndDate] = useState(filter.endDate);

  const presets: { id: DatePreset; label: string }[] = [
    { id: 'ALL', label: 'All Time' },
    { id: 'TODAY', label: 'Today' },
    { id: 'YESTERDAY', label: 'Yesterday' },
    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'CUSTOM', label: 'Custom Range' },
  ];

  const getPresetLabel = (p: DatePreset) => {
    switch (p) {
      case 'ALL':
        return 'All Time';
      case 'TODAY':
        return 'Today';
      case 'YESTERDAY':
        return 'Yesterday';
      case 'LAST_7_DAYS':
        return 'Last 7 Days';
      case 'LAST_30_DAYS':
        return 'Last 30 Days';
      case 'THIS_MONTH':
        return 'This Month';
      case 'CUSTOM':
        if (filter.startDate && filter.endDate) {
          return `${filter.startDate} to ${filter.endDate}`;
        }
        if (filter.startDate) return `From ${filter.startDate}`;
        if (filter.endDate) return `Until ${filter.endDate}`;
        return 'Custom Date';
    }
  };

  const handleSelectPreset = (p: DatePreset) => {
    if (p === 'CUSTOM') {
      onChange({
        preset: 'CUSTOM',
        startDate: tempStartDate || new Date().toISOString().split('T')[0],
        endDate: tempEndDate || new Date().toISOString().split('T')[0],
      });
    } else {
      onChange({
        preset: p,
        startDate: '',
        endDate: '',
      });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({
      preset: 'CUSTOM',
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    setIsOpen(false);
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange({
      preset: 'ALL',
      startDate: '',
      endDate: '',
    });
    setTempStartDate('');
    setTempEndDate('');
    setIsOpen(false);
  };

  const isFiltered = filter.preset !== 'ALL';

  return (
    <div className={`relative inline-block text-xs ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-2xs ${
            isFiltered
              ? 'bg-amber-500 text-stone-950 border-amber-600 font-semibold ring-1 ring-amber-400/50'
              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 hover:border-stone-400'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${isFiltered ? 'text-stone-950' : 'text-stone-500'}`} />
          <span>{getPresetLabel(filter.preset)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Reset X Button if filtered */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            title="Clear date filter (Reset to All Time)"
            className="p-1.5 text-stone-400 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-100 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute z-50 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl p-3 w-72 text-xs animate-in fade-in zoom-in-95 duration-100 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
              <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                <span>Filter by Date</span>
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-amber-700 hover:underline font-medium"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                    filter.preset === p.id
                      ? 'bg-stone-900 text-white font-medium'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Form */}
            {filter.preset === 'CUSTOM' && (
              <form onSubmit={handleApplyCustom} className="pt-2 border-t border-stone-100 space-y-2.5">
                <div className="text-[11px] font-semibold text-stone-700">Custom Date Range</div>
                
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[10px] text-stone-500 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="w-full p-1.5 rounded border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-500 font-medium">End Date</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="w-full p-1.5 rounded border border-stone-300 text-xs bg-white text-stone-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectPreset('ALL');
                    }}
                    className="px-2.5 py-1 text-stone-600 hover:bg-stone-100 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-stone-900 text-white font-semibold rounded text-[11px] hover:bg-stone-800"
                  >
                    Apply Range
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};
