import React, { useState, useEffect, useRef, useId } from 'react';
import { searchSensorCatalog, VerifiedSensor } from '../data/sensorCatalog';
import { Cpu, Radio, Zap, Sparkles, Check } from 'lucide-react';

export interface SensorAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectVerified?: (sensor: VerifiedSensor) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  id?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const SensorAutocomplete: React.FC<SensorAutocompleteProps> = ({
  value,
  onChange,
  onSelectVerified,
  placeholder = 'e.g. HC-SR04 Ultrasonic Sensor, DHT11, Arduino Uno...',
  className = '',
  inputClassName = '',
  required = false,
  id,
  leftIcon,
  rightElement,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<VerifiedSensor[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownId = useId();

  // Search catalog whenever value changes
  useEffect(() => {
    if (value && value.trim().length >= 1) {
      const results = searchSensorCatalog(value, 6);
      setSuggestions(results);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    if (newVal.trim().length >= 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = (sensor: VerifiedSensor) => {
    onChange(sensor.name);
    if (onSelectVerified) {
      onSelectVerified(sensor);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;

      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls={dropdownId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${dropdownId}-option-${highlightedIndex}` : undefined
          }
          required={required}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (value && value.trim().length >= 1 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={
            inputClassName ||
            `w-full ${leftIcon ? 'pl-10' : 'px-3.5'} ${rightElement ? 'pr-14' : 'pr-3.5'} py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors`
          }
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={dropdownId}
          role="listbox"
          aria-label="Sensor suggestions"
          className="absolute left-0 right-0 top-full mt-1.5 z-[70] bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden py-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
        >
          <li className="px-3 py-1.5 text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Verified Component Suggestions ({suggestions.length})
            </span>
            <span className="text-slate-500 font-normal">Use ↑↓ & Enter</span>
          </li>

          {suggestions.map((sensor, index) => {
            const isHighlighted = index === highlightedIndex;
            const isExactMatch = sensor.name.toLowerCase() === value.trim().toLowerCase();

            return (
              <li
                key={sensor.id}
                id={`${dropdownId}-option-${index}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelectSuggestion(sensor)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3.5 py-2.5 cursor-pointer text-xs transition-colors flex items-center justify-between gap-3 border-b border-slate-800/40 last:border-b-0 min-h-[44px] ${
                  isHighlighted
                    ? 'bg-violet-950/80 text-white'
                    : 'text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      sensor.category === 'sensors'
                        ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
                        : sensor.category === 'microcontrollers'
                        ? 'bg-sky-950/80 border-sky-800/60 text-sky-400'
                        : 'bg-violet-950/80 border-violet-800/60 text-violet-400'
                    }`}
                  >
                    {sensor.category === 'sensors' ? (
                      <Radio className="w-3.5 h-3.5" />
                    ) : sensor.category === 'microcontrollers' ? (
                      <Cpu className="w-3.5 h-3.5" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate text-slate-100">{sensor.name}</span>
                      {isExactMatch && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-mono text-violet-300/80">{sensor.categoryLabel}</span>
                      <span>·</span>
                      <span className="truncate italic">
                        Key aliases: {sensor.aliases.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 shrink-0">
                  Select
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
