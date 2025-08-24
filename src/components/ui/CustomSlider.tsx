import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
  showControls?: boolean;
  className?: string;
  disabled?: boolean;
}

export function CustomSlider({
  value,
  onChange,
  max = 100,
  step = 1,
  showControls = true,
  className = "",
  disabled = false,
}: CustomSliderProps): JSX.Element {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Memoize the percentage calculation to prevent unnecessary recalculations
  const percentage = useMemo(() => {
    if (max <= 1) return 0;
    return ((value - 1) / (max - 1)) * 100;
  }, [value, max]);

  // Memoize handlers to prevent re-creation on every render
  const handleIncrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  }, [value, step, max, onChange, disabled]);
  
  const handleDecrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(value - step, 1); // Minimum 1 for NFTs
    onChange(newValue);
  }, [value, step, onChange, disabled]);

  // Handle mouse/touch events for slider interaction
  const handleSliderClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newPercentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    
    // Convert percentage back to value (considering 1-based indexing for NFTs)
    const newValue = max <= 1 ? 1 : Math.round((newPercentage / 100) * (max - 1) + 1);
    const clampedValue = Math.max(1, Math.min(max, newValue));
    
    onChange(clampedValue);
  }, [max, onChange]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const newPercentage = Math.max(0, Math.min(100, (moveX / rect.width) * 100));
      
      // Convert percentage back to value (considering 1-based indexing for NFTs)
      const newValue = max <= 1 ? 1 : Math.round((newPercentage / 100) * (max - 1) + 1);
      const clampedValue = Math.max(1, Math.min(max, newValue));
      
      onChange(clampedValue);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [max, onChange, disabled]);

  return (
    <div className={`flex items-center gap-2.5 w-full ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {showControls && (
        <MinusCircleIcon 
          className="w-4 h-4 text-[#FF2E00] cursor-pointer hover:text-[#e52900] transition-colors" 
          onClick={handleDecrement}
        />
      )}
      <div 
        ref={sliderRef}
        className="relative flex-1 h-12 flex items-center cursor-pointer"
        onClick={handleSliderClick}
      >
        <div className="absolute w-full h-1 bg-gray-300 rounded-full" />
        <div
          className="absolute h-1 bg-[#FF2E00] rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full border-2 border-solid border-[#FF2E00] cursor-pointer hover:scale-110 transition-transform"
          style={{
            left: `${percentage}%`,
            transform: "translateX(-50%) translateY(-50%)",
            top: '50%'
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
      {showControls && (
        <PlusCircleIcon 
          className="w-4 h-4 text-[#FF2E00] cursor-pointer hover:text-[#e52900] transition-colors" 
          onClick={handleIncrement}
        />
      )}
    </div>
  );
}
