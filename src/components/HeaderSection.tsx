'use client'

import { useChainContext } from "@/contexts/ChainContext";
import { BellIcon, ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { Separator } from "./ui/separator";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const HeaderSection = () => {
  const { selectedChainId, setSelectedChainId, selectedChain, chains, loading } = useChainContext();
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chainDropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation items data
  const navItems = [
    { label: "Swap", href: "#" },
    // { label: "Liquidity", href: "#" },
  ];
  
  // Helper function to get chain icon with fallback
  const getChainIcon = (logoUrl: string) => {
    return logoUrl || '/globe.svg';
  };

  const handleChainSelect = (chainId: number | string) => {
    setSelectedChainId(chainId);
    setIsChainDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex h-14 items-center bg-white justify-between px-6 py-0 w-full z-50 shadow-md">
      <div className="flex items-center gap-12">
        {/* Logo section */}
        <div className="flex items-center">
          <div className="relative w-[178.7px] h-10">
            <Image
              className="absolute top-[-3px] -left-px object-cover"
              width={181}
              height={45}
              alt="Sweep n' Flip Logo"
              src="/snf-logo.png"
            />
          </div>
        </div>

        {/* Navigation section */}
        <NavigationMenu>
          <NavigationMenuList className="flex items-start">
            {navItems.map((item, index) => (
              <NavigationMenuItem key={index}>
                <NavigationMenuLink
                  className="inline-flex h-8 items-center justify-center px-4 py-0 rounded-2xl text-gray-700 hover:text-[#FF2E00] transition-colors font-medium text-[14px] leading-[22px]"
                  href={item.href}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right section with user controls */}
      <div className="flex items-center gap-4">
        {/* Gas fee indicator */}


        {/* Animation icon */}
        <div className="relative w-12 h-12 rounded-[99px] overflow-hidden">
          <Image
            className="absolute"
            width={59}
            height={59}
            alt="Animation"
            src="/bolt.gif"
            unoptimized // Use unoptimized for GIFs to preserve animation
          />
        </div>

        {/* Separator */}
        <Separator orientation="vertical" className="h-6" />

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative w-8 h-8 hover:bg-gray-100">
          <BellIcon className="w-5 h-5 text-gray-500" />
        </Button>

        {/* Network selector */}
        <div className="relative" ref={chainDropdownRef}>
          <Button
            variant="ghost"
            className="h-8 px-3 py-0 rounded-xl flex items-center gap-2 hover:bg-gray-100"
            onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
          >
            <div className="relative w-6 h-6">
              {!mounted || loading ? (
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <Image
                  src={selectedChain ? getChainIcon(selectedChain.logo) : "/globe.svg"}
                  alt={selectedChain?.name || "Select Network"}
                  className="object-contain"
                  width={24}
                  height={24}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/globe.svg';
                  }}
                />
              )}
            </div>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          {/* Chain dropdown */}
          {mounted && isChainDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500">Loading chains...</div>
              ) : (
                chains.map((chain) => (
                  <button
                    key={chain._id}
                    onClick={() => handleChainSelect(chain.chainId)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      chain.chainId === selectedChainId
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <Image
                      src={getChainIcon(chain.logo)}
                      alt={chain.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/globe.svg';
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{chain.name}</div>
                      <div className="text-xs text-gray-500">{chain.symbol}</div>
                    </div>
                    {chain.chainId === selectedChainId && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* User account */}
        <ConnectButton chainStatus="none" />
      </div>
    </header>
  );
};