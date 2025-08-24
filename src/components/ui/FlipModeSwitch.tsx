import { HelpCircleIcon } from "lucide-react";

interface FlipModeSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export function FlipModeSwitch({
  value,
  onChange,
  className = "",
}: FlipModeSwitchProps): JSX.Element {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm">Flip mode</span>
        <HelpCircleIcon className="w-4 h-4 text-gray-400" />
      </div>
      <div 
        className={`flex items-center relative w-12 h-6 ${value ? 'bg-[#FF2E00]' : 'bg-gray-200'} rounded-full cursor-pointer`}
        onClick={() => onChange(!value)}
      >
        {value && (
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div 
          className={`absolute w-4 h-4 bg-white rounded-full transform -translate-y-1/2 transition-all duration-200 
          ${value ? 'right-1' : 'left-1'} top-1/2`}
        >
          {!value && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">✕</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
