import React, { useState, useEffect, useRef } from 'react';
import { generateAESSimulation } from './services/aes';
import { AESSimulation, StepType } from './types';
import StateMatrixGrid from './components/StateMatrixGrid';
import SBoxTable from './components/SBoxTable';
import MixColumnsPanel from './components/MixColumnsPanel';
import AnimationOverlay from './components/AnimationOverlay';
import ControlPanel from './components/ControlPanel';
import { Lock, Unlock, ShieldCheck, Play } from 'lucide-react';

function App() {
  const [inputText, setInputText] = useState('Hello AES World!');
  const [inputKey, setInputKey] = useState('SecretKey123456');
  
  const [simulation, setSimulation] = useState<AESSimulation | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const validKey = inputKey.padEnd(16, ' ').slice(0, 16);
    const validText = inputText.padEnd(16, ' ').slice(0, 16);
    
    const sim = generateAESSimulation(validText, validKey);
    setSimulation(sim);
    setStepIndex(0);
    setIsPlaying(false);
  }, [inputText, inputKey]);

  useEffect(() => {
    if (isPlaying && simulation) {
      // 3.5 seconds per step to allow full animation cycle
      playIntervalRef.current = window.setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= simulation.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3500); 
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, simulation]);

  const handleNext = () => {
    if (!simulation) return;
    if (stepIndex < simulation.steps.length - 1) {
      setStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const currentStep = simulation?.steps[stepIndex];
  const previousStep = stepIndex > 0 ? simulation?.steps[stepIndex - 1] : undefined;

  const getAnimationType = (type: StepType) => {
    switch (type) {
      case StepType.SUB_BYTES: return 'sub-bytes';
      case StepType.SHIFT_ROWS: return 'shift-rows';
      case StepType.MIX_COLUMNS: return 'mix-columns';
      case StepType.ADD_ROUND_KEY: return 'add-round-key';
      default: return 'none';
    }
  };

  const getStepColor = (type: StepType) => {
    switch (type) {
      case StepType.INITIAL: return 'text-slate-400';
      case StepType.SUB_BYTES: return 'text-pink-400';
      case StepType.SHIFT_ROWS: return 'text-yellow-400';
      case StepType.MIX_COLUMNS: return 'text-purple-400';
      case StepType.ADD_ROUND_KEY: return 'text-blue-400';
      case StepType.FINAL: return 'text-emerald-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Animation Layer on top */}
      <AnimationOverlay 
        active={currentStep?.type === StepType.SUB_BYTES}
        previousMatrix={previousStep?.state}
      />

      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Lock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AES-128 Visualizer</h1>
            <p className="text-xs text-slate-400">Interactive Encryption Process</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-40">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                Input Plaintext (16 chars)
              </label>
              <input 
                type="text" 
                value={inputText}
                maxLength={16}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                Secret Key (16 chars)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={inputKey}
                  maxLength={16}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
                <Unlock className="absolute left-3 top-3.5 text-slate-500" size={18} />
              </div>
            </div>
          </section>

          {simulation && currentStep && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sm font-mono">
                  <span className="text-slate-500">Round {currentStep.round}</span>
                  <span className="text-slate-700">|</span>
                  <span className={`font-bold ${getStepColor(currentStep.type)}`}>
                    {currentStep.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight px-4">
                  {currentStep.description.split('.')[0]}
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed h-10">
                   {currentStep.description.split('.').slice(1).join('.')}
                </p>
              </div>

              {/* MAIN VISUALIZATION AREA */}
              <div className="flex flex-col xl:flex-row items-center justify-center gap-12 py-4 min-h-[400px]">
                
                {/* State Matrix (Left/Center) */}
                <div className="relative group perspective-1000 order-2 xl:order-1">
                   <div className={`absolute -inset-4 bg-gradient-to-r rounded-xl blur-xl opacity-20 transition duration-1000
                      ${currentStep.type === StepType.ADD_ROUND_KEY ? 'from-blue-600 to-emerald-600' : 'from-blue-600 to-purple-600'}
                   `}></div>

                   <StateMatrixGrid 
                      key={stepIndex} 
                      matrix={currentStep.state} 
                      title="State Matrix" 
                      className="relative z-10"
                      previousMatrix={previousStep?.state} 
                      overlayMatrix={currentStep.roundKey} 
                      animationType={getAnimationType(currentStep.type)}
                   />
                </div>

                {/* Right Panel: Dynamic Content based on Step */}
                <div className="order-1 xl:order-2 xl:min-w-[400px] flex justify-center">
                   {currentStep.type === StepType.SUB_BYTES && (
                      <SBoxTable 
                        visible={true} 
                      />
                   )}
                   {currentStep.type === StepType.MIX_COLUMNS && (
                      <MixColumnsPanel 
                        inputState={previousStep?.state}
                        outputState={currentStep.state}
                      />
                   )}
                   {/* Empty state for other steps to maintain layout, or nothing */}
                </div>

              </div>

              {/* Final Result */}
              {stepIndex === simulation.steps.length - 1 && (
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col items-center gap-4 text-center animate-in zoom-in duration-700">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <ShieldCheck className="text-emerald-400" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-300">Encryption Complete</h3>
                    <div className="font-mono bg-slate-950 p-4 mt-3 rounded border border-emerald-500/20 text-emerald-400 break-all shadow-inner tracking-widest">
                       {currentStep.state.flat().map(b => b.toString(16).padStart(2,'0').toUpperCase()).join('')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {simulation && (
        <ControlPanel 
          currentStep={stepIndex}
          totalSteps={simulation.steps.length}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrev={handlePrev}
          onReset={() => { setStepIndex(0); setIsPlaying(false); }}
          onSeek={(val) => { setStepIndex(val); setIsPlaying(false); }}
        />
      )}
    </div>
  );
}

export default App;