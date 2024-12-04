import { useEffect, useState } from 'react';
import styles from './Bridge.module.css';
import { useWalletProvider } from '~/hooks/useWalletProvider';
import { Contract, ethers, formatEther, formatUnits, JsonRpcProvider, parseEther, parseUnits, toBeHex, Wallet } from 'ethers';
import { u8aToHex} from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
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

export const Bridge = () => {
  const { selectedWallet, selectedAccount, disconnectWallet } = useWalletProvider()
  const [bscBalance, setBscBalance] = useState(null);
  const [agaAsset, setAgaAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

    useEffect(() => {
    if (!selectedAccount) return;

    const fetchBalances = async () => {
      setLoading(true);
      try {
        await fetchBscBalance();
        await fetchAgaBalance();
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [selectedAccount]);

  const fetchBscBalance = async () => {
    const provider = new JsonRpcProvider(BSC_PROVIDER_URL);
    try {
      const rawBscBalance = await provider.getBalance(selectedAccount);
      setBscBalance(formatEther(rawBscBalance));
    } catch (error) {
      console.error("Error fetching BSC balance:", error);
    }
  };

  const fetchAgaBalance = async () => {
    const provider = new JsonRpcProvider(BSC_PROVIDER_URL);
    const contract = new Contract(AGA_CONTRACT_ADDRESS, ERC20_ABI, provider);
    try {
      const rawAgaBalance = await contract.balanceOf(selectedAccount);
      const agaBalance = rawAgaBalance.toString();
      const rawAgaTotalSupply = await contract.totalSupply();
      const agaTotalSupply = rawAgaTotalSupply.toString();
      const tokenOwner = await contract.owner();

      setAgaAsset({
        id: AGA_CONTRACT_ADDRESS,
        owner: tokenOwner,
        supply: agaTotalSupply,
        balance: agaBalance,
        name: "AGA",
        symbol: "AGA",
        decimals: 12,
      });
    } catch (error) {
      console.error("Error fetching AGA balance:", error);
    }
  };


  const _deposit = async ({ destinationDomainID, resourceId, depositData, feeData }) => {
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
      
      const contract = new ethers.Contract(BRIDGE_CONTRACT, BRIDGE_ABI, signer);
  
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

  const handleSubmitDeposit = async (event) => {
    event.preventDefault();

    // Use FormData API to get the form data
    const formData = new FormData(event.target);

    // Extract individual values
    const amount = formData.get('amount'); // Corresponds to the name attribute of the input
    const amountBytes = ethers.zeroPadValue(toBeHex(parseUnits(String(Number(amount)), AGA_DECIMALS)), 32);
    const recipientAddr = formData.get('recipient-address');
    const publicKey = decodeAddress(String(recipientAddr));
    const publicKeyHex = u8aToHex(publicKey);
    // Convert recipient length to bytes and pad to 32 bytes
    const recipientLength = ethers.zeroPadValue(ethers.toBeHex(publicKey.length), 32);

    // Concatenate all parts into a single Uint8Array
    const depositData = ethers.concat([amountBytes, recipientLength, publicKeyHex]);
    const depositDataHex = ethers.hexlify(depositData);

    const resourceIdHex = ethers.zeroPadValue(ethers.toBeHex(AGA_BSC_RESOURCE_ID), 32);
    // const decimalHex = ethers.toBeHex(AGA_DECIMALS);
    const feeData = ethers.zeroPadValue(ethers.toBeHex(0), 32);

    // Request approval
    await _requestApproval({
        spenderAddress: ERC20_HANDLER_CONTRACT,
        amount: parseUnits(amount.toString(), AGA_DECIMALS)
    });

    await _deposit({
      destinationDomainID: 1, 
      resourceId: resourceIdHex,
      depositData: depositDataHex,
      feeData
    });
  }

  return (
    <div className={styles.container}>
      <h2>BSC to AGA Mainnet</h2>
      <h3>Account Balance : ({`${bscBalance ?? 0}`} BNB)</h3>
      <form className={styles.form} onSubmit={handleSubmitDeposit}>
        <label className={styles.label} htmlFor='amount'>
          <span className={styles.tokenAddress}>
            {AGA_CONTRACT_ADDRESS}
          </span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => {
              navigator.clipboard.writeText(AGA_CONTRACT_ADDRESS)
                .then(() => alert("Token Contract Address Copied!"))
                .catch((error) => console.error("Failed to copy text:", error));
            }}
          >
            Copy token contract
          </button>
        </label>
        <label className={styles.label} htmlFor="amount">
          Amount ({`${formatUnits(agaAsset?.balance ?? 0, 12)} ${agaAsset?.symbol ?? ''}`})
        </label>
        <input
          className={styles.input}
          name="amount"
          type="number"
          required
          min={0}
        />

        <label className={styles.label} htmlFor="recipient-address">
          Recipient Address
        </label>
        <input
          className={styles.input}
          name="recipient-address"
          type="text"
        />

        <p className={styles.feeDetails}>Fee details</p>
        <p>FEE PER DEPOSIT {`${formatEther(DEPOSIT_FEE)} BNB`}</p>
        <button className={styles['deposit-button']} type="submit">
          Deposit
        </button>
        {status != '' && <p>{status}</p>}
      </form>
    </div>
  );
};