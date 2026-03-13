import { useCallback } from "react";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useConversionQueue } from "./hooks/useConversionQueue";
import { UploadForm } from "./components/UploadForm";
import { AudioPlayer } from "./components/AudioPlayer";
import { BatchList } from "./components/BatchList";
import { DemoSection } from "./components/DemoSection";
import { HowToUse } from "./components/HowToUse";
import { RadioWaves } from "./components/RadioWaves";
import styles from "./App.module.css";

export default function App() {
  const [audioState, audioControls] = useAudioPlayer();
  const { jobs, addJobs, removeJob, clearCompleted } = useConversionQueue();

  const handleNext = useCallback(() => {
    const doneJobs = jobs.filter((j) => j.status === "done" && j.wavUrl);
    if (doneJobs.length === 0) return;

    const currentIdx = doneJobs.findIndex(
      (j) => j.wavUrl === audioState.currentUrl,
    );
    const nextIdx = (currentIdx + 1) % doneJobs.length;
    audioControls.play(doneJobs[nextIdx].wavUrl!);
  }, [jobs, audioState.currentUrl, audioControls]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <RadioWaves active={audioState.isPlaying} />
        <img src="/logo.svg" alt="WavePix" className={styles.logo} />
        <RadioWaves active={audioState.isPlaying} />
      </header>

      <UploadForm onSubmit={addJobs} />

      <DemoSection
        currentUrl={audioState.currentUrl}
        isPlaying={audioState.isPlaying}
        onPlay={audioControls.play}
      />

      <HowToUse />

      <BatchList
        jobs={jobs}
        audioState={audioState}
        onPlay={audioControls.play}
        onRemove={removeJob}
        onClearCompleted={clearCompleted}
      />

      <div className={styles.playerSticky}>
        <AudioPlayer
          state={audioState}
          controls={audioControls}
          onNext={
            jobs.some((j) => j.status === "done") ? handleNext : undefined
          }
        />
      </div>
    </div>
  );
}
