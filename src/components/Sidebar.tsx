import { FileCode, Upload, Loader2, X, Code2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';
import { FileData } from '../types';

interface SidebarProps {
  files: FileData[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onFileUpload: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
}

export function Sidebar({ files, activeFileId, onFileSelect, onFileUpload, onRemoveFile }: SidebarProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onFileUpload, noClick: true });

  return (
    <div className="w-64 glass-panel border-r flex flex-col h-full select-none">
      <div className="p-6 border-b border-border-subtle flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Code2 size={20} className="text-white" /></div><span className="font-bold text-slate-100 tracking-tight text-lg">Debugr</span></div></div>
      <div className="flex-1 overflow-y-auto py-4" {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Workspace</div>
        {files.length === 0 ? <div className={cn('mx-4 my-2 p-6 border border-dashed rounded-xl text-center transition-all duration-300', isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/20')}><Upload className="mx-auto mb-3 text-slate-600" size={24} /><p className="text-xs text-slate-500 font-medium leading-relaxed">Drop code files here to analyze</p></div> : <div className="space-y-0.5 px-2">{files.map(file => <div key={file.id} onClick={() => onFileSelect(file.id)} className={cn('group flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-all duration-200', activeFileId === file.id ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200')}><FileCode size={16} className={cn(activeFileId === file.id ? 'text-blue-400' : 'text-slate-500')} /><span className="text-sm font-medium truncate flex-1">{file.name}</span>{file.isAnalyzing || file.isDebugging ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <button onClick={event => { event.stopPropagation(); onRemoveFile(file.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 rounded-md transition-all"><X size={14} /></button>}</div>)}</div>}
      </div>
      <div className="p-4 border-t border-border-subtle bg-slate-900/20"><button onClick={() => document.getElementById('file-input')?.click()} className="w-full py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-border-subtle active:scale-[0.98]"><Upload size={16} />Import Files</button><input id="file-input" type="file" multiple className="hidden" onChange={event => event.target.files && onFileUpload(Array.from(event.target.files))} /></div>
    </div>
  );
}
