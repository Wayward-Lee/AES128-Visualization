import React, { useEffect, useState } from 'react';
import { StateMatrix } from '../types';

// The fixed AES MixColumns Matrix (MDS)
const MDS_MATRIX = [
  [0x02, 0x03, 0x01, 0x01],
  [0x01, 0x02, 0x03, 0x01],
  [0x01, 0x01, 0x02, 0x03],
  [0x03, 0x01, 0x01, 0x01]
];

interface MixColumnsPanelProps {
  inputState?: StateMatrix;  // Before MixColumns
  outputState?: StateMatrix; // After MixColumns
}

const MixColumnsPanel: React.FC<MixColumnsPanelProps> = ({ inputState, outputState }) => {
  const [activeRow, setActiveRow] = useState(0);

  // Cycle through rows 0-3 to visualize the multiplication process
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRow((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Use the first column as an example
  const colIndex = 0;
  const inputCol = inputState ? inputState.map(r => r[colIndex]) : [0,0,0,0];
  const outputCol = outputState ? outputState.map(r => r[colIndex]) : [0,0,0,0];

  return (
    <div className="flex flex-col items-center animate-in slide-in-from-right duration-700 w-full max-w-lg">
      <h3 className="text-sm font-semibold text-purple-400 mb-6 uppercase tracking-wider">
        MixColumns Visualizer (Column 0)
      </h3>
      
      <div className="relative bg-slate-900/90 p-6 rounded-xl border border-slate-700 shadow-2xl flex items-center justify-center gap-4 sm:gap-8">
        
        {/* 1. Input Column Vector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-slate-500 text-center font-mono mb-1">Input</span>
          {inputCol.map((val, idx) => (
            <div 
              key={`in-${idx}`}
              className={`
                w-10 h-10 flex items-center justify-center text-sm font-mono font-bold rounded border transition-all duration-300
                ${true /* Always involved in dot product */ 
                  ? 'border-purple-500 bg-purple-900/20 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                  : 'border-slate-700 bg-slate-800 text-slate-500'}
              `}
            >
              {val.toString(16).padStart(2,'0').toUpperCase()}
            </div>
          ))}
        </div>

        {/* Multiplication Sign */}
        <div className="text-slate-500 text-xl font-bold">×</div>

        {/* 2. MDS Matrix */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 text-center font-mono mb-2">MDS Matrix</span>
          {MDS_MATRIX.map((row, rIdx) => (
            <div key={`mds-row-${rIdx}`} className="flex gap-1">
              {row.map((val, cIdx) => {
                const isActive = rIdx === activeRow;
                return (
                  <div 
                    key={`mds-${rIdx}-${cIdx}`}
                    className={`
                      w-8 h-8 flex items-center justify-center text-xs font-mono font-bold rounded border transition-all duration-300
                      ${isActive 
                        ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg z-10' 
                        : 'bg-slate-800 border-slate-700 text-slate-500'}
                    `}
                  >
                    {val.toString(16).padStart(2,'0').toUpperCase()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Equals Sign */}
        <div className="text-slate-500 text-xl font-bold">=</div>

        {/* 3. Output Column Vector */}
        <div className="flex flex-col gap-2 relative">
          <span className="text-[10px] text-slate-500 text-center font-mono mb-1">Output</span>
          {outputCol.map((val, idx) => {
             const isActive = idx === activeRow;
             return (
              <div 
                key={`out-${idx}`}
                className={`
                  w-10 h-10 flex items-center justify-center text-sm font-mono font-bold rounded border transition-all duration-500
                  ${isActive 
                    ? 'border-emerald-400 bg-emerald-900/40 text-emerald-300 scale-110 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                    : 'border-slate-700 bg-slate-800 text-slate-600'}
                `}
              >
                {isActive ? val.toString(16).padStart(2,'0').toUpperCase() : '?'}
              </div>
             );
          })}
          
          {/* Connecting Lines / Visual Hints (Abstracted) */}
          {/* Showing the calculation logic for the active row */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 text-center">
             <div className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 whitespace-nowrap">
                {`Calculating Row ${activeRow}...`}
                <div className="text-emerald-400 font-bold mt-1">
                  Dot Product over GF(2⁸)
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MixColumnsPanel;