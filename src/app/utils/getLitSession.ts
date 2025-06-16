import { type Signer } from "ethers";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAccessControlConditionResource,
  LitActionResource,
} from "@lit-protocol/auth-helpers";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  type AccessControlConditions,
  type EvmContractConditions,
  type LIT_NETWORKS_KEYS,
} from "@lit-protocol/types";
import { getPermissionedFileMetadata } from "@/app/utils/getPermissionedFileMetadata";
import { createEvmConditions } from "./createEVMContractCondition";
import { createEvmBalanceConditions } from "./createEVMBalanceCondition";

interface AuthCallbackParams {
  resourceAbilityRequests?: any[];
  expiration?: string;
  uri?: string;
  resources?: any;
}

const ONE_DAY_FROM_NOW = new Date(
  Date.now() + 1000 * 60 * 60 * 24,
).toISOString();

export const genAuthSig = async (
  signer: Signer,
  client: LitNodeClient,
  uri: string,
  resources: any[],
  expiration: string = ONE_DAY_FROM_NOW,
): Promise<any> => {
  console.log("[DEBUG] genAuthSig called with:", {
    signer,
    client,
    uri,
    resources,
    expiration,
  });
  const blockHash = await client.getLatestBlockhash();
  console.log("[DEBUG] genAuthSig: blockHash:", blockHash);
  const address = await signer.getAddress();
  console.log("[DEBUG] genAuthSig: address:", address);
  
  const message = await createSiweMessageWithRecaps({
    walletAddress: address,
    nonce: blockHash,
    litNodeClient: client,
    resources,
    expiration: expiration,
    uri,
  });
  console.log("[DEBUG] genAuthSig: constructed message:", message);
  const authSig = generateAuthSig({
    signer: signer,
    toSign: message,
  });
  console.log("[DEBUG] genAuthSig: generated authSig:", authSig);
  return authSig;
};

export const genSession = async (
  signer: Signer,
  client: LitNodeClient,
  resources: any[],
  expiration: string,
  chain: string,
  authSig?: any,
): Promise<any> => {
  console.log("[DEBUG] genSession called with:", {
    signer,
    client,
    resources,
    expiration,
    chain,
    authSig,
  });
  return client.getSessionSigs({
    chain: chain,
    resourceAbilityRequests: resources,
    authNeededCallback: async (params: AuthCallbackParams) => {
      console.log("[DEBUG] authNeededCallback called with params:", params);
      if (!params.expiration || !params.resources || !params.uri) {
        throw new Error("All parameters must be defined");
      }

      if (authSig) {
        console.log("[DEBUG] Returning provided authSig");
        return authSig;
      }

      const safeResources = params.resourceAbilityRequests || [];
      console.log("[DEBUG] Calling genAuthSig from authNeededCallback with:", {
        signer,
        client,
        uri: params.uri,
        safeResources,
        expiration,
      });
      return genAuthSig(signer, client, params.uri, safeResources, expiration);
    },
  });
};

export const authenticateLitSession = async (
  wallet: Signer,
  chain: string,
  expiration: string,
  permissionsRegistryContractAddress: string,
  dataIdentifier: string,
  apiUrl: string,
  debug?: boolean,
): Promise<{
  sessionSigs: any;
  authSig: any;
  litNodeClient: LitNodeClient;
  dataToEncryptHash: string;
  evmConditions: (AccessControlConditions | EvmContractConditions)[];
  dataMetadata: any;
}> => {
  let walletAddress;
  try {
    walletAddress = await wallet.getAddress();
    if (debug) {
      console.log("[DEBUG] authenticateLitSession called with:", {
        walletAddress,
        chain,
        expiration,
        permissionsRegistryContractAddress,
        dataIdentifier,
      });
    }
  } catch (err) {
    console.error("[DEBUG] Error getting wallet address:", err);
    throw err;
  }

  // Use ethers wallet directly as signer
  const signer = wallet;
  let dataMetadata;
  try {
    if (debug) console.log("[DEBUG] Fetching permissioned file metadata...");
    dataMetadata = await getPermissionedFileMetadata(
      dataIdentifier,
      apiUrl
    );
    if (debug) console.log("[DEBUG] dataMetadata (raw):", dataMetadata);
    if (!dataMetadata) {
      throw new Error(
        "No data metadata found for the provided smart contract address",
      );
    }
  } catch (err) {
    console.error("[DEBUG] Error fetching permissioned file metadata:", err);
    throw err;
  }

  let dataMetadataObject;
  try {
    dataMetadataObject = JSON.parse(dataMetadata);
    if (debug) console.log("[DEBUG] dataMetadataObject (parsed):", dataMetadataObject);
  } catch (err) {
    console.error("[DEBUG] Error parsing dataMetadata:", err);
    throw err;
  }

  let litNodeClient;
  try {
    if (debug) console.log("[DEBUG] Creating LitNodeClient...");
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev as LIT_NETWORKS_KEYS,
      debug: false,
    });
    if (debug) console.log("[DEBUG] Connecting LitNodeClient...");
    await litNodeClient.connect();
    if (debug) console.log("[DEBUG] LitNodeClient connected.");
  } catch (err) {
    console.error("[DEBUG] Error creating/connecting LitNodeClient:", err);
    throw err;
  }

  // if dataMetadataObject.proxyMetadata exists, use createEvmBalanceConditions instead of createEvmConditions
  let conditions: AccessControlConditions[] | EvmContractConditions[] = [];
  try {
    if (dataMetadataObject.proxyMetadata) {
      if (debug) console.log("[DEBUG] Using createEvmBalanceConditions...");
      conditions = createEvmBalanceConditions(
        chain,
        dataMetadataObject.proxyMetadata.proxyAddress,
      ) as AccessControlConditions[];
    } else {
      if (debug) console.log("[DEBUG] Using createEvmConditions...");
      conditions = createEvmConditions(
        chain,
        permissionsRegistryContractAddress,
        dataIdentifier,
      ) as EvmContractConditions[];
    }
    if (debug) console.log("[DEBUG] conditions:", conditions);
  } catch (err) {
    console.error("[DEBUG] Error creating conditions:", err);
    throw err;
  }

  let accsResourceString;
  try {
    if (debug) console.log("[DEBUG] Generating resource strings...");
    accsResourceString = await LitAccessControlConditionResource.generateResourceString(
      conditions as any,
      dataMetadataObject.encryptedData.dataToEncryptHash,
    );
    if (debug) console.log("[DEBUG] accsResourceString:", accsResourceString);
  } catch (err) {
    console.error("[DEBUG] Error generating resource string:", err);
    throw err;
  }

  let resources;
  try {
    resources = [
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitAccessControlConditionResource(accsResourceString),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ];
    if (debug) console.log("[DEBUG] resources:", resources);
  } catch (err) {
    console.error("[DEBUG] Error creating resources array:", err);
    throw err;
  }

  let sessionSigs;
  try {
    if (debug) console.log("[DEBUG] Calling genSession...");
    sessionSigs = await genSession(signer, litNodeClient, resources, expiration, chain);
    if (debug) console.log("[DEBUG] sessionSigs:", sessionSigs);
  } catch (err) {
    console.error("[DEBUG] Error in genSession:", err);
    throw err;
  }

  let authSig;
  try {
    if (debug) console.log("[DEBUG] Calling genAuthSig...");
    authSig = await genAuthSig(
      signer,
      litNodeClient,
      "https://www.keypo.io",
      resources,
    );
    if (debug) console.log("[DEBUG] authSig:", authSig);
  } catch (err) {
    console.error("[DEBUG] Error in genAuthSig:", err);
    throw err;
  }

  return {
    sessionSigs,
    authSig,
    dataToEncryptHash: dataMetadataObject.encryptedData.dataToEncryptHash,
    evmConditions: conditions,
    litNodeClient: litNodeClient,
    dataMetadata: dataMetadataObject,
  };
};
