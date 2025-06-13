import React from "react";
import { disconnectWeb3 } from "@lit-protocol/auth-browser";
import { usePrivy } from "@privy-io/react-auth";

export function ConnectWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Wait until the Privy client is ready before taking any actions
  if (!ready) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      {authenticated ? (
        <>
          <textarea
            readOnly
            value={JSON.stringify(user, null, 2)}
            style={{ width: "600px", height: "250px", borderRadius: "6px", marginBottom: "16px" }}
          />
          <button
            onClick={async () => {
              disconnectWeb3();
              await logout();
            }}
            style={{ padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}
          >
            Log Out
          </button>
        </>
      ) : (
        <button
          onClick={login}
          style={{ padding: "12px", backgroundColor: "#069478", color: "#FFF", border: "none", borderRadius: "6px" }}
        >
          Log In
        </button>
      )}
    </div>
  );
}
