import { FilterIcon, RefreshCw, SearchIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TopPoolsTableControlsProps {
  onRefresh?: () => void;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export const TopPoolsTableControls = ({ 
  onRefresh, 
  loading, 
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search by name or address...'
}: TopPoolsTableControlsProps) => {
  
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
        {/* Time Period Indicator */}
        <div className="flex items-center h-8 px-3 bg-white border border-[#D9D9D9] rounded-xl">
          <span className="text-sm font-semibold text-[#434343] leading-[15px] whitespace-nowrap">
            7d
          </span>
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
