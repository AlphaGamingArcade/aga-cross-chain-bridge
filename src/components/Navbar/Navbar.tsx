import React from "react";
import styles from "./Navbar.module.css";
import WalletListDialog from "../WalletListDialog/WalletListDialog";
import NetworkBadge from "../NetworkBadge/NetworkBadge";
import { useNetworkProvider } from "~/hooks/useNetworkProvider";

const Navbar: React.FC = () => {
  const { network, chainId } = useNetworkProvider()

  console.log(network)

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <div className={styles.logo}>AGA Bridge</div>
        <ul className={styles.navLinks}>
          <li>
            <a href="#tokens" className={styles.navLink}>
              Bridge Tokens
            </a>
          </li>
          {/* <li>
            <a href="#nfts" className={styles.navLink}>
              Bridge NFTs
            </a>
          </li> */}
        </ul>
      </div>
      <div className={styles.navbarRight}>
        <NetworkBadge networkName={network} />
        <WalletListDialog />
      </div>
    </nav>
  );
};

export default Navbar;