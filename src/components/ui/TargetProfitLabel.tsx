import { HelpCircleIcon } from "lucide-react";

interface TargetProfitLabelProps {
  className?: string;
}

export function TargetProfitLabel({ className = "" }: TargetProfitLabelProps): JSX.Element {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-gray-500 text-sm">Set target profit</span>
      <HelpCircleIcon className="w-4 h-4 text-gray-400" />
    </div>
  );
}
