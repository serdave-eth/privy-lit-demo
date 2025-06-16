'use client';

import { ConnectWalletButton } from './components/connect-wallet-button'
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { getSessionSignatures } from './utils/genSessionSigs';
import { authenticateLitSession } from './utils/getLitSession';
import { baseSepolia } from 'viem/chains';

export default function Home() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();
  // Fallback to the first wallet in the array as active wallet
  const userWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  // TODO: pull in dataIdentifier, API URL, etc from .env
  const dataIdentifier = process.env.NEXT_PUBLIC_DATA_IDENTIFIER;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const permissionsRegistryContractAddress = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS;

  if (!dataIdentifier || !apiUrl || !permissionsRegistryContractAddress) {
    console.error("Missing environment variables");
    return;
  }
  const ONE_HOUR_FROM_NOW = new Date(
    Date.now() + 1000 * 60 * 60,
  ).toISOString();

  async function handleCustomButtonClick() {
    if (!userWallet) {
      console.error("No userWallet found");
      return;
    }
    console.log("Getting privy provider for ethers v5...");
    const privyProvider = await userWallet.getEthereumProvider();
    const ethersProvider = new ethers.providers.Web3Provider(privyProvider);
    const ethersSigner = ethersProvider.getSigner();
    const chain = baseSepolia.id.toString();
    console.log("chain", chain);
    /*const { sessionSigs } = await getSessionSignatures({
      chain,
      signer: ethersSigner,
    });
    console.log("sessionSigs", sessionSigs);*/

    const { sessionSigs, authSig, litNodeClient, dataToEncryptHash, evmConditions, dataMetadata } = await authenticateLitSession(
      ethersSigner,
      chain,
      ONE_HOUR_FROM_NOW,
      permissionsRegistryContractAddress || "",
      dataIdentifier || "",
      apiUrl || "",
      true,
    );
    console.log("sessionSigs", sessionSigs);
    console.log("authSig", authSig);
    console.log("litNodeClient", litNodeClient);
    console.log("dataToEncryptHash", dataToEncryptHash);
    console.log("evmConditions", evmConditions);
    console.log("dataMetadata", dataMetadata);

    // TODO: call decryption API endpoint
    const response = await fetch(`${apiUrl}/decryption`, {
      method: "POST",
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          dataIdentifier,
          sessionSigs,
          dataMetadata: JSON.stringify(dataMetadata),
      })
  });
  const data = await response.json();
  console.log("data", data);
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