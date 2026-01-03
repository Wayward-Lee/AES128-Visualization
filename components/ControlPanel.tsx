import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  onSeek
}) => {
  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4 sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* Progress Bar */}
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
             <span>STEP {currentStep}</span>
             <span>TOTAL {totalSteps - 1}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={totalSteps - 1} 
            value={currentStep} 
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            onClick={onPrev}
            disabled={currentStep === 0}
            className="p-3 bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={onPlayPause}
            className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>

          <button 
            onClick={onNext}
            disabled={currentStep >= totalSteps - 1}
            className="p-3 bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={24} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ControlPanel;