import styles from "./WalletListDialog.module.css";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useWalletProvider } from "~/hooks/useWalletProvider";
import { formatAddress } from "~/utils";

const WalletListDialog = () => {
	const { wallets, connectWallet, selectedAccount, disconnectWallet } = useWalletProvider();

	if (selectedAccount) {
		return (
			<div className={styles.selectedWalletContainer}>
				<span>{formatAddress(selectedAccount)}</span>
				<button className={`${styles.button} ${styles.disconnectButton}`} onClick={disconnectWallet}>
					Disconnect
				</button>
			</div>
		);
	}

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button className={`${styles.button} ${styles.connectWalletButton}`}>Connect Wallet</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className={styles.dialogOverlay} />
				<Dialog.Content className={styles.dialogContent}>
					<Dialog.Title className={styles.dialogTitle}>Wallets</Dialog.Title>
					<Dialog.Description className={styles.dialogDescription}>
						List of all supported wallets installed in your browser
					</Dialog.Description>
					<div>
						{Object.keys(wallets).length > 0 ? (
							Object.values(wallets).map((provider) => (
								<button
									className={styles.button}
									key={provider.info.uuid}
									onClick={() => connectWallet(provider.info.rdns)}
								>
									<img src={provider.info.icon} alt={provider.info.name} />
									<p className={styles.providerName}>{provider.info.name}</p>
								</button>
							))
						) : (
							<div>There are no Announced Providers</div>
						)}
					</div>

					<Dialog.Close asChild>
						<button className={styles.iconButton} aria-label="Close">
							<Cross2Icon />
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default WalletListDialog;
