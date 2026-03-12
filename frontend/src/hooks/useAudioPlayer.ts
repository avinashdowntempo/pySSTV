import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** URL of the track currently loaded */
  currentUrl: string | null;
}

export interface AudioPlayerControls {
  play: (url: string) => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export function useAudioPlayer(): [AudioPlayerState, AudioPlayerControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentUrl: null,
  });

  // Lazily create a single Audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  }, []);

  // Sync audio events → state
  useEffect(() => {
    const audio = getAudio();

    const onTimeUpdate = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [getAudio]);

  const play = useCallback(
    (url: string) => {
      const audio = getAudio();
      if (audio.src !== url) {
        audio.src = url;
        audio.load();
      }
      audio.play();
      setState((s) => ({ ...s, currentUrl: url }));
    },
    [getAudio],
  );

  const pause = useCallback(() => {
    getAudio().pause();
  }, [getAudio]);

  const stop = useCallback(() => {
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
  }, [getAudio]);

  const seek = useCallback(
    (time: number) => {
      const audio = getAudio();
      audio.currentTime = time;
      setState((s) => ({ ...s, currentTime: time }));
    },
    [getAudio],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  return [state, { play, pause, stop, seek }];
}
