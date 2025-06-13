import { type EvmContractConditions } from "@lit-protocol/types";

export const createEvmConditions = (
  chain: string,
  contractAddress: string,
  fileIdentifier: string,
) => {
  const conditions = [
    {
      contractAddress,
      functionName: "checkPermission",
      functionParams: [`${fileIdentifier}`, ":userAddress"],
      functionAbi: {
        type: "function",
        stateMutability: "view",
        outputs: [
          {
            type: "bool",
            name: "",
            internalType: "bool",
          },
        ],
        name: "checkPermission",
        inputs: [
          {
            type: "string",
            name: "fileIdentifier",
            internalType: "string",
          },
          {
            type: "address",
            name: "requestAddress",
            internalType: "address",
          },
        ],
      },
      chain,
      returnValueTest: {
        key: "",
        comparator: "=",
        value: "true",
      },
    },
  ] as EvmContractConditions;

  return conditions;
};
