import { motion, AnimatePresence } from 'motion/react';
import { Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface AppSettings {
  autoFix: boolean;
  deepDebug: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (key: keyof AppSettings, value: boolean) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdate }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/10">
            <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-border-subtle"><Settings size={20} className="text-blue-400" /></div>
                <div><h2 className="text-xl font-bold text-slate-100 tracking-tight">Settings</h2><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</p></div>
              </div>
              <button onClick={onClose} className="btn-ghost"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8">
              {(['autoFix', 'deepDebug'] as const).map(key => (
                <div key={key} className="flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">{key === 'autoFix' ? 'Auto-Fix Suggestions' : 'Deep Debug Mode'}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{key === 'autoFix' ? 'Automatically apply non-breaking fixes and style improvements' : 'Perform exhaustive analysis of logic errors and complex edge cases'}</p>
                  </div>
                  <button onClick={() => onUpdate(key, !settings[key])} className={cn('w-12 h-6 rounded-full transition-all duration-300 relative shrink-0 ml-4', settings[key] ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800')}>
                    <motion.div animate={{ x: settings[key] ? 26 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-900/40 border-t border-border-subtle flex justify-end gap-3"><button onClick={onClose} className="btn-primary px-8">Save Preferences</button></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
