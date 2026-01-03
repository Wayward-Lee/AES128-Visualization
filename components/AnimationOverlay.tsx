import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StateMatrix } from '../types';
import { SBOX } from '../services/aes';

interface AnimationOverlayProps {
  active: boolean;
  previousMatrix: StateMatrix; // The values BEFORE substitution
}

interface Particle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  val: number; // Original Value
  newVal: number; // Substituted Value
  sboxRow: number;
  sboxCol: number;
}

const AnimationOverlay: React.FC<AnimationOverlayProps> = ({ active, previousMatrix }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<'idle' | 'blink' | 'out' | 'hit' | 'back'>('idle');

  useLayoutEffect(() => {
    if (active && previousMatrix) {
      const newParticles: Particle[] = [];
      
      // 1. Calculate Positions
      previousMatrix.forEach((row, r) => {
        row.forEach((val, c) => {
          const startElem = document.getElementById(`state-cell-${r}-${c}`);
          const sboxRow = Math.floor(val / 16);
          const sboxCol = val % 16;
          const targetElem = document.getElementById(`sbox-cell-${sboxRow}-${sboxCol}`);

          if (startElem && targetElem) {
            const startRect = startElem.getBoundingClientRect();
            const targetRect = targetElem.getBoundingClientRect();

            newParticles.push({
              id: `${r}-${c}`,
              startX: startRect.left,
              startY: startRect.top,
              targetX: targetRect.left,
              targetY: targetRect.top,
              val: val,
              newVal: SBOX[val],
              sboxRow,
              sboxCol
            });
          }
        });
      });

      setParticles(newParticles);
      
      // 2. Start Animation Sequence
      // Total Duration: ~3500ms (matching App.tsx interval)
      setPhase('blink'); // Start blinking at source

      const t0 = setTimeout(() => setPhase('out'), 800);   // Fly to S-Box
      const t1 = setTimeout(() => setPhase('hit'), 1600);  // Hit & Transform
      const t2 = setTimeout(() => setPhase('back'), 2400); // Fly back
      const t3 = setTimeout(() => {
         setPhase('idle');
         setParticles([]); 
      }, 3400);

      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        // Cleanup SBox highlights if unmounted mid-animation
        cleanupSBoxHighlights();
      };
    } else {
      setParticles([]);
      setPhase('idle');
      cleanupSBoxHighlights();
    }
  }, [active, previousMatrix]);

  // Helper to directly manipulate DOM for SBox highlights (more performant for multiple elements than React state)
  const highlightSBoxCells = (particles: Particle[], active: boolean) => {
    particles.forEach(p => {
      const el = document.getElementById(`sbox-cell-${p.sboxRow}-${p.sboxCol}`);
      if (el) {
        if (active) {
          el.classList.add('bg-pink-500', 'text-white', 'scale-110', 'z-10', 'shadow-lg', 'border-pink-300');
          el.classList.remove('text-slate-600', 'bg-slate-900', 'border-slate-800/50');
        } else {
          el.classList.remove('bg-pink-500', 'text-white', 'scale-110', 'z-10', 'shadow-lg', 'border-pink-300');
          el.classList.add('text-slate-600', 'bg-slate-900', 'border-slate-800/50');
        }
      }
    });
  };

  const cleanupSBoxHighlights = () => {
    // Naive cleanup: remove classes from all sbox cells if needed, or just rely on the loop above
    // Since we don't have the list easily here, we rely on the effect return cleanup or the specific phase logic
    const allCells = document.querySelectorAll('[id^="sbox-cell-"]');
    allCells.forEach(el => {
        el.classList.remove('bg-pink-500', 'text-white', 'scale-110', 'z-10', 'shadow-lg', 'border-pink-300');
        el.classList.add('text-slate-600', 'bg-slate-900', 'border-slate-800/50');
    });
  };

  // Trigger side-effect for S-Box highlighting
  useEffect(() => {
    if (phase === 'hit') {
      highlightSBoxCells(particles, true);
    } else {
      cleanupSBoxHighlights();
    }
  }, [phase, particles]);


  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => {
        let style: React.CSSProperties = {
          left: p.startX,
          top: p.startY,
          position: 'absolute',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Default move speed
        };

        let content = p.val.toString(16).padStart(2, '0').toUpperCase();
        let colorClass = "bg-slate-700 text-slate-300 border-slate-500"; 

        if (phase === 'blink') {
           // Blinking at source
           style.transform = `scale(1)`;
           style.transition = 'none'; // Instant updates for blink effect
           colorClass = "bg-yellow-900/50 text-yellow-200 border-yellow-500 animate-pulse";
        }
        else if (phase === 'out') {
           // Moving to S-Box
           style.transform = `translate(${p.targetX - p.startX}px, ${p.targetY - p.startY}px) scale(0.6)`;
           colorClass = "bg-yellow-500 text-black border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)] z-30"; 
        } 
        else if (phase === 'hit') {
           // At S-Box (Impact)
           style.transform = `translate(${p.targetX - p.startX}px, ${p.targetY - p.startY}px) scale(0)`; // Hide particle, let SBox cell glow
           style.transition = 'none';
           style.opacity = 0; 
        } 
        else if (phase === 'back') {
           // Return
           style.transform = `translate(0px, 0px) scale(1)`;
           style.opacity = 1;
           content = p.newVal.toString(16).padStart(2, '0').toUpperCase();
           colorClass = "bg-pink-600 text-white border-pink-400 shadow-lg z-30"; 
        }

        return (
          <div
            key={p.id}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded border font-mono font-bold text-sm sm:text-base ${colorClass}`}
            style={style}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default AnimationOverlay;