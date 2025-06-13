import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAccessControlConditionResource,
} from "@lit-protocol/auth-helpers";
import { LIT_ABILITY } from "@lit-protocol/constants";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";

export async function getSessionSignatures({
  litNodeClient,
  chain,
  capacityDelegationAuthSig,
  signer,
}: {
  litNodeClient: LitNodeClient;
  chain: string;
  capacityDelegationAuthSig?: any;
  signer: ethers.Signer;
}) {

  // Get the latest blockhash
  const latestBlockhash = await litNodeClient.getLatestBlockhash();

  // Define the authNeededCallback function
  const authNeededCallback = async (params: any) => {
    if (!params.uri) throw new Error("uri is required");
    if (!params.expiration) throw new Error("expiration is required");
    if (!params.resourceAbilityRequests) throw new Error("resourceAbilityRequests is required");

    // Create the SIWE message
    const toSign = await createSiweMessageWithRecaps({
      uri: params.uri,
      expiration: params.expiration,
      resources: params.resourceAbilityRequests,
      walletAddress: await signer.getAddress(),
      nonce: latestBlockhash,
      litNodeClient,
    });

    // Generate the authSig
    const authSig = await generateAuthSig({
      signer,
      toSign,
    });
    return authSig;
  };

  // Define the Lit resource
  const litResource = new LitAccessControlConditionResource("*");

  // Get the session signatures
  const sessionSigs = await litNodeClient.getSessionSigs({
    chain,
    resourceAbilityRequests: [
      {
        resource: litResource,
        ability: LIT_ABILITY.AccessControlConditionDecryption as any,
      },
    ],
    authNeededCallback,
    capacityDelegationAuthSig,
  });
  return sessionSigs;
}
