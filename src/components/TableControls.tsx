'use client'

import { ChevronDownIcon, FilterIcon, RefreshCw, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TableControlsProps {
  onRefresh?: () => void;
  loading?: boolean;
  selectedTimeframe?: '24h' | '7d' | '30d';
  onTimeframeChange?: (timeframe: '24h' | '7d' | '30d') => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export const TableControls = ({ 
  onRefresh, 
  loading, 
  selectedTimeframe = '24h', 
  onTimeframeChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search by name or address...'
}: TableControlsProps) => {
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const timeframeOptions = [
    { value: '24h' as const, label: '24h' },
    { value: '7d' as const, label: '7d' },
    { value: '30d' as const, label: '30d' },
  ];

  const handleTimeframeSelect = (timeframe: '24h' | '7d' | '30d') => {
    onTimeframeChange?.(timeframe);
    setIsTimeDropdownOpen(false);
  };
  
  return (
    <div className="flex items-end  justify-between w-full h-8 gap-2.5">
      {/* Search Input - Left side */}
      <div className="relative w-[318px] h-8">
        <div className="flex items-center h-full px-3 gap-2.5 bg-white border border-[#D9D9D9] rounded-xl">
          <SearchIcon className="w-4 h-4 text-[#434343]" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="flex-1 border-0 p-0 h-auto text-sm text-[#434343] placeholder:text-[#8C8C8C] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
        </div>
      </div>

      {/* Filter Buttons - Right side */}
      <div className="flex gap-2 h-8 justify-end">
        {/* Time Filter Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
            className="h-8 px-2 gap-2 bg-white border border-[#D9D9D9] rounded-xl hover:bg-gray-50"
          >
            <span className="text-sm font-semibold text-[#434343] leading-[15px] whitespace-nowrap">
              {selectedTimeframe}
            </span>
            <ChevronDownIcon className={`w-6 h-6 text-[#434343] transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isTimeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeframeSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    selectedTimeframe === option.value
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-[#434343]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reload Button */}
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            className="h-8 px-2 gap-2 bg-white border border-[#D9D9D9] rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#434343] ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}

        {/* Filter Button */}
        <Button className="h-8 px-2 gap-2 bg-[#FF2E00] rounded-xl hover:bg-[#e52900]">
          <FilterIcon className="w-6 h-6 text-white" />
          <span className="text-sm font-semibold text-white leading-[15px] whitespace-nowrap">
            Filter
          </span>
        </Button>
      </div>
    </div>
  );
};