import type {
  AudioPlayerState,
  AudioPlayerControls,
} from "../../hooks/useAudioPlayer";
import styles from "./AudioPlayer.module.css";

interface Props {
  readonly state: AudioPlayerState;
  readonly controls: AudioPlayerControls;
  readonly onNext?: () => void;
}

function formatTime(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ state, controls, onNext }: Props) {
  const active = state.currentUrl !== null;

  return (
    <section
      className={`${styles.player} ${active ? "" : styles.inactive}`}
      aria-label="Audio player"
    >
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
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={state.duration || 0}
        aria-valuenow={state.currentTime}
        aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(state.duration)}`}
      />
      <div className={styles.time}>
        <span>{formatTime(state.currentTime)}</span>
        <span>{formatTime(state.duration)}</span>
      </div>
    </section>
  );
}
