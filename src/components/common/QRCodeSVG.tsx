import React from 'react';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

// Generates a deterministic grid based on hash of input string
// with authentic QR finder patterns at top-left, top-right, and bottom-left
export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 180,
  className = '',
  bgColor = '#ffffff',
  fgColor = '#111827',
}) => {
  const gridSize = 25; // 25x25 grid
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  // Helper to draw standard 7x7 finder pattern
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[startY + r][startX + c] = isBorder || isCenter;
      }
    }
    // white separator around finder
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const y = startY + r;
        const x = startX + c;
        if (
          y >= 0 &&
          y < gridSize &&
          x >= 0 &&
          x < gridSize &&
          (r === -1 || r === 7 || c === -1 || c === 7)
        ) {
          cells[y][x] = false;
        }
      }
    }
  };

  // Top-left
  drawFinder(0, 0);
  // Top-right
  drawFinder(gridSize - 7, 0);
  // Bottom-left
  drawFinder(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Pseudo-random deterministic filling based on value hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  let pseudoRand = Math.abs(hash);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders and their separators
      const inTopLeft = r <= 7 && c <= 7;
      const inTopRight = r <= 7 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c <= 7;
      const inTiming = (r === 6 && c >= 8 && c < gridSize - 8) || (c === 6 && r >= 8 && r < gridSize - 8);

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        pseudoRand = (pseudoRand * 1664525 + 1013904223) % 4294967296;
        // 45% black density
        cells[r][c] = pseudoRand % 100 < 46;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div
      className={`inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill={bgColor} />
        {cells.map((row, r) =>
          row.map((filled, c) => {
            if (!filled) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill={fgColor}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
