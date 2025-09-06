/**
 * Custom hook for managing audio notifications
 * Handles sound playback, volume control, and audio preferences
 */

import { useCallback, useRef, useState, useEffect } from 'react';

export interface AudioOptions {
  volume?: number; // 0.0 to 1.0
  loop?: boolean;
  preload?: boolean;
}

export interface SoundConfig {
  id: string;
  name: string;
  url: string;
  defaultVolume?: number;
}

// Available notification sounds
export const NOTIFICATION_SOUNDS: SoundConfig[] = [
  {
    id: 'work-complete',
    name: 'Work Complete',
    url: '/sounds/work-complete.mp3',
    defaultVolume: 0.7,
  },
  {
    id: 'break-complete',
    name: 'Break Complete',
    url: '/sounds/break-complete.mp3',
    defaultVolume: 0.7,
  },
  {
    id: 'timer-start',
    name: 'Timer Start',
    url: '/sounds/start.mp3',
    defaultVolume: 0.5,
  },
  {
    id: 'timer-tick',
    name: 'Timer Tick',
    url: '/sounds/tick.mp3',
    defaultVolume: 0.3,
  },
];

// Fallback to system beep or generated tone if no audio files
const generateBeepTone = (frequency: number = 800, duration: number = 200) => {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Could not generate audio tone:', error);
  }
};

export const useAudio = () => {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [globalVolume, setGlobalVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);

  // Preload audio files
  const preloadSounds = useCallback(async () => {
    setIsLoading(true);
    try {
      for (const sound of NOTIFICATION_SOUNDS) {
        if (!audioRefs.current.has(sound.id)) {
          const audio = new Audio(sound.url);
          audio.preload = 'auto';
          audio.volume = (sound.defaultVolume || 0.7) * globalVolume;

          // Handle load errors gracefully
          audio.addEventListener('error', () => {
            console.warn(`Failed to load audio: ${sound.url}`);
          });

          audioRefs.current.set(sound.id, audio);
        }
      }
    } catch (error) {
      console.warn('Error preloading sounds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [globalVolume]);

  // Update volume for all audio instances
  useEffect(() => {
    audioRefs.current.forEach((audio, soundId) => {
      const soundConfig = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
      const defaultVolume = soundConfig?.defaultVolume || 0.7;
      audio.volume = defaultVolume * globalVolume;
    });
  }, [globalVolume]);

  // Play a sound by ID
  const playSound = useCallback(
    async (soundId: string, options: AudioOptions = {}) => {
      if (!isAudioEnabled) return;

      try {
        const audio = audioRefs.current.get(soundId);

        if (audio) {
          // Reset audio to beginning
          audio.currentTime = 0;

          // Apply options
          if (options.volume !== undefined) {
            audio.volume = Math.max(
              0,
              Math.min(1, options.volume * globalVolume)
            );
          }

          if (options.loop !== undefined) {
            audio.loop = options.loop;
          }

          await audio.play();
        } else {
          // Fallback to generated beep tone
          console.warn(
            `Audio file not found for sound: ${soundId}, using fallback beep`
          );

          // Different tones for different notification types
          let frequency = 800;
          let duration = 200;

          switch (soundId) {
            case 'work-complete':
              frequency = 1000;
              duration = 300;
              break;
            case 'break-complete':
              frequency = 600;
              duration = 300;
              break;
            case 'timer-start':
              frequency = 800;
              duration = 150;
              break;
            case 'timer-tick':
              frequency = 400;
              duration = 50;
              break;
          }

          generateBeepTone(frequency, duration);
        }
      } catch (error) {
        console.warn('Error playing sound:', error);
        // Fallback to system beep
        generateBeepTone();
      }
    },
    [isAudioEnabled, globalVolume]
  );

  // Stop a sound
  const stopSound = useCallback((soundId: string) => {
    const audio = audioRefs.current.get(soundId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    audioRefs.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  // Toggle audio on/off
  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => !prev);
  }, []);

  // Set master volume (0.0 to 1.0)
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setGlobalVolume(clampedVolume);
  }, []);

  // Test sound playback
  const testSound = useCallback(
    (soundId: string) => {
      playSound(soundId);
    },
    [playSound]
  );

  // Initialize on mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  return {
    // Audio controls
    playSound,
    stopSound,
    stopAllSounds,
    testSound,

    // Settings
    isAudioEnabled,
    globalVolume,
    toggleAudio,
    setVolume,

    // State
    isLoading,

    // Sound library
    availableSounds: NOTIFICATION_SOUNDS,

    // Utility
    preloadSounds,
  };
};

export default useAudio;
