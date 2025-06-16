import { createWalletClient, custom, type Chain } from 'viem';
import { baseSepolia } from 'viem/chains';
import { KernelVersionToAddressesMap, KERNEL_V3_3 } from "@zerodev/sdk/constants";

// Utility function to get walletClient and authorization
  export async function getWalletClientAndAuthorization(userWallet: any, signAuthorization: any) {
    const kernelVersion = KERNEL_V3_3;
    const kernelAddresses = KernelVersionToAddressesMap[kernelVersion];
    if (!userWallet) throw new Error('No user wallet');
    const userSigner = await userWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: userWallet.address as `0x${string}`,
      chain: baseSepolia as Chain,
      transport: custom(userSigner),
    });
    const authorization = await signAuthorization({
      contractAddress: kernelAddresses.accountImplementationAddress,
      chainId: baseSepolia.id
    });
    return { walletClient, authorization };
  }