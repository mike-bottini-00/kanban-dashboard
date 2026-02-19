'use client';

import * as React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MultiSelectOption {
  value: string;
  label: string;
  colorClass?: string;
  initial?: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
          selected.length > 0
            ? "bg-slate-50 dark:bg-zinc-800 border-primary/30 text-slate-900 dark:text-white"
            : "bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-700"
        )}
      >
        <span className="truncate max-w-[120px]">
          {selected.length === 0 ? label : `${label}: ${selected.length}`}
        </span>
        {selected.length > 0 && (
          <X
            className="h-3 w-3 hover:text-primary transition-colors cursor-pointer"
            onClick={clearAll}
          />
        )}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200 dark:border-zinc-800 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    isSelected
                      ? "bg-primary/5 text-primary"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {option.colorClass ? (
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0", option.colorClass)}>
                      {option.initial || option.label.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0" />
                  )}
                  <span className="flex-1 text-left capitalize font-medium">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-100 dark:border-zinc-800 mt-1 pt-1 pb-1">
              <button
                type="button"
                onClick={clearAll}
                className="w-full text-center px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-primary uppercase tracking-wider transition-colors"
              >
                Clear Selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
