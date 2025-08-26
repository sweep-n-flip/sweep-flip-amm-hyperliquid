"use client";
import Image from "next/image";

function Section2() {
  return (
    <div className="flex justify-center w-full relative overflow-hidden">
      <div className="flex flex-col max-w-[1600px] min-h-[640px] max-h-screen relative w-full p-4">
        {/* HERO CONTENT */}
        <div className="flex w-full h-full items-center lg:flex-row flex-col 2xl:gap-24 gap-12 pt-16 pb-20 font-semibold select-none z-10">
          {/* LEFT */}
          <div className="flex flex-1 w-full flex-col gap-12">
            <div className="flex flex-1 flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="md:text-4xl sm:text-3xl text-2xl text-primary">
                  NFT DEX
                </h2>
                <h2 className="md:text-3xl sm:text-2xl text-xl text-gray-600">
                  Like <span style={{textDecoration: 'line-through'}}>Uniswap</span> BEX but, for NFTs
                </h2>
              </div>
              <div className="flex w-full flex-col gap-2 text-gray-600 md:text-2xl sm:text-xl text-lg">
                <li>Swap NFTs instantly</li>
                <li>Provide liquidity for NFTs</li>
                <li>Earn trading fees</li>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex relative flex-col flex-1 h-full justify-center items-center td-figure">
          <Image
              src="/img/snf-example2.png"
              width={670}
              height={580}
              alt="SNF App"
              className="flex absolute 2xl:right-[60%] sm:right-[42%] right-[32%] top-0 td-figure-img flex-1 w-full 2xl:max-h-[650px] max-h-[500px] object-contain max-w-[600px] drop-shadow-2xl"
            />
            <Image
              src="/img/snf-example.png"
              width={670}
              height={580}
              alt="SNF App"
              className="flex td-figure-img mt-14 flex-1 w-full 2xl:max-h-full max-h-[500px] object-contain max-w-[600px] drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section2;
