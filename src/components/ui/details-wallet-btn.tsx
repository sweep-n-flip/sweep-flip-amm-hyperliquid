"use client";
import React from "react";
import { ConnectButton, useAutoConnect } from "thirdweb/react";
import { client, wallets, chain } from "@/utils/thirdweb";

interface ConnectBtnProps {
  className?: string;
}

function DetailsWalletBtn({ className }: ConnectBtnProps) {
  useAutoConnect({ client: client });

  return (
    <div className="h-fit w-fit shadow-xl z-20">
      <ConnectButton
        client={client}
        chain={chain}
        wallets={wallets}
        connectModal={{
          size: "compact",
          showThirdwebBranding: false,
        }}
        detailsButton={{
          className: `!text-2xl !w-fit xs:!min-w-[165px] ${className}`,
        }}
      />
    </div>
  );
}

export default DetailsWalletBtn;
