'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';

const JUMP_SPEED = 12;
const GRAVITY = 0.6;
const DINO_HEIGHT = 60;
const DINO_WIDTH = 60;
const CACTUS_WIDTH = 40;
const CACTUS_HEIGHT = 40;
const GAME_SPEED = 8;

// Array of available background images
const BACKGROUNDS = [
  '/background.jpg',
  '/@background.jpg',
  '/pumpkin_hill.jpg',
  '/windy_valley.png',
  '/radical_highway.jpg'
];

export default function DinoGame() {
  const [isJumping, setIsJumping] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [dinoY, setDinoY] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [cactusX, setCactusX] = useState(800);
  const [volume, setVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [currentBackground, setCurrentBackground] = useState(BACKGROUNDS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hurtSoundRef = useRef<HTMLAudioElement | null>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!gameContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await gameContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleFullscreen]);

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize audio elements
  useEffect(() => {
    // Background music
    audioRef.current = new Audio('/live_and_learn.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Hurt sound effect
    hurtSoundRef.current = new Audio('/hurt.mp3');
    hurtSoundRef.current.volume = sfxVolume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (hurtSoundRef.current) {
        hurtSoundRef.current.src = '';
      }
    };
  }, []);

  // Update volumes when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (hurtSoundRef.current) {
      hurtSoundRef.current.volume = sfxVolume;
    }
  }, [sfxVolume]);

  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true);
      setVelocity(JUMP_SPEED);
    }
  }, [isJumping, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCactusX(800);
    setDinoY(0);
    setVelocity(0);
    // Set a new random background
    setCurrentBackground(getRandomBackground());
    
    // Start playing music when game starts
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log('Audio playback failed:', error);
      });
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    // Play hurt sound
    if (hurtSoundRef.current) {
      hurtSoundRef.current.currentTime = 0;
      hurtSoundRef.current.play().catch(error => {
        console.log('SFX playback failed:', error);
      });
    }
    // Stop music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const checkCollision = useCallback(() => {
    const dinoRect = {
      x: 100,
      y: 300 - DINO_HEIGHT - dinoY,
      width: DINO_WIDTH,
      height: DINO_HEIGHT,
    };

    const cactusRect = {
      x: cactusX,
      y: 300 - CACTUS_HEIGHT - 10,
      width: CACTUS_WIDTH,
      height: CACTUS_HEIGHT,
    };

    if (
      dinoRect.x < cactusRect.x + cactusRect.width &&
      dinoRect.x + dinoRect.width > cactusRect.x &&
      dinoRect.y < cactusRect.y + cactusRect.height &&
      dinoRect.y + dinoRect.height > cactusRect.y
    ) {
      handleGameOver();
    }
  }, [cactusX, dinoY]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        jump();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [gameStarted, gameOver, jump]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setDinoY((prevY) => {
        const newY = prevY + velocity;
        return Math.max(0, newY);
      });

      setVelocity((prevVelocity) => {
        const newVelocity = prevVelocity - GRAVITY;
        if (dinoY === 0 && newVelocity < 0) {
          setIsJumping(false);
          return 0;
        }
        return newVelocity;
      });

      setCactusX((prevX) => {
        const newX = prevX - GAME_SPEED;
        if (newX < -CACTUS_WIDTH) {
          setScore((prevScore) => prevScore + 1);
          return 800;
        }
        return newX;
      });

      checkCollision();
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, dinoY, velocity, checkCollision]);

  // Function to get a random background
  const getRandomBackground = () => {
    const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
    return BACKGROUNDS[randomIndex];
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Volume Controls */}
      <div className="flex items-center justify-between gap-4 bg-black/20 p-3 rounded-lg w-full max-w-[800px]">
        <div className="flex items-center gap-6">
          {/* Music Volume */}
          <div className="flex items-center gap-2">
            <label htmlFor="volume" className="text-sm font-medium text-white whitespace-nowrap">
              Music:
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-white min-w-[3rem]">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* SFX Volume */}
          <div className="flex items-center gap-2">
            <label htmlFor="sfx-volume" className="text-sm font-medium text-white whitespace-nowrap">
              SFX:
            </label>
            <input
              id="sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVolume}
              onChange={(e) => setSfxVolume(Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-white min-w-[3rem]">
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Game Container */}
      <div 
        ref={gameContainerRef}
        className={`relative w-[800px] border-4 border-yellow-400 overflow-hidden cursor-pointer ${
          isFullscreen ? 'h-screen w-screen' : 'h-[400px]'
        }`}
        onClick={gameStarted ? jump : startGame}
        style={{
          backgroundImage: `url(${currentBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-2xl font-bold text-white">Click to Start</p>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-4">Game Over!</p>
              <p className="text-xl text-white mb-4">Score: {score}</p>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Dino */}
        <div
          className="absolute"
          style={{
            bottom: dinoY,
            left: '100px',
            transition: 'bottom 0.05s linear'
          }}
        >
          <Image
            src="/running.png"
            alt="Dino"
            width={DINO_WIDTH}
            height={DINO_HEIGHT}
            priority
          />
        </div>

        {/* Cactus/Bot */}
        <div
          className="absolute"
          style={{
            bottom: '10px',
            left: `${cactusX}px`,
          }}
        >
          <Image
            src="/bot.png"
            alt="Bot"
            width={CACTUS_WIDTH}
            height={CACTUS_HEIGHT}
            priority
          />
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 w-full h-[2px] bg-gray-800" />

        {/* Score */}
        <div className="absolute top-4 right-4 text-xl font-bold text-white">
          Score: {score}
        </div>
      </div>
    </div>
  );
} 