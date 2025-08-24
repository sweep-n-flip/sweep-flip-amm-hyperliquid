'use client'

import { useState } from "react";
import { ArrowButton } from "../components/ui/ArrowButton";
import { Button } from "../components/ui/button";
import { CurrencyInput } from "../components/ui/CurrencyInput";
import { CustomSlider } from "../components/ui/CustomSlider";
import { FlipModeSwitch } from "../components/ui/FlipModeSwitch";
import { NftCollectionInput } from "../components/ui/NftCollectionInput";
import { ProfitStats } from "../components/ui/ProfitStats";
import { TargetProfitLabel } from "../components/ui/TargetProfitLabel";

export const SweepAggregatorContent = (): JSX.Element => {
  // State for slider value
  const [sliderValue, setSliderValue] = useState(15);
  const [flipMode, setFlipMode] = useState(false);

  const swapData = {
    fromAmount: "39.15",
    fromCurrency: "ETH",
    fromBalance: "164.8596",
    fromValue: "$61012.53",
    toAmount: "27",
    toCollection: "Otherdeeds",
    toBalance: "0",
    expectedProfit: "3.0300 ETH",
    expiresIn: "180 days",
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* From Currency Input */}
      <CurrencyInput
        amount={swapData.fromAmount}
        currency={swapData.fromCurrency}
        value={swapData.fromValue}
        balance={swapData.fromBalance}
        iconSrc="/blockchain-icons.svg"
      />

      {/* Arrow Button */}
      <ArrowButton />

      {/* To NFT Input */}
      <NftCollectionInput
        amount={swapData.toAmount}
        collection={swapData.toCollection}
        balance={swapData.toBalance}
        iconSrc="/rectangle-2-7.png"
      >
        <CustomSlider
          value={sliderValue}
          onChange={setSliderValue}
        />
      </NftCollectionInput>

      {/* Flip Mode Switch */}
      <div className="flex items-center justify-between w-full px-3">
        {flipMode && <TargetProfitLabel />}
        <div className={`flex ${flipMode ? 'justify-end' : 'w-full justify-end'}`}>
          <FlipModeSwitch
            value={flipMode}
            onChange={setFlipMode}
          />
        </div>
      </div>

      {/* Expected Profit and Expiry - Only visible when Flip mode is active */}
      {flipMode && (
        <ProfitStats
          targetProfit="40%"
          expectedProfit={swapData.expectedProfit}
          expiresIn={swapData.expiresIn}
        />
      )}

      {/* Sweep Button */}
      <Button className="h-12 w-full bg-[#FF0000] text-white text-lg rounded-xl font-semibold hover:bg-[#e50000]">
        {flipMode ? 'Sweep & Flip' : 'Sweep'}
      </Button>
    </div>
  );
};
