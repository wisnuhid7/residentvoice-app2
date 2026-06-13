import { useEffect, useState } from "react";

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationKeys = Object.keys(durations);

  useEffect(() => {
    // start recording immediately
    // @ts-ignore
    window.startRecording?.();

    let currentIndex = 0;
    
    function advanceScene() {
      const currentDuration = durations[durationKeys[currentIndex]];
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % durationKeys.length;
        if (currentIndex === 0) {
          // @ts-ignore
          window.stopRecording?.();
        }
        setCurrentScene(currentIndex);
        advanceScene();
      }, currentDuration);
    }
    
    advanceScene();
    
    return () => {
      // cleanup
    };
  }, []);

  return { currentScene };
}