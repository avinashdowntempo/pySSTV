import styles from "./HowToUse.module.css";

interface Props {
  readonly onBack: () => void;
}

export default function HowToUse({ onBack }: Props) {
  return (
    <div className={styles.page}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        ← Back to converter
      </button>

      <h1 className={styles.pageTitle}>
        📖 How to use with Robot36 & other SSTV apps
      </h1>
      <p className={styles.pageSubtitle}>
        Turn any image into sound, then decode it back on your phone — just like
        a real radio transmission.
      </p>

      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNum}>1</span>
          <div>
            <h3 className={styles.stepTitle}>Convert your image</h3>
            <p className={styles.stepText}>
              Upload an image, pick an SSTV mode (e.g. <strong>MartinM1</strong>{" "}
              or <strong>ScottieS1</strong>), and hit <strong>Convert</strong>.
              Download the resulting WAV file or play it directly in the
              browser.
            </p>
          </div>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <div>
            <h3 className={styles.stepTitle}>Open an SSTV decoder app</h3>
            <p className={styles.stepText}>
              Install one of these free apps on your phone:
            </p>
            <ul className={styles.appList}>
              <li>
                <strong>Robot36</strong> — Android{" "}
                <span className={styles.tag}>Recommended</span>
              </li>
              <li>
                <strong>SSTV Encoder</strong> — Android / iOS
              </li>
              <li>
                <strong>CQ SSTV</strong> — iOS
              </li>
              <li>
                <strong>slowrx</strong> — Linux (desktop)
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <div>
            <h3 className={styles.stepTitle}>Play the audio near your phone</h3>
            <p className={styles.stepText}>
              Play the WAV file from your computer speakers (or use the built-in
              player). Hold your phone near the speaker with the decoder app
              listening. The app will automatically detect the SSTV signal and
              start decoding the image in real time.
            </p>
          </div>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNum}>4</span>
          <div>
            <h3 className={styles.stepTitle}>Watch the image appear</h3>
            <p className={styles.stepText}>
              The decoder will reconstruct the image line by line — just like a
              real radio transmission. The full decode takes about 2 minutes for
              most modes.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>💡 Tips for best results</h3>
        <ul className={styles.tipsList}>
          <li>
            Make sure the decoder app's mode matches the mode you selected (e.g.
            both set to MartinM1). Robot36 auto-detects the mode automatically.
          </li>
          <li>
            Play audio at a comfortable volume — too loud causes distortion, too
            quiet and the decoder can't pick it up.
          </li>
          <li>
            Minimize background noise during playback for a cleaner decode.
          </li>
          <li>
            For the sharpest output, upload images at the mode's native
            resolution (check the info hint under the mode selector).
          </li>
          <li>
            You can also connect your computer's audio output directly to a
            radio transmitter for over-the-air SSTV.
          </li>
        </ul>
      </div>

      <button type="button" className={styles.backBtnBottom} onClick={onBack}>
        ← Back to converter
      </button>
    </div>
  );
}
