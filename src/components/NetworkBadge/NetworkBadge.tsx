import styles from "./NetworkBadge.module.css";
import React from "react";

interface NetworkBadgeProps {
  networkName: string;
}

const NetworkBadge: React.FC<NetworkBadgeProps> = ({ networkName }) => {
  return (
    <div className={styles.networkBadge}>
      <span className={styles.networkName}>{networkName}</span>
    </div>
  );
};

export default NetworkBadge;
