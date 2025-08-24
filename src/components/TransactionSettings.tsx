import { useTransactionSettingsContext } from '@/contexts/TransactionSettingsContext'
import { HelpCircle, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'

interface TransactionSettingsProps {
  trigger: React.ReactNode
}

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
const THREE_DAYS_IN_SECONDS = 60 * 60 * 24 * 3

export const TransactionSettings = ({ trigger }: TransactionSettingsProps) => {
  // AIDEV-NOTE: Use centralized transaction settings context
  const { 
    slippageTolerance, 
    setSlippageTolerance,
    setTransactionDeadline,
    getDeadlineInMinutes 
  } = useTransactionSettingsContext()

  const [slippageInput, setSlippageInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const slippageInputIsValid =
    slippageInput === '' || (slippageTolerance / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2)
  const deadlineInputIsValid = deadlineInput === '' || getDeadlineInMinutes().toString() === deadlineInput

  let slippageError: SlippageError | undefined
  if (slippageInput !== '' && !slippageInputIsValid) {
    slippageError = SlippageError.InvalidInput
  } else if (slippageInputIsValid && slippageTolerance < 50) { // 0.5%
    slippageError = SlippageError.RiskyLow
  } else if (slippageInputIsValid && slippageTolerance > 1000) { // 10%
    slippageError = SlippageError.RiskyHigh
  } else {
    slippageError = undefined
  }

  let deadlineError: DeadlineError | undefined
  if (deadlineInput !== '' && !deadlineInputIsValid) {
    deadlineError = DeadlineError.InvalidInput
  } else {
    deadlineError = undefined
  }

  const parseCustomSlippage = (value: string) => {
    if (value === '' || inputRegex.test(value.replace(/\./g, '\\.'))) {
      setSlippageInput(value)

      try {
        const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString())
        if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat <= 10000) {
          setSlippageTolerance(valueAsIntFromRoundedFloat)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  const parseCustomDeadline = (value: string) => {
    setDeadlineInput(value)

    try {
      const valueAsInt: number = Number.parseInt(value) * 60
      if (!Number.isNaN(valueAsInt) && valueAsInt > 60 && valueAsInt < THREE_DAYS_IN_SECONDS) {
        setTransactionDeadline(valueAsInt)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const setPresetSlippage = (value: number) => {
    setSlippageInput('')
    setSlippageTolerance(value)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 bg-white border border-gray-200 shadow-lg" align="end">
        <div className="p-4 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* SWAPS & LIQUIDITY Section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-[#FF2E00] mb-4 uppercase tracking-wide">
              SWAPS & LIQUIDITY
            </h4>

            {/* Slippage Tolerance */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Slippage Tolerance
                </span>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-64 z-50">
                    Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Use with caution.
                  </div>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-3">
                <Button
                  size="sm"
                  variant={slippageTolerance === 100 ? "default" : "outline"}
                  className={`px-3 py-1 h-8 text-sm font-medium ${
                    slippageTolerance === 100 
                      ? 'bg-[#FF2E00] text-white hover:bg-[#FF2E00]/90' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setPresetSlippage(100)}
                >
                  1%
                </Button>
                <Button
                  size="sm"
                  variant={slippageTolerance === 200 ? "default" : "outline"}
                  className={`px-3 py-1 h-8 text-sm font-medium ${
                    slippageTolerance === 200 
                      ? 'bg-[#FF2E00] text-white hover:bg-[#FF2E00]/90' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setPresetSlippage(200)}
                >
                  2%
                </Button>
                <Button
                  size="sm"
                  variant={slippageTolerance === 500 ? "default" : "outline"}
                  className={`px-3 py-1 h-8 text-sm font-medium ${
                    slippageTolerance === 500 
                      ? 'bg-[#FF2E00] text-white hover:bg-[#FF2E00]/90' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setPresetSlippage(500)}
                >
                  5%
                </Button>
                <div className="flex items-center">
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="^[0-9]*[.,]?[0-9]{0,2}$"
                    placeholder={(slippageTolerance / 100).toFixed(2)}
                    value={slippageInput}
                    className={`w-16 h-8 text-sm px-2 ${
                      !slippageInputIsValid 
                        ? 'border-red-500 focus:border-red-500' 
                        : ![100, 200, 500].includes(slippageTolerance) 
                        ? 'border-green-500 focus:border-green-500'
                        : ''
                    }`}
                    onBlur={() => {
                      parseCustomSlippage((slippageTolerance / 100).toFixed(2))
                    }}
                    onChange={(event) => {
                      if (event.currentTarget.validity.valid) {
                        parseCustomSlippage(event.target.value.replace(/,/g, '.'))
                      }
                    }}
                  />
                  <span className="ml-1 text-sm font-medium text-[#FF2E00]">%</span>
                </div>
              </div>

              {/* Error messages */}
              {!!slippageError && (
                <p className={`text-xs mt-2 ${
                  slippageError === SlippageError.InvalidInput ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {slippageError === SlippageError.InvalidInput
                    ? 'Enter a valid slippage percentage'
                    : slippageError === SlippageError.RiskyLow
                    ? 'Your transaction may fail'
                    : 'Your transaction may be frontrun'}
                </p>
              )}

              {/* Warning message - only show if slippage is 1% or lower */}
              {slippageTolerance <= 100 && (
                <p className="text-xs text-orange-500 mt-2">
                  Your transaction may fail
                </p>
              )}
            </div>

            {/* Transaction Deadline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Tx deadline (mins)
                  </span>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity w-64 z-50">
                      Your transaction will revert if it is left confirming for longer than this time.
                    </div>
                  </div>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="^[0-9]+$"
                  placeholder={getDeadlineInMinutes().toString()}
                  value={deadlineInput}
                  className={`w-16 h-8 text-sm px-2 text-right ${
                    !!deadlineError ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  onBlur={() => {
                    parseCustomDeadline(getDeadlineInMinutes().toString())
                  }}
                  onChange={(event) => {
                    if (event.currentTarget.validity.valid) {
                      parseCustomDeadline(event.target.value)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
