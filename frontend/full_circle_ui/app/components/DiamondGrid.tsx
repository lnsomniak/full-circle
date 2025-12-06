'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
/// i like this more ^
const CONFIG = {
  // Grid settings
  tileSize: 120,           // Size of each diamond in pixels - these are for me
  gap: 16,                 // Gap between diamonds
  
  // Interaction settings
  hoverRadius: 100,       // How close mouse needs to be to trigger flip (pixels)
  flipBackDelay: 800,     // How long tile stays flipped after mouse leaves (ms)
  
  // Animation settings  
  flipDuration: 400,      // How long the flip animation takes (ms)
  
  colors: {
    background: '#121212',
    tileDefault: '#1a1a1a',
    tileBorder: '#282828', 
    accent: '#1DB954',
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
  }
};


const DEFAULT_ALBUMS = [
  'https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg',
  'https://upload.wikimedia.org/wikipedia/en/7/74/Ye_album_cover.jpg', 
  'https://upload.wikimedia.org/wikipedia/en/0/06/Laufey_-_Bewitched.png', 
  'https://upload.wikimedia.org/wikipedia/en/e/ef/Bad_Bunny_-_Debí_Tirar_Más_Fotos.png', 
  'https://upload.wikimedia.org/wikipedia/en/c/cc/Mon_Laferte_-_Autopoietica.jpg', 
  'https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png', 
  'https://upload.wikimedia.org/wikipedia/en/1/10/Childish_Gambino_-_Awaken%2C_My_Love%21.png', 
  'https://upload.wikimedia.org/wikipedia/en/5/5e/Mac_Miller_-_Swimming.png', 
  'https://upload.wikimedia.org/wikipedia/en/b/b2/Lorde_-_Melodrama.png', 
  'https://upload.wikimedia.org/wikipedia/en/b/b9/Freudian_by_Daniel_Caesar.jpg', 
  'https://upload.wikimedia.org/wikipedia/en/3/3d/Mon_Laferte_-_1940_Carmen.png', 
  'https://upload.wikimedia.org/wikipedia/en/4/44/Maná_Sueños_Líquidos_cover_small.jpg',
];

interface Tile {
  id: number;
  x: number;
  y: number;
  albumUrl: string;
  isFlipped: boolean;
  flipTimeout: NodeJS.Timeout | null;
}

interface DiamondGridProps {
  albumArts?: string[];
}

interface DiamondTileProps {
  tile: Tile;
  tileSize: number;
}

/// not sure if the commits will show, but it let be known i reorganized this entire section over a single bug. 
function DiamondTile({ tile, tileSize }: DiamondTileProps) {
  return (
    <div
      className="absolute transition-transform"
      style={{
        left: tile.x,
        top: tile.y,
        width: tileSize,
        height: tileSize,
        transform: `rotate(45deg) ${tile.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
        transformStyle: 'preserve-3d',
        transitionDuration: `${CONFIG.flipDuration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="absolute inset-0 rounded-sm border"
        style={{
          backgroundColor: CONFIG.colors.tileDefault,
          borderColor: CONFIG.colors.tileBorder,
          backfaceVisibility: 'hidden',
        }}
      />
      <div
        className="absolute inset-0 rounded-sm overflow-hidden"
        style={{
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
        }}
      >
        <img
          src={tile.albumUrl}
          alt="Album art"
          className="w-full h-full object-cover"
          style={{ transform: 'rotate(-45deg) scale(1.5)' }}
          loading="lazy"
        />
      </div>
    </div>
  );
}

export default function DiamondGrid({ albumArts = [] }: DiamondGridProps) {
  const albumImages = albumArts.length > 0 ? albumArts : DEFAULT_ALBUMS;

  const lastUpdateRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loadingText, setLoadingText] = useState('Initializing');

  const loadingMessages = [
    'Turning on the engine',
    'Consulting the algorithm',
    'Finding hidden gems',
    'Curating recommendations',
    'Almost there',
  ];
// let it be known no bug will stop me. 
  useEffect(() => {
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[messageIndex]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generateTiles = () => {
      if (!containerRef.current) return;

      const { clientWidth, clientHeight } = containerRef.current;
      const effectiveTileSize = CONFIG.tileSize + CONFIG.gap;

      const cols = Math.ceil(clientWidth / effectiveTileSize) + 2;
      const rows = Math.ceil(clientHeight / effectiveTileSize) + 2;

      const newTiles: Tile[] = [];
      let id = 0;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const offsetX = row % 2 === 0 ? 0 : effectiveTileSize / 2;

          newTiles.push({
            id: id++,
            x: col * effectiveTileSize + offsetX,
            y: row * effectiveTileSize * 0.7,
            albumUrl: albumImages[id % albumImages.length],
            isFlipped: false,
            flipTimeout: null,
          });
        }
      }

      setTiles(newTiles);
    };

    generateTiles();
    window.addEventListener('resize', generateTiles);
    return () => window.removeEventListener('resize', generateTiles);
  }, [albumImages]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    setTiles(prevTiles =>
      prevTiles.map(tile => {
        const tileCenterX = tile.x + CONFIG.tileSize / 2;
        const tileCenterY = tile.y + CONFIG.tileSize / 2;

        const distance = Math.sqrt(
          Math.pow(mousePos.x - tileCenterX, 2) +
          Math.pow(mousePos.y - tileCenterY, 2)
        );

        const shouldFlip = distance < CONFIG.hoverRadius;

        if (shouldFlip && !tile.isFlipped) {
          if (tile.flipTimeout) clearTimeout(tile.flipTimeout);
          return { ...tile, isFlipped: true, flipTimeout: null };
        }

        if (!shouldFlip && tile.isFlipped && !tile.flipTimeout) {
          const timeout = setTimeout(() => {
            setTiles(prev =>
              prev.map(t =>
                t.id === tile.id ? { ...t, isFlipped: false, flipTimeout: null } : t
              )
            );
          }, CONFIG.flipBackDelay);
          return { ...tile, flipTimeout: timeout };
        }

        if (shouldFlip && tile.flipTimeout) {
          clearTimeout(tile.flipTimeout);
          return { ...tile, flipTimeout: null };
        }

        return tile;
      })
    );
  }, [mousePos]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 overflow-hidden cursor-crosshair"
      style={{ backgroundColor: CONFIG.colors.background }}
    >
      <div className="absolute inset-0">
        {tiles.map(tile => (
          <DiamondTile key={tile.id} tile={tile} tileSize={CONFIG.tileSize} />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            color: CONFIG.colors.accent,
            textShadow: `0 0 40px ${CONFIG.colors.accent}40`,
          }}
        >
          FullCircle
        </h1>

        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: CONFIG.colors.accent }}
          />
          <span style={{ color: CONFIG.colors.textSecondary }}>
            {loadingText}...
          </span>
        </div>

        <div
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: CONFIG.colors.textSecondary }}
        >
          <span>Powered by</span>
          <svg viewBox="0 0 24 24" fill="#1DB954" className="w-5 h-5">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Spotify</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
        <a
          href="https://github.com/lnsomniak"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors duration-200 hover:opacity-100 opacity-60"
          style={{ color: CONFIG.colors.textSecondary }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className="text-sm hidden sm:inline">github</span>
        </a>
        <a
          href="https://www.linkedin.com/in/sergiohernandez18/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors duration-200 hover:opacity-100 opacity-60"
          style={{ color: CONFIG.colors.textSecondary }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span className="text-sm hidden sm:inline">linkedin</span>
        </a>
        <a
          href="https://www.instagram.com/abril_201719/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors duration-200 hover:opacity-100 opacity-60"
          style={{ color: CONFIG.colors.textSecondary }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          <span className="text-sm hidden sm:inline">instagram</span>
        </a>
        <a
          href="https://open.spotify.com/user/j3m1smyeqkefspox8v0ks80kg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors duration-200 hover:opacity-100 opacity-60"
          style={{ color: CONFIG.colors.textSecondary }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className="text-sm hidden sm:inline">spotify</span>
        </a>
      </div>
    </div>
  );
}






































