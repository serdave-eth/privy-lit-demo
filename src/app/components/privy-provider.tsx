"use client";

import { ReactNode, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { baseSepolia } from 'viem/chains';

interface PrivyWrapperProps {
  children: ReactNode;
}

export const PrivyWrapper = ({ children }: PrivyWrapperProps) => {
  // Use useEffect to log when the component mounts
  useEffect(() => {
    console.log("PrivyWrapper loaded with appId:", process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  }, []);

  return (
    <PrivyProvider 
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
    config={{
      defaultChain: baseSepolia,
      supportedChains: [baseSepolia],
      loginMethods: ["email"],
      embeddedWallets: {
        requireUserPasswordOnCreate: false,
        ethereum: {
          createOnLogin: "users-without-wallets",
        },
        showWalletUIs: true,
      },
      appearance: {
        theme: 'light',
        accentColor: '#676FFF',
      },
    }}>
      <>{children}</>
    </PrivyProvider>
  );
};
