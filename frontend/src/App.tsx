import { useCallback, useState } from "react";
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
  const [page, setPage] = useState<"home" | "guide">("home");

  const handleNext = useCallback(() => {
    const doneJobs = jobs.filter((j) => j.status === "done" && j.audioUrl);
    if (doneJobs.length === 0) return;

    const currentIdx = doneJobs.findIndex(
      (j) => j.audioUrl === audioState.currentUrl,
    );
    const nextIdx = (currentIdx + 1) % doneJobs.length;
    audioControls.play(doneJobs[nextIdx].audioUrl!);
  }, [jobs, audioState.currentUrl, audioControls]);

  if (page === "guide") {
    return (
      <HowToUse
        onBack={() => {
          setPage("home");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <div className={styles.app}>
      <a href="#main-content" className={styles.skipNav}>
        Skip to main content
      </a>

      <header className={styles.header}>
        <RadioWaves active={audioState.isPlaying} />
        <img src="/logo.png" alt="WavePix" className={styles.logo} />
        <RadioWaves active={audioState.isPlaying} />
      </header>

      <nav className={styles.nav} aria-label="Main navigation">
        <button
          type="button"
          className={styles.guideLink}
          onClick={() => {
            setPage("guide");
            window.scrollTo(0, 0);
          }}
        >
          📖 How to use
        </button>
      </nav>

      <main id="main-content" className={styles.main}>
        <UploadForm onSubmit={addJobs} />

        <div
          className={`${styles.demoWrap} ${jobs.length > 0 ? styles.demoHidden : ""}`}
          aria-hidden={jobs.length > 0}
        >
          <DemoSection
            currentUrl={audioState.currentUrl}
            isPlaying={audioState.isPlaying}
            onPlay={audioControls.play}
          />
        </div>

        <BatchList
          jobs={jobs}
          audioState={audioState}
          onPlay={audioControls.play}
          onRemove={removeJob}
          onClearCompleted={clearCompleted}
        />
      </main>

      <footer className={styles.playerSticky} role="contentinfo">
        <AudioPlayer
          state={audioState}
          controls={audioControls}
          onNext={
            jobs.some((j) => j.status === "done") ? handleNext : undefined
          }
        />
      </footer>
    </div>
  );
}
