import { type TokenData } from "@/hooks/api/useTokensFromDatabase";
import { ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { ReservoirTokenSelector } from "./ReservoirTokenSelector";
import { TokenSelector } from "./TokenSelector";

interface NftCollectionInputProps {
  amount: string;
  collection: string;
  balance: string;
  iconSrc: string;
  onChooseNfts?: () => void;
  className?: string;
  children?: React.ReactNode;
  selectedToken?: TokenData;
  onTokenSelect?: (token: TokenData) => void;
  // Chain ID for Reservoir search
  chainId?: number;
  // Reservoir-specific props
  useReservoir?: boolean;
  reservoirCollections?: TokenData[];
  existingPools?: TokenData[]; // Collections that already have pools
  loadingReservoirCollections?: boolean;
  onLoadMoreReservoirCollections?: () => void;
  hasMoreReservoirCollections?: boolean;
  loadingMoreReservoirCollections?: boolean;
}

export function NftCollectionInput({
  amount,
  collection,
  balance,
  iconSrc,
  onChooseNfts,
  className = "",
  children,
  selectedToken,
  onTokenSelect,
  chainId,
  useReservoir = false,
  reservoirCollections = [],
  existingPools = [],
  loadingReservoirCollections = false,
  onLoadMoreReservoirCollections,
  hasMoreReservoirCollections = false,
  loadingMoreReservoirCollections = false,
}: NftCollectionInputProps): JSX.Element {
  const handleTokenSelect = (token: TokenData) => {
    if (onTokenSelect) {
      onTokenSelect(token);
    }
  };

  return (
    <div className={`flex flex-col items-start gap-3 p-3 w-full bg-[#f5f5f5] rounded-xl ${className}`}>
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-3 flex-1 rounded-xl">
            <div className="flex-1 font-bold text-[32px] leading-10 text-gray-900">
              {amount}
            </div>
          </div>
          <div className="inline-flex items-center justify-center gap-2 px-2 py-0">
            <div 
              className="text-xs font-semibold text-[#FF2E00] cursor-pointer"
              onClick={onChooseNfts}
            >
              Choose NFTs
            </div>
          </div>
          {useReservoir ? (
            <ReservoirTokenSelector
              collections={reservoirCollections}
              existingPools={existingPools}
              loading={loadingReservoirCollections}
              selectedToken={selectedToken}
              onSelect={handleTokenSelect}
              title="Select NFT Collection"
              chainId={chainId}
              onLoadMore={onLoadMoreReservoirCollections}
              hasMore={hasMoreReservoirCollections}
              loadingMore={loadingMoreReservoirCollections}
            >
              <Button
                variant="outline"
                className="h-10 px-3 py-0 flex items-center gap-2 bg-white rounded-3xl border border-solid border-[#d9d9d9] shadow-sm"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-black">
                  <Image
                    className="object-cover"
                    width={24}
                    height={24}
                    alt="NFT collection"
                    src={iconSrc}
                  />
                </div>
                <span className="font-medium text-gray-900">
                  {collection}
                </span>
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              </Button>
            </ReservoirTokenSelector>
          ) : (
            <TokenSelector
              tokenType="collection"
              selectedToken={selectedToken}
              onSelect={handleTokenSelect}
              title="Select Collection"
            >
              <Button
                variant="outline"
                className="h-10 px-3 py-0 flex items-center gap-2 bg-white rounded-3xl border border-solid border-[#d9d9d9] shadow-sm"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-black">
                  <Image
                    className="object-cover"
                    width={24}
                    height={24}
                    alt="NFT collection"
                    src={iconSrc}
                  />
                </div>
                <span className="font-medium text-gray-900">
                  {collection}
                </span>
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
              </Button>
            </TokenSelector>
          )}
        </div>
        <div className="flex justify-end w-full">
          <div className="text-xs text-gray-500">
            Balance: {balance}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
