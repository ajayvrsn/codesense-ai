import * as diff from 'diff';
import { cn } from '../lib/utils';

export function DiffViewer({ original, modified }: { original: string; modified: string }) {
  const diffs = diff.diffLines(original, modified);
  return <div className="h-full overflow-auto bg-[#020617] font-mono text-[13px] p-8 space-y-0.5">{diffs.map((part, index) => <div key={index} className={cn('whitespace-pre-wrap px-4 py-0.5 transition-colors', part.added ? 'bg-green-500/10 text-green-400 border-l-4 border-green-500/50' : part.removed ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500/50 line-through opacity-60' : 'text-slate-500 opacity-80')}>{part.value}</div>)}</div>;
}
