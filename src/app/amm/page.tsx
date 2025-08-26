'use client';

import { HeaderSection } from '@/components/HeaderSection';
import { SwapWidget } from '@/components/SwapWidget';

export default function AMMPage() {
  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/hyperliquid_background.png)',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Header */}
      <HeaderSection />

      {/* Conteúdo principal */}
      <main className="flex flex-col items-center gap-12 py-10 px-4 flex-1 w-full max-w-6xl mx-auto">
        {/* Swap Widget */}
        <SwapWidget />
      </main>
      <footer className="text-center text-xs text-gray-400 py-4">Made by Sweep N&apos; Flip</footer>
    </div>
  );
}
