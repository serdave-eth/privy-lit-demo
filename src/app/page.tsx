'use client';

import { ConnectWalletButton } from './components/connect-wallet-button'
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { getSessionSignatures } from './utils/genSessionSigs';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

export default function Home() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();
  // Fallback to the first wallet in the array as active wallet
  const userWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  async function handleCustomButtonClick() {
    if (!userWallet) {
      console.error("No userWallet found");
      return;
    }
    console.log("Getting privy provider for ethers v5...");
    const privyProvider = await userWallet.getEthereumProvider();
    const ethersProvider = new ethers.providers.Web3Provider(privyProvider);
    const ethersSigner = ethersProvider.getSigner();
    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    await litNodeClient.connect();
    const { sessionSigs, authSig } = await getSessionSignatures({
      litNodeClient,
      chain: "1",
      signer: ethersSigner,
    });
    console.log("sessionSigs", sessionSigs);
    console.log("authSig", authSig);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Privy Lit Demo</h1>
      <ConnectWalletButton />
      {authenticated && user && userWallet && userWallet.address && (
        <>
          <div className="mt-6 text-lg text-purple-700">
            Connected wallet: <span className="font-mono">{userWallet.address}</span>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleCustomButtonClick}
          >
            Custom Action
          </button>
        </>
      )}
    </main>
  )
} 