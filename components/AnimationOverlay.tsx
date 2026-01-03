import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StateMatrix } from '../types';
import { SBOX } from '../services/aes';

interface AnimationOverlayProps {
  active: boolean;
  previousMatrix: StateMatrix; // The values BEFORE substitution
}

interface Particle {
  id: string;
  index: number; // Linear index 0-15
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  val: number; // Original Value
  newVal: number; // Substituted Value
  sboxRow: number;
  sboxCol: number;
  rowHex: string; // 'A'
  colHex: string; // 'F'
}

const AnimationOverlay: React.FC<AnimationOverlayProps> = ({ active, previousMatrix }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<'idle' | 'running'>('idle');

  // Hex helper
  const toHex = (n: number) => n.toString(16).toUpperCase();

  useLayoutEffect(() => {
    if (active && previousMatrix) {
      const newParticles: Particle[] = [];
      
      // 1. Calculate Positions & Create Particles
      previousMatrix.forEach((row, r) => {
        row.forEach((val, c) => {
          const startElem = document.getElementById(`state-cell-${r}-${c}`);
          const sboxRow = Math.floor(val / 16);
          const sboxCol = val % 16;
          const targetElem = document.getElementById(`sbox-cell-${sboxRow}-${sboxCol}`);

          if (startElem && targetElem) {
            const startRect = startElem.getBoundingClientRect();
            const targetRect = targetElem.getBoundingClientRect();

            // Centers
            const startCenterX = startRect.left + startRect.width / 2;
            const startCenterY = startRect.top + startRect.height / 2;
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;

            newParticles.push({
              id: `${r}-${c}`,
              index: r * 4 + c, // 0 to 15
              startX: startRect.left,
              startY: startRect.top,
              deltaX: targetCenterX - startCenterX,
              deltaY: targetCenterY - startCenterY,
              val: val,
              newVal: SBOX[val],
              sboxRow,
              sboxCol,
              rowHex: toHex(sboxRow),
              colHex: toHex(sboxCol)
            });
          }
        });
      });

      setParticles(newParticles);
      setPhase('running');

      // 2. Schedule specific DOM manipulations for each particle
      // We use setTimeout instead of React state for performance/precision on 16 items x 4 phases
      const cleanupFns: Function[] = [];
      const STAGGER_MS = 100; // Delay between each particle starting
      const TRAVEL_MS = 600;  // Time to fly to SBox
      const PAUSE_MS = 600;   // Time to stay at SBox (to show Row/Col)
      
      newParticles.forEach((p, i) => {
        const startDelay = i * STAGGER_MS;
        const arriveTime = startDelay + TRAVEL_MS;
        const returnTime = arriveTime + PAUSE_MS;

        // A. Highlight Row/Col Headers + Target Cell on Arrival
        const t1 = setTimeout(() => {
           highlightSBox(p.rowHex, p.colHex, p.sboxRow, p.sboxCol, true);
        }, arriveTime);

        // B. Un-Highlight and Return
        const t2 = setTimeout(() => {
           highlightSBox(p.rowHex, p.colHex, p.sboxRow, p.sboxCol, false);
        }, returnTime);

        cleanupFns.push(() => clearTimeout(t1));
        cleanupFns.push(() => clearTimeout(t2));
      });

      // Cleanup function when effect unmounts or restarts
      return () => {
        cleanupFns.forEach(fn => fn());
        cleanupSBoxVisuals();
      };

    } else {
      setParticles([]);
      setPhase('idle');
      cleanupSBoxVisuals();
    }
  }, [active, previousMatrix]);

  // Direct DOM manipulation for S-Box Headers and Cells
  const highlightSBox = (rHex: string, cHex: string, rIdx: number, cIdx: number, on: boolean) => {
    const rowHeader = document.getElementById(`sbox-row-header-${rHex}`);
    const colHeader = document.getElementById(`sbox-col-header-${cHex}`);
    const cell = document.getElementById(`sbox-cell-${rIdx}-${cIdx}`);

    const headerClasses = ['text-pink-400', 'font-bold', 'scale-125', 'bg-slate-800', 'shadow-[0_0_10px_rgba(244,114,182,0.5)]', 'rounded'];
    const cellClasses = ['bg-pink-500', 'text-white', 'scale-110', 'z-20', 'shadow-[0_0_15px_rgba(236,72,153,1)]', 'border-pink-300'];
    const cellReset = ['text-slate-600', 'bg-slate-900', 'border-slate-800/50'];

    if (on) {
      if (rowHeader) rowHeader.classList.add(...headerClasses);
      if (colHeader) colHeader.classList.add(...headerClasses);
      if (cell) {
        cell.classList.remove(...cellReset);
        cell.classList.add(...cellClasses);
      }
    } else {
      if (rowHeader) rowHeader.classList.remove(...headerClasses);
      if (colHeader) colHeader.classList.remove(...headerClasses);
      if (cell) {
        cell.classList.remove(...cellClasses);
        cell.classList.add(...cellReset);
      }
    }
  };

  const cleanupSBoxVisuals = () => {
    // Brute force clean all likely elements
    const headers = document.querySelectorAll('[id^="sbox-row-header-"], [id^="sbox-col-header-"]');
    headers.forEach(el => el.classList.remove('text-pink-400', 'font-bold', 'scale-125', 'bg-slate-800', 'shadow-[0_0_10px_rgba(244,114,182,0.5)]', 'rounded'));
    
    const cells = document.querySelectorAll('[id^="sbox-cell-"]');
    cells.forEach(el => {
       el.classList.remove('bg-pink-500', 'text-white', 'scale-110', 'z-20', 'shadow-[0_0_15px_rgba(236,72,153,1)]', 'border-pink-300');
       el.classList.add('text-slate-600', 'bg-slate-900', 'border-slate-800/50');
    });
  };

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => {
        // We use CSS Keyframes logic via style props for the sequence
        // Timeline:
        // 0 to delay: Idle at source
        // delay to delay+0.6s: Move to SBox
        // delay+0.6s to delay+1.2s: Stay (Wait for lookup)
        // delay+1.2s to delay+1.8s: Return
        
        const STAGGER = 100; // ms
        const MOVE_DUR = 600; // ms
        const STAY_DUR = 600; // ms
        const delayMs = p.index * STAGGER;
        
        return (
          <ParticleItem 
            key={p.id} 
            p={p} 
            delay={delayMs} 
            moveDur={MOVE_DUR} 
            stayDur={STAY_DUR} 
          />
        );
      })}
    </div>
  );
};

// Sub-component to handle complex keyframe logic per particle
const ParticleItem: React.FC<{p: Particle, delay: number, moveDur: number, stayDur: number}> = ({p, delay, moveDur, stayDur}) => {
    const [state, setState] = useState<'start' | 'out' | 'hit' | 'back'>('start');

    useEffect(() => {
        // Sequence Controller
        const t1 = setTimeout(() => setState('out'), delay);
        const t2 = setTimeout(() => setState('hit'), delay + moveDur); // Arrived
        const t3 = setTimeout(() => setState('back'), delay + moveDur + stayDur); // Return
        
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [delay, moveDur, stayDur]);

    let style: React.CSSProperties = {
        left: p.startX,
        top: p.startY,
        position: 'absolute',
        transition: `transform ${moveDur}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s`,
    };

    let content = p.val.toString(16).padStart(2, '0').toUpperCase();
    let className = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded border font-mono font-bold text-sm sm:text-base ";

    if (state === 'start') {
        // Waiting to launch
        className += "bg-slate-700 text-slate-300 border-slate-500 opacity-0"; 
        style.transform = `scale(1)`;
    } else if (state === 'out') {
        // Flying to SBox
        className += "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)] z-30 opacity-100";
        style.transform = `translate(${p.deltaX}px, ${p.deltaY}px) scale(0.5)`;
    } else if (state === 'hit') {
        // At SBox (Hidden, let the table highlight take over)
        className += "opacity-0";
        style.transform = `translate(${p.deltaX}px, ${p.deltaY}px) scale(0.5)`;
        style.transition = 'none'; // Lock position
    } else if (state === 'back') {
        // Returning
        content = p.newVal.toString(16).padStart(2, '0').toUpperCase();
        className += "bg-pink-600 text-white border-pink-400 shadow-lg z-30 opacity-100";
        style.transform = `translate(0px, 0px) scale(1)`;
    }

    return (
        <div style={style} className={className}>
            {content}
        </div>
    );
};

export default AnimationOverlay;