import React from 'react';
import { SBOX } from '../services/aes';

interface SBoxTableProps {
  visible: boolean;
}

const SBoxTable: React.FC<SBoxTableProps> = ({ visible }) => {
  if (!visible) return null;

  // Row/Col labels (0-F)
  const hexLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="flex flex-col items-center animate-in slide-in-from-right duration-700">
      <h3 className="text-sm font-semibold text-pink-400 mb-2 uppercase tracking-wider">S-Box Substitution Table</h3>
      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700 shadow-2xl overflow-hidden relative">
        
        {/* Header Row */}
        <div className="flex">
          <div className="w-6 h-6"></div> {/* Corner spacer */}
          {hexLabels.map(h => (
            <div key={`head-${h}`} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] text-slate-500 font-mono">
              {h}
            </div>
          ))}
        </div>

        {/* Grid */}
        {hexLabels.map((rowLabel, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex">
             {/* Row Label */}
             <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] text-slate-500 font-mono">
               {rowLabel}
             </div>
             
             {/* Cells */}
             {hexLabels.map((colLabel, colIndex) => {
               const index = rowIndex * 16 + colIndex;
               const val = SBOX[index];

               return (
                 <div 
                   key={`cell-${rowIndex}-${colIndex}`}
                   id={`sbox-cell-${rowIndex}-${colIndex}`} // ID for AnimationOverlay targeting
                   className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[9px] sm:text-[10px] font-mono border border-slate-800/50 text-slate-600 bg-slate-900 transition-colors duration-300"
                 >
                   {val.toString(16).padStart(2, '0').toUpperCase()}
                 </div>
               );
             })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SBoxTable;