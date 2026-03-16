import styles from "./ClubBadge.module.css";

export function ClubBadge() {
  return (
    <a
      href="https://w5hrc.org"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.shield}
    >
      <div className={styles.top}>
        <span className={styles.call}>W5HRC</span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.name}>Hurst Amateur Radio Club</span>
        <span className={styles.est}>Est. 1966 · Hurst, TX</span>
        <span className={styles.label}>Proud Member</span>
      </div>
    </a>
  );
}
