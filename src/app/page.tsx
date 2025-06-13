'use client';

import { ConnectWalletButton } from './components/connect-wallet-button'
import { useWallets, usePrivy } from '@privy-io/react-auth';

export default function Home() {
  const { wallets } = useWallets();
  const { authenticated, user } = usePrivy();
  // Fallback to the first wallet in the array as active wallet
  const activeWallet = wallets.length > 0 ? wallets[0] : null;
  console.log(wallets);

  function handleCustomButtonClick() {
    console.log('pressed');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Privy Lit Demo</h1>
      <ConnectWalletButton />
      {authenticated && user && activeWallet && activeWallet.address && (
        <>
          <div className="mt-6 text-lg text-purple-700">
            Connected wallet: <span className="font-mono">{activeWallet.address}</span>
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