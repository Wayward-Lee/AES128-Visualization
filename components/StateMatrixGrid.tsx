import React, { useEffect, useState } from 'react';
import { StateMatrix } from '../types';

interface StateMatrixGridProps {
  matrix: StateMatrix; // The TARGET state (after operation)
  title: string;
  className?: string;
  previousMatrix?: StateMatrix; // The START state (before operation)
  overlayMatrix?: StateMatrix; // For AddRoundKey
  animationType?: 'none' | 'sub-bytes' | 'shift-rows' | 'mix-columns' | 'add-round-key';
}

const StateMatrixGrid: React.FC<StateMatrixGridProps> = ({ 
  matrix, 
  title, 
  className = "", 
  previousMatrix,
  overlayMatrix,
  animationType = 'none' 
}) => {
  const [displayMatrix, setDisplayMatrix] = useState<StateMatrix>(previousMatrix || matrix);
  const [animating, setAnimating] = useState(false);
  const [shiftedStyles, setShiftedStyles] = useState<React.CSSProperties[][]>([]);
  const [hideCells, setHideCells] = useState(false); // Hide original cells during particle flight

  useEffect(() => {
    if (previousMatrix) {
      setDisplayMatrix(previousMatrix);
    } else {
      setDisplayMatrix(matrix);
    }
    setShiftedStyles([]); 
    setAnimating(true);
    setHideCells(false);

    if (animationType === 'sub-bytes') {
      // Hide static cells while particles are flying
      setHideCells(true);
      // Show new values after flight returns
      setTimeout(() => {
        setDisplayMatrix(matrix);
        setHideCells(false);
      }, 2500); // Sync with AnimationOverlay timing
    } 
    else if (animationType === 'shift-rows' && previousMatrix) {
      const initialStyles = Array(4).fill(0).map(() => Array(4).fill({ transform: 'translate(0,0)' }));
      setShiftedStyles(initialStyles);

      setTimeout(() => {
        const newStyles = previousMatrix.map((row, r) => {
          return row.map((_, c) => {
             let destCol = (c - r) % 4;
             if (destCol < 0) destCol += 4;
             const diff = destCol - c;
             return {
               transform: `translateX(calc(${diff} * (100% + 0.5rem)))`, 
               transition: 'transform 1.5s ease-in-out',
               zIndex: 10 
             };
          });
        });
        setShiftedStyles(newStyles);
      }, 50);

      setTimeout(() => {
        setDisplayMatrix(matrix);
        setShiftedStyles([]);
      }, 1600);
    } else {
      // Standard delayed update for others
      let swapDelay = 0;
      if (animationType === 'add-round-key') swapDelay = 1200;
      if (animationType === 'mix-columns') swapDelay = 600;

      const timer = setTimeout(() => {
        setDisplayMatrix(matrix);
      }, swapDelay);
      return () => clearTimeout(timer);
    }
  }, [matrix, previousMatrix, animationType]);

  useEffect(() => {
    const t = setTimeout(() => setAnimating(false), 2600);
    return () => clearTimeout(t);
  }, [matrix]);

  const getMixClass = (colIdx: number) => {
    if (!animating || animationType !== 'mix-columns') return '';
    return 'animate-mix'; 
  };

  const getImpactClass = () => {
    if (!animating || animationType !== 'add-round-key') return '';
    return 'animate-impact';
  };

  return (
    <div className={`flex flex-col items-center relative ${className}`}>
      <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">{title}</h3>
      
      <div className="relative">
        <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-xl relative z-10">
          {displayMatrix.map((row, rIndex) => (
            <React.Fragment key={rIndex}>
              {row.map((val, cIndex) => {
                const style = shiftedStyles[rIndex]?.[cIndex] || {};
                
                return (
                  <div
                    key={`${rIndex}-${cIndex}`}
                    id={`state-cell-${rIndex}-${cIndex}`} // ID for AnimationOverlay
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded border
                      font-mono text-sm sm:text-base font-bold
                      bg-slate-800 text-slate-300 border-slate-700
                      ${getImpactClass()}
                      ${getMixClass(cIndex)}
                      ${hideCells ? 'opacity-0' : 'opacity-100'} 
                      transition-opacity duration-300
                    `}
                    style={{
                      ...style,
                      animationDelay: animationType === 'mix-columns' ? `${cIndex * 0.15}s` : '0s'
                    }}
                  >
                    {val.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* AddRoundKey Overlay */}
        {animationType === 'add-round-key' && overlayMatrix && (
          <div className="absolute top-0 left-0 w-full h-full p-3 pointer-events-none z-20">
             <div className="grid grid-cols-4 gap-2 w-full h-full animate-key-slide">
               {overlayMatrix.map((row, rIndex) => (
                  <React.Fragment key={`overlay-${rIndex}`}>
                    {row.map((val, cIndex) => (
                      <div
                        key={`overlay-${rIndex}-${cIndex}`}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded border
                                   font-mono text-sm sm:text-base font-bold
                                   bg-emerald-600 text-white border-emerald-400 shadow-lg"
                      >
                        {val.toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    ))}
                  </React.Fragment>
               ))}
             </div>
             <div className="absolute -right-32 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm whitespace-nowrap animate-key-slide opacity-0">
                Round Key
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateMatrixGrid;