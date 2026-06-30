"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function BgmToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeInterval = useRef<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current);
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // Immediate pause
      if (fadeInterval.current) clearInterval(fadeInterval.current);
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Fade in logic
      if (fadeInterval.current) clearInterval(fadeInterval.current);
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        let vol = 0;
        fadeInterval.current = setInterval(() => {
          if (vol < 0.95 && audioRef.current) {
            vol += 0.05;
            audioRef.current.volume = vol;
          } else {
            if (audioRef.current) audioRef.current.volume = 1;
            if (fadeInterval.current) clearInterval(fadeInterval.current);
          }
        }, 50); // 50ms * 20 steps = 1000ms fade-in
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  return (
    <>
      <button 
        className={`bgm-btn ${isPlaying ? 'bgm-btn--playing' : ''}`}
        onClick={toggleSound}
        aria-label="Toggle Background Music"
        title="Toggle Epic BGM (Avicii - The Nights)"
      >
        <div className="bgm-icon-wrapper">
          {isPlaying ? (
            <div className="eq-bars">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
          ) : (
            <span className="mute-icon">🔇</span>
          )}
        </div>
      </button>

      <audio ref={audioRef} loop preload="auto">
        <source src="/audio/avicii-the-nights.m4a" type="audio/mp4" />
      </audio>

      <style jsx>{`
        .bgm-btn {
          position: fixed;
          bottom: var(--space-xl);
          right: var(--space-xl);
          z-index: 999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(15, 20, 35, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .bgm-btn:hover {
          transform: scale(1.1) translateY(-2px);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .bgm-btn--playing {
          border-color: var(--color-accent);
          box-shadow: 0 0 20px var(--color-accent-glow);
        }

        .bgm-icon-wrapper {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mute-icon {
          font-size: 1.2rem;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        .bgm-btn:hover .mute-icon {
          opacity: 1;
        }

        /* Equalizer Animation */
        .eq-bars {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 16px;
        }
        
        .eq-bars .bar {
          display: block;
          width: 4px;
          background-color: var(--color-accent);
          border-radius: 2px;
          animation: bounce 0.5s infinite alternate ease-in-out;
        }
        
        .eq-bars .bar:nth-child(1) { height: 10px; animation-delay: 0s; }
        .eq-bars .bar:nth-child(2) { height: 16px; animation-delay: 0.2s; }
        .eq-bars .bar:nth-child(3) { height: 8px; animation-delay: 0.4s; }

        @keyframes bounce {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </>
  );
}
