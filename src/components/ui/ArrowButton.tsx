import { ArrowDownIcon } from "lucide-react";
import { Button } from "./button";

interface ArrowButtonProps {
  onClick?: () => void;
  className?: string;
}

export function ArrowButton({ onClick, className = "" }: ArrowButtonProps): JSX.Element {
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={onClick}
        className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 w-[34px] h-[34px] p-0 bg-white rounded-full border border-solid border-[#e0e0e0] z-10 shadow-sm"
      >
        <ArrowDownIcon className="w-4 h-4 text-gray-500" />
      </Button>
    </div>
  );
}
