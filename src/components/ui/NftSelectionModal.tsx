'use client'

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button';
import { CustomSlider } from './CustomSlider';

interface NftItem {
  id: string;
  image: string;
  name?: string;
  price: string;
  priceSymbol: string;
}

interface NftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  collectionName: string;
  collectionLogo: string;
  nftPrice: string;
  priceSymbol: string;
  availableNfts: NftItem[];
  maxSelection: number;
  initialSelectedIds?: string[];
  loading?: boolean;
}

export const NftSelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  collectionName,
  collectionLogo,
  nftPrice,
  priceSymbol,
  availableNfts,
  maxSelection,
  initialSelectedIds = [],
  loading = false
}: NftSelectionModalProps) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedNftIds, setSelectedNftIds] = useState<string[]>(initialSelectedIds);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedQuantity(initialSelectedIds.length || 1);
      setSelectedNftIds(initialSelectedIds);
    }
  }, [isOpen, initialSelectedIds]);

  // Update selected NFTs when quantity changes
  useEffect(() => {
    if (selectedQuantity > selectedNftIds.length) {
      // Add more NFTs
      const availableIds = availableNfts
        .filter(nft => !selectedNftIds.includes(nft.id))
        .map(nft => nft.id);
      
      const idsToAdd = availableIds.slice(0, selectedQuantity - selectedNftIds.length);
      setSelectedNftIds(prev => [...prev, ...idsToAdd]);
    } else if (selectedQuantity < selectedNftIds.length) {
      // Remove excess NFTs
      setSelectedNftIds(prev => prev.slice(0, selectedQuantity));
    }
  }, [selectedQuantity, selectedNftIds, availableNfts]);

  const handleNftClick = (nftId: string) => {
    if (selectedNftIds.includes(nftId)) {
      // Deselect NFT
      const newSelected = selectedNftIds.filter(id => id !== nftId);
      setSelectedNftIds(newSelected);
      setSelectedQuantity(newSelected.length);
    } else if (selectedNftIds.length < maxSelection) {
      // Select NFT
      const newSelected = [...selectedNftIds, nftId];
      setSelectedNftIds(newSelected);
      setSelectedQuantity(newSelected.length);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedNftIds);
    onClose();
  };

  const totalPrice = (parseFloat(nftPrice) * selectedQuantity).toFixed(4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img 
              src={collectionLogo} 
              alt={collectionName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {collectionName}
              </h2>
              <p className="text-sm text-gray-500">
                Select NFTs to trade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Quantity Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Quantity: {selectedQuantity} Items
              </span>
              <span className="text-sm text-gray-500">
                Total: {totalPrice} {priceSymbol}
              </span>
            </div>
            <CustomSlider
              value={selectedQuantity}
              onChange={(value) => setSelectedQuantity(value)}
              max={Math.min(maxSelection, availableNfts.length)}
              step={1}
              className="w-full"
              disabled={loading || availableNfts.length === 0}
            />
          </div>

          {/* NFT Grid */}
          {!loading && (
            <div className="grid grid-cols-3 gap-3">
              {availableNfts.map((nft) => {
                const isSelected = selectedNftIds.includes(nft.id);
                return (
                  <div
                    key={nft.id}
                    onClick={() => handleNftClick(nft.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-[#FF2E00] ring-2 ring-[#FF2E00] ring-opacity-20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#FF2E00] text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                        {selectedNftIds.indexOf(nft.id) + 1}
                      </div>
                    )}
                    
                    {/* NFT ID */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded z-10">
                      #{nft.id}
                    </div>

                    {/* NFT Image */}
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={nft.image}
                        alt={nft.name || `NFT #${nft.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // AIDEV-NOTE: Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-nft.svg';
                        }}
                      />
                    </div>

                    {/* Price and Name */}
                    <div className="p-3 bg-white">
                      {/* NFT Name */}
                      {nft.name && (
                        <div className="mb-1">
                          <p className="text-xs text-gray-600 truncate" title={nft.name}>
                            {nft.name}
                          </p>
                        </div>
                      )}
                      
                      {/* Price */}
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {nft.price}
                        </span>
                        <span className="text-sm text-gray-600">
                          {nft.priceSymbol}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2E00]"></div>
              <p className="text-gray-500 mt-2">Loading NFTs...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && availableNfts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No NFTs available in this pool</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${selectedQuantity} of ${maxSelection} items selected`}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={selectedQuantity === 0 || loading}
              className="bg-[#FF2E00] text-white hover:bg-[#e52900] px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
