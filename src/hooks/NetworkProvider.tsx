import React, { createContext, PropsWithChildren, useEffect, useState } from "react";

interface NetworkProviderContext {
  network: string; // Network name
  chainId: string; // Network chain ID
}

export const NetworkProviderContext = createContext<NetworkProviderContext>(null);

const NETWORK_DATA: Record<string, string> = {
  "0x1": "Ethereum Mainnet",
  "0x3": "Ropsten Testnet",
  "0x4": "Rinkeby Testnet",
  "0x5": "Goerli Testnet",
  "0x2a": "Kovan Testnet",
  "0x38": "Binance Smart Chain Mainnet",
  "0x61": "Binance Smart Chain Testnet",
};

export const NetworkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [network, setNetwork] = useState<string>("Unknown");
  const [chainId, setChainId] = useState<string>("0x0");

  useEffect(() => {
    const { ethereum } = window as any;

    if (!ethereum) {
      console.warn("MetaMask is not installed.");
      return;
    }

    // Fetch the initial network details
    const fetchNetworkDetails = async () => {
      try {
        const currentChainId = await ethereum.request({ method: "eth_chainId" });
        updateNetworkDetails(currentChainId);
      } catch (error) {
        console.error("Failed to fetch network details:", error);
      }
    };

    // Update network details based on chainId
    const updateNetworkDetails = (chainId: string) => {
      const networkName = NETWORK_DATA[chainId] || "Unknown";
      setNetwork(networkName);
      setChainId(chainId);
    };

    // Listen for network changes
    const handleChainChanged = (newChainId: string) => {
      console.log(`Network changed to ${newChainId}`);
      updateNetworkDetails(newChainId);
    };

    ethereum.on("chainChanged", handleChainChanged);

    // Fetch initial network and clean up listener on unmount
    fetchNetworkDetails();
    return () => {
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const contextValue: NetworkProviderContext = {
    network,
    chainId,
  };

  return (
    <NetworkProviderContext.Provider value={contextValue}>
      {children}
    </NetworkProviderContext.Provider>
  );
};
