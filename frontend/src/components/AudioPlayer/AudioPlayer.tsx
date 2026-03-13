import type {
  AudioPlayerState,
  AudioPlayerControls,
} from "../../hooks/useAudioPlayer";
import styles from "./AudioPlayer.module.css";

interface Props {
  state: AudioPlayerState;
  controls: AudioPlayerControls;
  onNext?: () => void;
}

function formatTime(secs: number) {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ state, controls, onNext }: Props) {
  const active = state.currentUrl !== null;

  return (
    <div className={`${styles.player} ${active ? "" : styles.inactive}`}>
      <div className={styles.transport}>
        {state.isPlaying ? (
          <button
            className={`${styles.btn} ${styles.playBtn}`}
            onClick={controls.pause}
            title="Pause"
          >
            ⏸
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.playBtn}`}
            onClick={() => state.currentUrl && controls.play(state.currentUrl)}
            title="Play"
          >
            ▶
          </button>
        )}
        <button className={styles.btn} onClick={controls.stop} title="Stop">
          ⏹
        </button>
        {onNext && (
          <button className={styles.btn} onClick={onNext} title="Next">
            ⏭
          </button>
        )}
      </div>

      <input
        className={styles.bar}
        type="range"
        min={0}
        max={state.duration || 0}
        step={0.1}
        value={state.currentTime}
        onChange={(e) => controls.seek(Number(e.target.value))}
      />
      <div className={styles.time}>
        <span>{formatTime(state.currentTime)}</span>
        <span>{formatTime(state.duration)}</span>
      </div>
    </div>
  );
}
