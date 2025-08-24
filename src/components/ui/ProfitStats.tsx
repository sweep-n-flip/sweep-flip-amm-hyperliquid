import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";

interface ProfitStatsProps {
  targetProfit: string;
  expectedProfit: string;
  expiresIn: string;
  className?: string;
}

export function ProfitStats({
  targetProfit,
  expectedProfit,
  expiresIn,
  className = "",
}: ProfitStatsProps): JSX.Element {
  return (
    <div className={`flex flex-row w-full gap-2 ${className}`}>
      {/* Left Card - Target Profit and Expected Profit */}
      <div className="flex-1 p-3 bg-[#f5f5f5] rounded-xl">
        <div className="flex flex-row justify-between items-center h-full">
          <div className="flex items-center">
            <span className="text-2xl font-semibold text-[#434343]">
              {targetProfit}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#8C8C8C]">
              Expected Profit
            </span>
            <span className="text-sm font-semibold text-[#434343]">
              {expectedProfit}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right Card - Expires In */}
      <div className="flex-1 p-3 bg-[#f5f5f5] rounded-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#8C8C8C]">
              Expires in
            </span>
            <HelpCircleIcon className="w-3 h-3 text-[#8C8C8C]" />
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-[#434343]">
              {expiresIn}
            </span>
            <ChevronDownIcon className="w-4 h-4 text-[#434343]" />
          </div>
        </div>
      </div>
    </div>
  );
}
