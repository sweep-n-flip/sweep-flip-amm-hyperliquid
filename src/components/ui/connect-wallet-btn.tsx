"use client";
import React from "react";
import { useAutoConnect, useConnectModal } from "thirdweb/react";
import { client, wallets, chain } from "@/utils/thirdweb";
import { RainbowButton } from "./rainbow-button";
import { Account } from "thirdweb/wallets";

interface ConnectBtnProps {
  className?: string;
  account?: Account | undefined;
}

function ConnectBtn({ className }: ConnectBtnProps) {
  
  useAutoConnect({ client: client });
  const { connect, isConnecting } = useConnectModal();

  const handleConnect = async () => {
    try {
      const wallet = await connect({
        client,
        chain: chain,
        wallets: wallets,
        size: "compact",
        showThirdwebBranding: false,
      });
      console.log("Connected to", wallet);
    } catch (error) {
      console.error("Connection failed", error);
    }
  };

  return (
    <>
      {isConnecting ? (
        <RainbowButton disabled>Connecting...</RainbowButton>
      ) : (
        <RainbowButton onClick={handleConnect} className={`${className}`}>
          Connect
        </RainbowButton>
      )}
    </>
  );
}

export default ConnectBtn;
