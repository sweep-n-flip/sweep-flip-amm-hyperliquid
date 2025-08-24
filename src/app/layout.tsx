import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Sweep n' Flip",
  description: "NFT AMM - Automated Market Maker for NFT/token swaps",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className} antialiased bg-[#f8f9fb]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
