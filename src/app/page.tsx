'use client';

import { useState } from 'react';
import { ConnectWalletButton } from './components/connect-wallet-button'
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
//import { getSessionSignatures } from './utils/genSessionSigs';
//import { authenticateLitSession } from './utils/getLitSession';
//import { authenticateLitSession } from 'keypo-sdk';
import { decrypt, type DecryptConfig, postProcess } from 'keypo-sdk';
import { baseSepolia } from 'viem/chains';

export default function Home() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();
  const [status, setStatus] = useState<"idle" | "setup" | "lit" | "decrypt" | "done">("idle");
  const [decryptedData, setDecryptedData] = useState<string | null>(null);

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
    setStatus("setup");
    setDecryptedData(null);

    if (!userWallet) {
      console.error("No userWallet found");
      setStatus("idle");
      return;
    }
    // 1. Setting up privy wallet for ethers v5
    const privyProvider = await userWallet.getEthereumProvider();
    const ethersProvider = new ethers.providers.Web3Provider(privyProvider);
    const ethersSigner = ethersProvider.getSigner();

    setStatus("lit");
    // 2. Getting lit session
    const chain = baseSepolia.id.toString();
    /*const { sessionSigs, authSig, litNodeClient, dataToEncryptHash, evmConditions, dataMetadata } = await authenticateLitSession(
      ethersSigner,
      chain,
      ONE_HOUR_FROM_NOW,
      permissionsRegistryContractAddress || "",
      dataIdentifier || "",
      apiUrl || "",
      true,
    );*/

    setStatus("decrypt");
    // 3. Getting decrypted data
    /*const response = await fetch(`${apiUrl}/decryption`, {
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
    const data = await response.json();*/
    const config: DecryptConfig = {
      registryContractAddress: permissionsRegistryContractAddress || "",
      chain,
      apiUrl: apiUrl || "",
      expiration: ONE_HOUR_FROM_NOW,
    };
    const { decryptedData, metadata } = await decrypt(
      dataIdentifier || "",
      ethersSigner,
      config,
      true
    );
    console.log("decryptedData", decryptedData);
    const decryptedDataString = postProcess(decryptedData, metadata);
    setDecryptedData(String(decryptedDataString));
    setStatus("done");
  }

  function renderStatus() {
    if (status === "setup") return <StatusStep text="Setting up privy wallet for ethers v5..." />;
    if (status === "lit") return <StatusStep text="Getting Lit session..." />;
    if (status === "decrypt") return <StatusStep text="Getting decrypted data..." />;
    if (status === "done" && decryptedData)
      return (
        <div className="mt-6 p-4 bg-gray-100 rounded text-gray-800 max-w-xl break-words">
          <strong>Decrypted Data:</strong>
          <pre className="whitespace-pre-wrap">
            {typeof decryptedData === "string"
              ? decryptedData
              : JSON.stringify(decryptedData, null, 2)}
          </pre>
        </div>
      );
    return null;
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
            disabled={status !== "idle" && status !== "done"}
          >
            Custom Action
          </button>
          <div className="mt-6">{renderStatus()}</div>
        </>
      )}
    </main>
  )
}

// Simple status step animation (spinner + text)
function StatusStep({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span>{text}</span>
    </div>
  );
} 