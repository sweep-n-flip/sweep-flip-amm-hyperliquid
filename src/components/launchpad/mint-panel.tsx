"use client";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AiFillCheckCircle, AiOutlineShareAlt } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { RiDiscordFill } from "react-icons/ri";
import { formatEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { NeonGradientCard } from "../ui/neon-gradient-card";
import { RainbowButton } from "../ui/rainbow-button";

// Contract ABI - exemplo simplificado para um mint NFT
const contractABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxMintPerAccount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "totalMintPerAccount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "tokensOfOwner",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function MintPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { address: userAddress, isConnected } = useAccount();
  const collectionName = process.env.NEXT_PUBLIC_COLLECTION_NAME || "SNF Genesis";
  const collectionDesc = process.env.NEXT_PUBLIC_COLLECTION_DESCRIPTION || "The first NFT collection on Hyperliquid";
  const contractAddress = process.env.NEXT_PUBLIC_COLLECTION_CONTRACT_ADDRESS as `0x${string}` | undefined;
  
  const [quantity, setQuantity] = useState(1);

  // Contract reads using wagmi
  const { data: mintPrice, isLoading: isMintPriceLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "mintPrice",
  });

  const { data: maxMintPerAccount, isLoading: isMaxMintPerAccountLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "maxMintPerAccount",
  });

  const { data: totalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "totalSupply",
  });

  const { data: totalMintedByUser, isLoading: isTotalMintedByUserLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "totalMintPerAccount",
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: tokensOfOwner, isLoading: isTokensOfOwnerLoading } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "tokensOfOwner",
    args: userAddress ? [userAddress] : undefined,
  });

  // Contract write
  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast.success(`${quantity} NFT${quantity > 1 ? "s" : ""} minted successfully!`);
        setIsModalOpen(true);
      },
      onError: (error) => {
        toast.error(`Transaction failed: ${error.message}`);
      },
    },
  });

  // Loading state
  const isContractInfoLoading = useMemo(() => {
    return (
      isMintPriceLoading ||
      isMaxMintPerAccountLoading ||
      isTotalSupplyLoading ||
      isTotalMintedByUserLoading ||
      isTokensOfOwnerLoading
    );
  }, [
    isMintPriceLoading,
    isMaxMintPerAccountLoading,
    isTotalSupplyLoading,
    isTotalMintedByUserLoading,
    isTokensOfOwnerLoading,
  ]);

  // Calculate max claimable
  const maxClaim = useMemo(() => {
    if (!maxMintPerAccount) return 0;
    
    // Use tokensOfOwner if available, fallback to totalMintedByUser
    const currentMinted = tokensOfOwner ? tokensOfOwner.length : (totalMintedByUser ? Number(totalMintedByUser) : 0);
    const remaining = Number(maxMintPerAccount) - currentMinted;
    return remaining > 0 ? remaining : 0;
  }, [maxMintPerAccount, totalMintedByUser, tokensOfOwner]);

  // Handle quantity change
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      setQuantity(1);
    } else {
      setQuantity(Math.max(1, Math.min(value, maxClaim)));
    }
  };

  // Mint button text
  const mintBtnText = useMemo(() => {
    if (isContractInfoLoading) return "Loading...";
    if (isPending) return "Minting...";
    if (maxClaim <= 0) return "Max Minted";
    
    if (mintPrice) {
      const totalPrice = mintPrice * BigInt(quantity);
      return `Mint ${quantity} NFT${quantity > 1 ? "s" : ""} (${formatEther(totalPrice)} HYPE)`;
    }
    
    return `Mint ${quantity} NFT${quantity > 1 ? "s" : ""}`;
  }, [isContractInfoLoading, isPending, maxClaim, mintPrice, quantity]);

  // Button disabled state
  const isButtonDisabled = useMemo(() => {
    return isContractInfoLoading || isPending || maxClaim <= 0 || !contractAddress;
  }, [isContractInfoLoading, isPending, maxClaim, contractAddress]);

  // Handle mint
  const handleMint = () => {
    if (!contractAddress || !mintPrice) return;
    
    const totalValue = mintPrice * BigInt(quantity);
    
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "mint",
      args: [BigInt(quantity)],
      value: totalValue,
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full items-center mt-16 mb-36 z-10">
      {isConnected && (
        <ConnectButton />
      )}
      {!isConnected && (
        <span className="text-center min-h-[50px] md:text-xl text-lg font-semibold">
          Please connect your wallet to mint
        </span>
      )}

      <div className="flex flex-1 md:flex-row flex-col items-center justify-center max-w-6xl mx-auto rounded-[20px] shadow-xl">
        <Image
          src="/img/collection-img.jpg"
          width={1200}
          height={960}
          alt={collectionName}
          className="flex flex-1 object-cover md:max-w-[60%] w-full md:w-fit h-full aspect-[6/5] md:rounded-t-none rounded-t-[20px] md:!rounded-l-[20px] rounded-l-none border-2 border-primary"
        />
        <NeonGradientCard className="md:max-w-2xl 2xl:min-w-[350px] flex flex-1 shrink-0 w-full items-center justify-center text-center select-none min-h-[500px]">
          <div className="flex flex-col justify-between w-full h-full min-h-[510px] p-6">
            
            {/* TOP SECTION  */}
              {/* SOCIALS */}
              <div className="flex gap-4 clear-start text-black ml-auto text-2xl mb-4">
                <Link href="https://x.com/SweepnFlip" target="_blank">
                  <FaXTwitter className="hover:text-primary transition-colors" />
                </Link>
                <Link href="https://discord.gg/YuvVsCk8e6" target="_blank">
                  <RiDiscordFill className="hover:text-primary transition-colors" />
                </Link>
              </div>
              
              <span className="w-fit pointer-events-none z-10 whitespace-pre-wrap text-black sm:text-4xl text-3xl font-bold leading-none tracking-tighter mb-2">
                {collectionName}
              </span>
              <span className="w-fit text-left pointer-events-none z-10 whitespace-pre-wrap text-gray-600/80 sm:text-lg text-base font-bold leading-none tracking-tighter">
                {collectionDesc}
              </span>

            {/* MIDDLE SECTION - Conteúdo variável */}
            <div className="flex flex-col gap-4">
              {/* QUANTITY SELECTOR */}
              <div className="flex border-2 px-4 border-black/50 rounded-xl flex-row items-center gap-2 my-4 text-xl">
                <button
                  aria-label="Decrease quantity"
                  className="flex bg-primary text-white w-7 h-7 !aspect-square items-center justify-center leading-none rounded-full select-none disabled:grayscale disabled:pointer-events-none hover:scale-110 active:scale-90 duration-150"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !isConnected}
                >
                  -
                </button>
                <input
                  className="w-full border- rounded-sm border-0 bg-transparent p-1 text-center text-gray-800 focus:outline-none focus:ring-0"
                  type="number"
                  min="1"
                  max={maxClaim}
                  value={quantity}
                  onChange={handleQtyChange}
                  disabled={!isConnected}
                  aria-label="Mint quantity"
                />
                <button
                  aria-label="Increase quantity"
                  className="flex bg-primary text-white w-7 h-7 !aspect-square items-center justify-center leading-none rounded-full select-none disabled:grayscale disabled:pointer-events-none hover:scale-110 active:scale-90 duration-150"
                  onClick={() => setQuantity(Math.min(quantity + 1, maxClaim))}
                  disabled={quantity >= maxClaim || !isConnected}
                >
                  +
                </button>
              </div>

              {/* MINT BUTTON / CONNECT BUTTON */}
              {!isConnected ? (
                <RainbowButton className="bg-primary rounded-md text-white font-bold px-4 py-2">
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={openConnectModal}
                        className="w-full bg-transparent border-none text-white font-bold text-base cursor-pointer"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButton.Custom>
                </RainbowButton>
              ) : (
                <RainbowButton
                  className={`${
                    isButtonDisabled ? "bg-primary/50" : "bg-primary"
                  } rounded-md text-white font-bold px-4 py-2`}
                  onClick={handleMint}
                  disabled={isButtonDisabled}
                >
                  {mintBtnText}
                </RainbowButton>
              )}
            </div>

            {/* BOTTOM SECTION */}
            <div className="flex-shrink-0 h-24 flex flex-col justify-end">
              {/* Collection Info */}
              <div className="text-black font-bold text-xl mb-2">
                Public Mint
              </div>
              
              <div className="min-h-[60px]">
                {isConnected ? (
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div>
                      Max per wallet: {maxMintPerAccount ? Number(maxMintPerAccount) : "Loading..."}
                    </div>
                    <div>
                      Your minted: {tokensOfOwner ? tokensOfOwner.length : (totalMintedByUser ? Number(totalMintedByUser) : 0)}
                    </div>
                    <div>
                      Remaining: {maxClaim}
                    </div>
                    {mintPrice && (
                      <div>
                        Price: {formatEther(mintPrice)} HYPE
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="opacity-0 h-[60px]">
                    {/* Placeholder */}
                    <div>Placeholder line 1</div>
                    <div>Placeholder line 2</div>
                    <div>Placeholder line 3</div>
                    <div>Placeholder line 4</div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </NeonGradientCard>
      </div>
      
      {/* SUCCESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex flex-col items-center text-center text-gray-600 gap-4">
              <AiFillCheckCircle className="text-primary w-20 h-20" />
              <h3 className="text-2xl font-bold">Congratulations!</h3>
              <p className="text-2xl font-bold mb-4">
                Your items were successfully minted on Hyperliquid!
              </p>
              <span className="text-lg font-medium leading-none">
                <AiOutlineShareAlt className="inline-flex w-6 h-6 mr-1" />
                Share with your frens
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `I've just minted ${quantity} ${
                    quantity === 1 ? "NFT" : "NFTs"
                  } from ${collectionName} on @hyperliquid through @sweepnflip⚡️. This is wild! Who's next? 
                   👉Check it out: hyperliquid.sweepnflip.io`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex w-fit items-center border-2 border-gray-600/20 gap-2 bg-transparent px-4 py-2 rounded-full",
                  "hover:border-primary hover:bg-primary hover:text-white duration-150"
                )}
              >
                <FaXTwitter /> Share on Twitter
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MintPanel;
