import React, { useEffect, useState } from "react";
import styles from "./HomePage.module.css";
import { useForm } from "react-hook-form";
import ReceiveCard from "~/components/RecieveCard/RecieveCard";
import { concat, Contract, hexlify, parseUnits, toBeHex, zeroPadBytes, zeroPadValue } from "ethers";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import { useDebouncedCallback } from "use-debounce";

const AGA_BSC_RESOURCE_ID = 0
const AGA_DECIMALS = 12
const DEPOSIT_FEE = 100000000000000
const BRIDGE_CONTRACT = "0xC29eD21F4360A8Ce3AB28DdE6A55017C5a38178B";
const BSC_PROVIDER_URL = "https://bsc-testnet-rpc.publicnode.com"; // Replace with actual BSC provider
const AGA_CONTRACT_ADDRESS = "0xa51Afd67b83c5f8d613F7d02Ad4D0861E527E077";
const FEE_HANDLER_CONTRACT = "0x0be5C15B5aBCF0D6455366bD1424b43210aE35A7";
const ERC20_HANDLER_CONTRACT = "0x0BF505e0209792dE9d7B8A0F592c9E14868B47aB";
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];
const BRIDGE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "destinationDomainID",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "resourceID",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "depositData",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "feeData",
        "type": "bytes"
      }
    ],
    "name": "deposit",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "depositNonce",
        "type": "uint64"
      },
      {
        "internalType": "bytes",
        "name": "handlerResponse",
        "type": "bytes"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
]
const FEE_HANDLER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "fromDomainID",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "destinationDomainID",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "resourceID",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "depositData",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "feeData",
        "type": "bytes"
      }
    ],
    "name": "calculateFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const HomePage: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [fees, setFees] = useState('');
  const [status, setStatus] = useState('')

  // Watch for changes in the "amount" field
  const amount = watch("amount");

   // Mock API simulation
   const mockFetchFees = async (amount: string) => {
    setStatus("Fetching fees...");
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mocked fee calculation
        const mockedFee = `${
          (parseFloat(amount || "0") * 0.01).toFixed(4)
        } AGA + 0.005 BNB`;
        resolve(mockedFee);
      }, 2000); // Simulates a 2-second API delay
    });
  };

  // Debounced callback for mock fee calculation
  const debounceFetchFees = useDebouncedCallback(async (value) => {
    if (!value) {
      setFees("Enter an amount to calculate fees");
      return;
    }

    try {
      const fee = await mockFetchFees(value);
      setFees(fee as string);
      setStatus("Fees fetched successfully.");
    } catch (error) {
      console.error("Error fetching fees:", error);
      setStatus("Failed to fetch fees.");
      setFees("Error calculating fees.");
    }
  }, 700); // 700ms debounce delay

  // UseEffect to call the debounced function whenever "amount" changes
  useEffect(() => {
    debounceFetchFees(amount);
  }, [amount, debounceFetchFees]);

  const _deposit = async ({ 
    destinationDomainID, 
    resourceId, 
    depositData, 
    feeData
  }) => {
    // @ts-ignore
    if (!window.ethereum) {
      console.error("MetaMask is not installed");
      return;
    }
    
    setStatus(status => status + `Initiating Deposit...\n`);
    
    try {
      // Connect to MetaMask
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request account access
      const signer = await provider.getSigner(); // Get the signer for the connected account
      
      const contract = new Contract(BRIDGE_CONTRACT, BRIDGE_ABI, signer);
  
      // Send the transaction
      const tx = await contract.deposit(
        destinationDomainID,
        resourceId,
        depositData,
        feeData,
        { value: DEPOSIT_FEE }
      );
  
      setStatus(status => status + `Transaction Sent. Hash: ${tx.hash}\n`);
      setStatus(status => status + `Waiting for finalization... \n`);
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      setStatus(status => status + `Transaction Mined. Hash: ${receipt.hash}\n`);
      return { hash: tx.hash, receipt }; // Return hash and receipt if needed
    } catch (error) {
      setStatus(status => status + `"Error Deposit:", error\n`);
    }
  };

  const _requestApproval = async ({ spenderAddress, amount }) => {
    try {
      // @ts-ignore
      const windowEthereum = window.ethereum; 
      if (!windowEthereum) {
        console.error("MetaMask is not installed");
        return;
      }

      setStatus("Requesting for approval... \n");
  
      // @ts-ignore
      const provider = new ethers.BrowserProvider(windowEthereum);
      await provider.send("eth_requestAccounts", []); // Request account access
      const signer = await provider.getSigner(); // Get the signer for the connected account
  
      // Create a contract instance with the signer
      const contract = new Contract(AGA_CONTRACT_ADDRESS, ERC20_ABI, signer);
  
      // Approve the spender for the specified amount
      const tx = await contract.approve(spenderAddress, amount);
      setStatus(status => status + `Approval transaction sent: ${tx.hash} \n`);
      
      setStatus(status => status + `Waiting for approval finalization...\n`);
      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      setStatus(status => status + `Approval transaction confirmed: ${receipt.hash}\n`);

      return receipt;
    } catch (error) {
      setStatus(status => status + `Error during approval:`);
      return
    }
  };

  const onSubmit = (data: any) => {
    const amountInHex = toBeHex(parseUnits((data.amount || "0"), AGA_DECIMALS))
    const amountInBytes = zeroPadValue(amountInHex, 32);

    // public key is needed not the actual address for Substrate chain
    const recipientInPublicKey = decodeAddress(data.destinationAddress);
    const recipientPublicKeyInHex = u8aToHex(recipientInPublicKey);

    const recipientLength = zeroPadValue(toBeHex(recipientInPublicKey.length), 32);

    const depositData = concat([amountInBytes, recipientLength, recipientPublicKeyInHex]);

    console.log("Form Data:", depositData);
  };
  
  return (
    <div className={styles.bridgeContainer}>
      <header className={styles.bridgeHeader}>
        <h1>AGA Cross-Chain Bridge</h1>
        <h2>{fees}</h2>
      </header>
      <main className={styles.bridgeMain}>
        <form className={styles.bridgeForm} onSubmit={handleSubmit(onSubmit)}>
          {/* From Chain Selection */}
          <div className={styles.bridgeSelect}>
            <label>From</label>
            <select {...register("chainA", { required: "Please select a chain" })}>
              <option value="bnb">BNB Smart Chain</option>
            </select>
            {errors.chainA && <p className={styles.error}>{String(errors.chainA.message)}</p>}
          </div>

          <div className={styles.bridgeArrow}></div>

          {/* To Chain Selection */}
          <div className={styles.bridgeSelect}>
            <label>To</label>
            <select {...register("chainB", { required: "Please select a chain" })}>
              <option value="aga">AGA Mainnet</option>
            </select>
            {errors.chainB && <p className={styles.error}>{String(errors.chainB.message)}</p>}
          </div>

          {/* Amount Input */}
          <div className={styles.bridgeInput}>
            <label>You Send</label>
            <input
              type="number"
              {...register("amount", {
                required: "Please enter an amount",
                validate: (value) =>
                  value > 0 || "Amount must be greater than 0",
                max: { value: 1000000000, message: "Amount exceeds the maximum limit" },
              })}
              step="0.0001" // Allows decimal values with precision
              onKeyDown={(e) => {
                if (!/[0-9.\b]/.test(e.key) && e.key !== "Backspace") {
                  e.preventDefault();
                }
              }}
              inputMode="decimal" // Optimizes mobile keyboard for decimal input
            />
            <span className={styles.max}>Max: 0 AGA ($0)</span>
            {errors.amount && <p className={styles.error}>{String(errors.amount.message)}</p>}
          </div>

          {/* Destination Address Input */}
          <div className={styles.bridgeInput}>
            <label>Destination Address</label>
            <input
              type="text"
              placeholder="AGA Address"
              {...register("destinationAddress", {
                required: "Please enter a destination address",
              })}
            />
            {errors.destinationAddress && (
              <p className={styles.error}>{String(errors.destinationAddress.message)}</p>
            )}
            <div className={styles.addressDisclaimer}>
              <p>
                <input
                  type="checkbox"
                  {...register("addressConfirmed", { required: true })}
                />{" "}
                I confirmed the address is correct and not an exchange or contract address.
                Any tokens sent to an incorrect address will be unrecoverable.
              </p>
              {errors.addressConfirmed && (
                <p className={styles.error}>You must confirm the address.</p>
              )}
            </div>
          </div>

          {/* Receive Card */}
          <div className={styles.bridgeReceive}>
            <label>You Receive</label>
            <ReceiveCard
              amount={"100"}
              token={"AGA"}
              estimatedTime={"~2mins"}
              fees={"0.005 BNB + 0.0199 USDC + 2.1976 USDT"}
            />
          </div>

          {/* Submit Button */}
          <button
            className={styles.sendButton}
            type="submit"
            disabled={!watch("addressConfirmed")}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
};

export default HomePage;
