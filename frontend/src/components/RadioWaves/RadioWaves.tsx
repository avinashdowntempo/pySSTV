import styles from "./RadioWaves.module.css";

interface Props {
  active: boolean;
}

export default function RadioWaves({ active }: Props) {
  return (
    <svg
      className={`${styles.container} ${active ? styles.active : ""}`}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Antenna tower */}
      <line
        x1="20"
        y1="72"
        x2="20"
        y2="24"
        stroke="url(#rw-grad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="72"
        x2="20"
        y2="52"
        stroke="url(#rw-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="72"
        x2="20"
        y2="52"
        stroke="url(#rw-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Antenna tip */}
      <circle
        cx="20"
        cy="22"
        r="3"
        fill="url(#rw-grad)"
        className={styles.tip}
      />

      {/* Wave arcs — 4 concentric, staggered animation */}
      <path
        d="M30,22 Q38,14 30,6"
        stroke="url(#rw-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={styles.wave1}
      />
      <path
        d="M36,28 Q48,14 36,0"
        stroke="url(#rw-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={styles.wave2}
      />
      <path
        d="M42,34 Q58,14 42,-6"
        stroke="url(#rw-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        className={styles.wave3}
      />
      <path
        d="M48,40 Q68,14 48,-12"
        stroke="url(#rw-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={styles.wave4}
      />

      {/* Downward waves for symmetry */}
      <path
        d="M30,22 Q38,30 30,38"
        stroke="url(#rw-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={styles.wave1}
      />
      <path
        d="M36,16 Q48,30 36,44"
        stroke="url(#rw-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={styles.wave2}
      />
      <path
        d="M42,10 Q58,30 42,50"
        stroke="url(#rw-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        className={styles.wave3}
      />
      <path
        d="M48,4  Q68,30 48,56"
        stroke="url(#rw-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={styles.wave4}
      />
    </svg>
  );
}
