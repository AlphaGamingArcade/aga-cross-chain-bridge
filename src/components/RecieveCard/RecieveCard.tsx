import React from "react";
import styles from "./RecieveCard.module.css";

interface ReceiveCardProps {
  amount: string; // The amount to display (e.g., "47.658942")
  token: string; // The token name (e.g., "USDT")
  estimatedTime: string; // Estimated time (e.g., "~1s")
  fees: string; // Fee details (e.g., "0.005 BNB + 0.0199 USDC + 2.1995 USDT")
}

const ReceiveCard: React.FC<ReceiveCardProps> = ({ amount, token, estimatedTime, fees }) => {
  return (
    <div className={styles.card}>
      <div className={styles.amountRow}>
        <span className={styles.amount}>{amount}</span>
        <span className={styles.token}>{token}</span>
      </div>
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>⏱️</span>
          <span className={styles.detailText}>Time: {estimatedTime}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailIcon}>💸</span>
          <span className={styles.detailText}>Fees: {fees}</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiveCard;
