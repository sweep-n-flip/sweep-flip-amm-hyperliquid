"use client";
import Image from "next/image";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import { IoMdArrowForward } from "react-icons/io";
import { PiDiscordLogo } from "react-icons/pi";
import SnfLogo from "../ui/icons/snf-logo";

function HeroSection() {
  return (
    <div className="flex justify-center w-full relative overflow-hidden min-h-screen">
        <Image
          src="/img/hp-snf-logo-bg.png"
          width={670}
          height={580}
          alt="SNF App"
          className="absolute -z-0 inset-0 w-full h-full object-cover drop-shadow-2xl"
        />
      <div className="flex flex-col max-w-[1600px] min-h-screen relative w-full p-4">
       
        {/* TOP BAR */}
        <div className="flex w-full items-center justify-end gap-8">
          <div className="flex gap-4 z-20">
            <Link target="_blank" href="https://discord.gg/jqVQKuE6RH">
              <PiDiscordLogo className="rounded-full hover:p-2 p-2.5 w-11 h-11 bg-hyperGreen text-white transition-all" />
            </Link>
            <Link target="_blank" href="https://x.com/SweepnFlip">
              <FaXTwitter className="rounded-full hover:p-2 p-3 w-11 h-11 bg-hyperGreen text-white transition-all" />
            </Link>
          </div>
          <Image
            src="/img/logo.svg"
            width={295}
            height={100}
            alt="Hyperliquid Logo"
            className="object-contain w-44 h-fit z-20"
          />
        </div>

        {/* HERO CONTENT */}
        <div className="flex w-full flex-1 items-center lg:flex-row flex-col 2xl:gap-24 gap-12 pt-16 pb-20 font-semibold select-none z-10">
          {/* LEFT */}
          <div className="flex flex-1 w-full flex-col gap-12">
            <div className="flex flex-col gap-2">
              <SnfLogo className="w-full 2xl:max-w-[620px] max-w-[80%] h-fit" />
            </div>

            <div className="flex flex-1 flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="md:text-4xl sm:text-3xl text-2xl text-gray-600">
                  Instant Liquidity for NFT Collections
                </h2>
              </div>
              <div className="flex w-full flex-col xs:flex-row sm:gap-8 gap-2">
                <Link href="/amm">
                  <button className="bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2">
                    Launch Dapp <IoMdArrowForward className="w-6 h-6" />
                  </button>
                </Link>
                <button 
                  onClick={() => {
                    const launchpadSection = document.getElementById('launchpad');
                    if (launchpadSection) {
                      launchpadSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-transparent hover:bg-primary/10 border-2 border-primary text-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  Mint NFTs <IoMdArrowForward className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col flex-1 h-full justify-center items-center td-figure">
            <Image
              src="/img/snf-example.png"
              width={670}
              height={580}
              alt="SNF App"
              className="flex td-figure-img flex-1 w-full 2xl:max-h-full max-h-[500px] object-contain max-w-[600px] drop-shadow-2xl"
            />
          </div>
        </div>
       
      </div>
    </div>
  );
}

export default HeroSection;
