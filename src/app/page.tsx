'use client';

import { useState } from 'react';
import { ConnectWalletButton } from './components/connect-wallet-button'
import { useWallets, usePrivy, useSignAuthorization } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { decrypt, type DecryptConfig, postProcess, preProcess, encrypt, type EncryptConfig, type ShareConfig, shareData, deleteData, type DeleteConfig } from 'keypo-sdk';
import { baseSepolia } from 'viem/chains';
import { getWalletClientAndAuthorization } from './utils/wallet-utils';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();
  const { signAuthorization } = useSignAuthorization();
  const [uiState, setUiState] = useState({
    status: "idle" as "idle" | "setup" | "lit" | "decrypt" | "done",
    decryptedData: null as string | null,
    encryptInput: "",
    encryptDone: false,
    decryptInput: "",
    shareInput1: "",
    shareInput2: "",
    deleteInput: "",
  });

  const userWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  // TODO: pull in dataIdentifier, API URL, etc from .env
  const dataIdentifier = process.env.NEXT_PUBLIC_DATA_IDENTIFIER;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const permissionsRegistryContractAddress = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS;
  const bundlerRpcUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;
  const permissionsValidatorAddress = process.env.NEXT_PUBLIC_VALIDATOR_CONTRACT_ADDRESS;

  if (!dataIdentifier || !apiUrl || !permissionsRegistryContractAddress || !bundlerRpcUrl || !permissionsValidatorAddress) {
    console.error("Missing environment variables");
    return;
  }
  const ONE_HOUR_FROM_NOW = new Date(
    Date.now() + 1000 * 60 * 60,
  ).toISOString();

  async function handleCustomButtonClick(decryptData: string) {
    setUiState(prev => ({ ...prev, status: "setup", decryptedData: null }));
    console.log("decryptData", decryptData);

    if (!userWallet) {
      console.error("No userWallet found");
      setUiState(prev => ({ ...prev, status: "idle" }));
      return;
    }
    // 1. Setting up privy wallet for ethers v5
    const privyProvider = await userWallet.getEthereumProvider();
    const ethersProvider = new ethers.providers.Web3Provider(privyProvider);
    const ethersSigner = ethersProvider.getSigner();

    setUiState(prev => ({ ...prev, status: "lit" }));
    // 2. Getting lit session
    const chain = baseSepolia.id.toString();

    setUiState(prev => ({ ...prev, status: "decrypt" }));
    // 3. Getting decrypted data
    const config: DecryptConfig = {
      registryContractAddress: permissionsRegistryContractAddress || "",
      chain,
      expiration: ONE_HOUR_FROM_NOW,
      apiUrl: apiUrl || "",
    };
    const { decryptedData, metadata } = await decrypt(
      decryptData || "",
      ethersSigner,
      config,
      true
    );
    console.log("decryptedData", decryptedData);
    const decryptedDataString = postProcess(decryptedData, metadata);
    setUiState(prev => ({ ...prev, status: "done", decryptedData: String(decryptedDataString) }));
  }

  async function handleEncrypt(encryptData: string) {
    console.log("Encrypt input:", encryptData);
    setUiState(prev => ({ ...prev, encryptDone: true }));
    
    const fileName = uuidv4();
    const { dataOut, metadataOut } = await preProcess(
      encryptData,
      fileName,
      false,
      {"fileUseType": "key"}
    );
    const { walletClient, authorization } = await getWalletClientAndAuthorization(userWallet, signAuthorization);
    // 3. Prepare encrypt config
    const config: EncryptConfig = {
      apiUrl: apiUrl || "",
      validatorAddress: permissionsValidatorAddress || "",
      registryContractAddress: permissionsRegistryContractAddress || "",
      bundlerRpcUrl: bundlerRpcUrl || "",
    };
    // 4. Encrypt data
    const result = await encrypt(
      dataOut,
      walletClient as any, // type cast to resolve viem Client type mismatch
      metadataOut,
      authorization,
      config,
      true
    );
    console.log("result", result);
  }

  async function handleShare(dataIdentifier: string, recipientAddress: string) {
    console.log("Share input 1:", dataIdentifier);
    console.log("Share input 2:", recipientAddress);
    // Placeholder for share logic

    const { walletClient, authorization } = await getWalletClientAndAuthorization(userWallet, signAuthorization);
    const config: ShareConfig = {
      permissionsRegistryContractAddress: permissionsRegistryContractAddress || "",
      bundlerRpcUrl: bundlerRpcUrl || "",
    };
    const result = await shareData(
      dataIdentifier,
      walletClient as any,
      recipientAddress,
      config,
      authorization,
      true
    );
    console.log("result", result);
  }

  async function handleDelete(dataIdentifier: string) {
    console.log("Delete input:", dataIdentifier);
    // Placeholder for delete logic
    const { walletClient, authorization } = await getWalletClientAndAuthorization(userWallet, signAuthorization);
    const config: DeleteConfig = {
      permissionsRegistryContractAddress: permissionsRegistryContractAddress || "",
      bundlerRpcUrl: bundlerRpcUrl || "",
    };
    const result = await deleteData(
      dataIdentifier,
      walletClient as any,
      authorization,
      config,
      true
    );
    console.log("result", result);
  }

  function renderStatus() {
    if (uiState.status === "setup") return <StatusStep text="Setting up privy wallet for ethers v5..." />;
    if (uiState.status === "lit") return <StatusStep text="Getting Lit session..." />;
    if (uiState.status === "decrypt") return <StatusStep text="Getting decrypted data..." />;
    if (uiState.status === "done" && uiState.decryptedData)
      return (
        <div className="mt-6 p-4 bg-gray-100 rounded text-gray-800 max-w-xl break-words">
          <strong>Decrypted Data:</strong>
          <pre className="whitespace-pre-wrap">
            {typeof uiState.decryptedData === "string"
              ? uiState.decryptedData
              : JSON.stringify(uiState.decryptedData, null, 2)}
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
          <div className="mt-4 flex flex-col items-center gap-2">
            <input
              type="text"
              className="border px-3 py-2 rounded w-64"
              placeholder="Enter string to encrypt"
              value={uiState.encryptInput}
              onChange={e => setUiState(prev => ({ ...prev, encryptInput: e.target.value }))}
              disabled={uiState.encryptDone}
            />
            <button
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => handleEncrypt(uiState.encryptInput)}
              disabled={uiState.encryptDone || !uiState.encryptInput}
            >
              Encrypt
            </button>
          </div>
          {uiState.encryptDone && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <input
                type="text"
                className="border px-3 py-2 rounded w-64"
                placeholder="Enter string to decrypt"
                value={uiState.decryptInput}
                onChange={e => setUiState(prev => ({ ...prev, decryptInput: e.target.value }))}
                disabled={uiState.status !== "idle" && uiState.status !== "done"}
              />
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleCustomButtonClick(uiState.decryptInput)}
                disabled={uiState.status !== "idle" && uiState.status !== "done" || !uiState.decryptInput}
              >
                Decrypt
              </button>
            </div>
          )}
          <div className="mt-6">{renderStatus()}</div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <input
              type="text"
              className="border px-3 py-2 rounded w-64"
              placeholder="Share field 1"
              value={uiState.shareInput1}
              onChange={e => setUiState(prev => ({ ...prev, shareInput1: e.target.value }))}
            />
            <input
              type="text"
              className="border px-3 py-2 rounded w-64"
              placeholder="Share field 2"
              value={uiState.shareInput2}
              onChange={e => setUiState(prev => ({ ...prev, shareInput2: e.target.value }))}
            />
            <button
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              onClick={() => handleShare(uiState.shareInput1, uiState.shareInput2)}
              disabled={!uiState.shareInput1 || !uiState.shareInput2}
            >
              Share
            </button>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <input
              type="text"
              className="border px-3 py-2 rounded w-64"
              placeholder="Enter string to delete"
              value={uiState.deleteInput}
              onChange={e => setUiState(prev => ({ ...prev, deleteInput: e.target.value }))}
            />
            <button
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => handleDelete(uiState.deleteInput)}
              disabled={!uiState.deleteInput}
            >
              Delete
            </button>
          </div>
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