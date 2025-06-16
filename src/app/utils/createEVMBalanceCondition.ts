import { type AccessControlConditions } from "@lit-protocol/types";

export const createEvmBalanceConditions = (
  chain: string,
  litActionIpfsId: string,
) => {
  return [
    {
      contractAddress: "",
      standardContractType: "",
      chain,
      method: "",
      parameters: [":currentActionIpfsId"],
      returnValueTest: {
        comparator: "=",
        value: litActionIpfsId,
      },
    },
  ] as AccessControlConditions;
};
