import { type TokenData } from "@/hooks/api/useTokensFromDatabase";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { TokenSelector } from "./TokenSelector";

interface CurrencyInputProps {
  amount: string;
  currency: string;
  value?: string;
  balance: string;
  iconSrc: string;
  className?: string;
  selectedToken?: TokenData;
  onTokenSelect?: (token: TokenData) => void;
  onAmountChange?: (amount: string) => void;
  onMaxClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isCalculated?: boolean; // New prop to indicate if amount is calculated
}

export function CurrencyInput({
  amount,
  currency,
  value,
  balance,
  iconSrc,
  className = "",
  selectedToken,
  onTokenSelect,
  onAmountChange,
  onMaxClick,
  disabled = false,
  placeholder = "0",
  isCalculated = false,
}: CurrencyInputProps): JSX.Element {
  const handleTokenSelect = (token: TokenData) => {
    if (onTokenSelect) {
      onTokenSelect(token);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAmountChange && !isCalculated) {
      const value = e.target.value;
      // Allow empty string, numbers, and single decimal point
      // Patterns allowed: "", "0", "0.", "0.1", ".5", "12.34", etc.
      if (value === '' || /^\.?\d*\.?\d*$/.test(value)) {
        // Prevent multiple decimal points
        if (value.split('.').length <= 2) {
          onAmountChange(value);
        }
      }
    }
  };

  const handleMaxClick = () => {
    if (onMaxClick) {
      onMaxClick();
    }
  };

  // Format amount to show maximum 8 decimal places
  const formatAmount = (amount: string): string => {
    if (!amount) return amount;
    
    // Don't format during typing - preserve user input for better UX
    // Only format completed numbers that might have excessive decimals
    if (amount.endsWith('.') || /\.\d{0,8}$/.test(amount)) {
      return amount;
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return amount;
    
    // Convert to string with max 8 decimal places and remove trailing zeros
    return numericAmount.toFixed(8).replace(/\.?0+$/, '');
  };

  return (
    <div className={`flex flex-col items-start p-3 w-full max-w-full bg-[#f5f5f5] rounded-xl ${className}`}>
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="text"
              value={formatAmount(amount)}
              onChange={handleAmountChange}
              disabled={disabled || isCalculated}
              placeholder={placeholder}
              className={`font-bold text-[32px] leading-10 text-gray-900 bg-transparent border-none outline-none w-full min-w-0 ${
                isCalculated ? 'cursor-default' : ''
              }`}
            />
          </div>
          <TokenSelector
            tokenType="erc20"
            selectedToken={selectedToken}
            onSelect={handleTokenSelect}
            title="Select Currency"
          >
            <Button
              variant="outline"
              className="h-10 px-3 py-0 flex items-center gap-2 bg-white rounded-3xl border border-solid border-[#d9d9d9] shadow-sm whitespace-nowrap"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF2E00] flex items-center justify-center">
                <Image
                  width={14} 
                  height={20}
                  alt="Currency logo"
                  src={iconSrc}
                />
              </div>
              <span className="font-medium text-gray-900">
                {currency}
              </span>
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </Button>
          </TokenSelector>
        </div>
        <div className="flex items-baseline gap-2 w-full">
          {value && (
            <div className="flex-1 text-xs text-gray-500">
              {value}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Balance: </span>
            <span 
              onClick={onMaxClick && balance !== '0' ? handleMaxClick : undefined}
              className={`${onMaxClick && balance !== '0' ? 'cursor-pointer hover:text-[#FF2E00] transition-colors' : ''}`}
            >
              {balance}
            </span>
            {onMaxClick && balance !== '0' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                className="h-auto p-0 text-xs text-[#FF2E00] hover:text-[#e52900] font-medium"
              >
                MAX
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
