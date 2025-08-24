import { SettingsIcon } from "lucide-react";
import { AmmSwapContent } from "./AmmSwapContent";
import { SweepAggregatorContent } from "./SweepAggregatorContent";
import { TransactionSettings } from "./TransactionSettings";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LiquidityContent } from './LiquidityContent';

export const SwapWidget = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-6 z-10">
      <Card className="w-[480px] overflow-hidden">
        <Tabs defaultValue="AMM">
          <div className="flex h-[60px] items-center justify-between px-4">
            <TabsList className="bg-transparent flex w-full  border-b border-[#D9D9D9]">
             
              <TabsTrigger
                value="AMM"
                className="flex-1 font-semibold text-[#8C8C8C] text-base py-[9px] data-[state=active]:text-[#434343] data-[state=active]:border-b-2 data-[state=active]:border-[#FF2E00]"
              >
                AMM
              </TabsTrigger>

              <TabsTrigger
                value="Liquidity"
                className="flex-1 font-semibold text-[#8C8C8C] text-base py-[9px] data-[state=active]:text-[#434343] data-[state=active]:border-b-2 data-[state=active]:border-[#FF2E00]"
              >
                Liquidity
              </TabsTrigger>
            </TabsList>
            <TransactionSettings
              trigger={
                <Button variant="ghost" size="icon" className="w-8 h-8 p-0">
                  <SettingsIcon className="w-4 h-4" />
                </Button>
              }
            />
          </div>

          <TabsContent value="AMM" className="m-0">
            <AmmSwapContent />
          </TabsContent>

           <TabsContent value="Liquidity" className="m-0">
            <LiquidityContent />
          </TabsContent>

        </Tabs>
      </Card>
    </section>
  );
};
