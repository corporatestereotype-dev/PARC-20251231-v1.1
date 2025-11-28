
import React, { useState } from 'react';

interface AutonomousModeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (durationMs: number | null) => void;
}

const AutonomousModeSetupModal: React.FC<AutonomousModeSetupModalProps> = ({ isOpen, onClose, onAuthorize }) => {
  const [duration, setDuration] = useState(60);
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');

  if (!isOpen) return null;

  const handleAuthorizeTimed = () => {
    let multiplier = 1;
    if (unit === 'minutes') multiplier = 60 * 1000;
    if (unit === 'hours') multiplier = 60 * 60 * 1000;
    if (unit === 'days') multiplier = 24 * 60 * 60 * 1000;
    onAuthorize(duration * multiplier);
  };

  const handleAuthorizeSupervised = () => {
    onAuthorize(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="autonomy-modal-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-3xl m-4 relative border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close configuration"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="autonomy-modal-title" className="text-3xl font-bold text-white text-center mb-2">Configure AI Autonomy</h2>
        <p className="text-slate-400 text-center mb-8">Choose how you want the AI to conduct its autonomous research workflow.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supervised Autonomy */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-bold text-slate-100">Supervised Autonomy</h3>
            </div>
            <p className="text-sm text-slate-400 flex-grow mb-6">
              Engage the autonomous workflow indefinitely. You can observe, interact, and manually stop the simulation at any time from the Autonomous Mode interface.
            </p>
            <button
              onClick={handleAuthorizeSupervised}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Engage
            </button>
          </div>

          {/* Timed Autonomy */}
          <div className="bg-slate-900/50 p-6 rounded-lg border border-blue-500/50 flex flex-col ring-1 ring-blue-500/30">
             <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold text-slate-100">Full Autonomy (Timed)</h3>
            </div>
            <p className="text-sm text-slate-400 flex-grow mb-6">
              Authorize the AI to operate without interruption for a set duration. The system will return to manual control once the time expires.
            </p>
            <div className="flex gap-3 mb-4">
                <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Duration value"
                />
                <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as typeof unit)}
                    className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Duration unit"
                >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                </select>
            </div>
             <button
              onClick={handleAuthorizeTimed}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Authorize Timed Autonomy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutonomousModeSetupModal;
