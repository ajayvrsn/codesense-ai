import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bug, CheckCircle2, Chrome, Code2, FileCode, Loader2, LogOut, Search, Settings, Upload } from 'lucide-react';
import { AuthForm } from './components/auth/AuthForm';
import { CodeEditor } from './components/CodeEditor';
import { DiffViewer } from './components/DiffViewer';
import { ReviewPanel } from './components/ReviewPanel';
import { SettingsModal, AppSettings } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { analyzeCode, debugCode } from './services/api';
import { CodeIssue, FileData, User } from './types';

const getLanguage = (fileName: string) => {
  const extension = fileName.split('.').pop() || 'txt';
  return extension === 'js' ? 'javascript' : extension === 'ts' || extension === 'tsx' ? 'typescript' : extension === 'py' ? 'python' : extension;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ autoFix: false, deepDebug: true });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async response => {
        const text = await response.text();
        try { return text ? JSON.parse(text) : {}; } catch { return {}; }
      })
      .then(data => { if (data.user) setUser(data.user); })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const activeFile = useMemo(() => files.find(file => file.id === activeFileId), [files, activeFileId]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setFiles([]);
      setActiveFileId(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleFileUpload = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: FileData = {
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          content: reader.result as string,
          language: getLanguage(file.name),
        };
        setFiles(previousFiles => [...previousFiles, newFile]);
        setActiveFileId(previousId => previousId || newFile.id);
      };
      reader.readAsText(file);
    });
  }, []);

  const removeFile = (id: string) => {
    setFiles(previousFiles => previousFiles.filter(file => file.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const runReview = async (mode: 'analyze' | 'debug') => {
    if (!activeFile || activeFile.isAnalyzing || activeFile.isDebugging) return;
    const loadingKey = mode === 'analyze' ? 'isAnalyzing' : 'isDebugging';
    setFiles(previousFiles => previousFiles.map(file => file.id === activeFileId ? { ...file, [loadingKey]: true } : file));
    try {
      const review = await (mode === 'analyze' ? analyzeCode : debugCode)(activeFile.content, activeFile.name);
      setFiles(previousFiles => previousFiles.map(file => file.id === activeFileId ? { ...file, review, [loadingKey]: false } : file));
    } catch (error) {
      setFiles(previousFiles => previousFiles.map(file => file.id === activeFileId ? { ...file, [loadingKey]: false } : file));
      alert(mode === 'analyze' ? (error instanceof Error ? error.message : 'Failed to analyze code.') : 'Failed to debug code. Please check your API key.');
    }
  };

  if (isAuthLoading) return <div className="h-screen bg-bg-main flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (!user) return <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 py-12 overflow-y-auto"><div className="mb-10 text-center w-full max-w-md"><div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto mb-6"><Code2 size={40} className="text-white" /></div><h1 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-3">Debugr</h1><p className="text-slate-500 font-medium text-base sm:text-lg">The next generation of code analysis</p></div><AuthForm mode={authMode} onSuccess={setUser} onToggleMode={() => setAuthMode(mode => mode === 'login' ? 'register' : 'login')} /></div>;

  return <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
    <Sidebar files={files} activeFileId={activeFileId} onFileSelect={setActiveFileId} onFileUpload={handleFileUpload} onRemoveFile={removeFile} />
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdate={(key, value) => setSettings(previous => ({ ...previous, [key]: value }))} />
    <main className="flex-1 flex flex-col min-w-0 bg-bg-main">
      <header className="h-16 glass-panel border-b flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-6"><div className="flex bg-slate-900/50 rounded-xl p-1 border border-border-subtle shadow-inner"><button onClick={() => setViewMode('code')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 tracking-wide ${viewMode === 'code' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>CODE</button><button onClick={() => setViewMode('diff')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 tracking-wide ${viewMode === 'diff' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>DIFF</button></div>{activeFile && <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900/30 rounded-full border border-border-subtle"><FileCode size={14} className="text-blue-400" /><span className="text-xs font-semibold text-slate-300">{activeFile.name}</span><span className="w-1 h-1 rounded-full bg-slate-700" /><span className="text-[10px] font-bold text-slate-50 uppercase tracking-widest opacity-60">{activeFile.language}</span></div>}</div>
        <div className="flex items-center gap-4"><div className="flex items-center gap-2"><button disabled={!activeFile || activeFile.isAnalyzing || activeFile.isDebugging} onClick={() => runReview('analyze')} className="btn-secondary h-9 text-xs">{activeFile?.isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}Analyze</button><button disabled={!activeFile || activeFile.isAnalyzing || activeFile.isDebugging} onClick={() => runReview('debug')} className="btn-primary h-9 text-xs">{activeFile?.isDebugging ? <Loader2 size={14} className="animate-spin" /> : <Bug size={14} />}Debug</button></div><div className="w-px h-6 bg-border-subtle mx-1" /><div className="flex items-center gap-1"><div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/50 rounded-xl border border-border-subtle mr-2"><div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center"><Chrome size={14} className="text-blue-400" /></div><span className="text-xs font-bold text-slate-300">{user.name}</span></div><button onClick={() => setIsSettingsOpen(true)} className="btn-ghost"><Settings size={18} /></button><button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Logout"><LogOut size={18} /></button></div></div>
      </header>
      <div className="flex-1 flex min-h-0"><div className="flex-1 relative min-w-0">{activeFile ? viewMode === 'code' ? <CodeEditor code={activeFile.content} language={activeFile.language} issues={activeFile.review?.issues} /> : <DiffViewer original={activeFile.content} modified={selectedIssue?.refactoredCode || activeFile.content} /> : <EmptyWorkspace onUpload={() => document.getElementById('file-input')?.click()} />}</div><div className="w-96 border-l border-border-subtle h-full overflow-hidden"><ReviewPanel review={activeFile?.review} onApplyRefactor={issue => { setSelectedIssue(issue); setViewMode('diff'); }} isDebugging={activeFile?.isDebugging} /></div></div>
      <footer className="h-8 bg-slate-950 border-t border-border-subtle px-6 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]"><div className="flex items-center gap-6"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /><span>System Ready</span></div>{activeFile && <div className="flex items-center gap-2 border-l border-border-subtle pl-6"><CheckCircle2 size={12} className="text-slate-600" /><span>{activeFile.content.split('\n').length} Lines</span></div>}</div><div className="flex items-center gap-6"><span>UTF-8</span><span>Gemini 3.6 Flash</span></div></footer>
    </main>
  </div>;
}

function EmptyWorkspace({ onUpload }: { onUpload: () => void }) {
  return <div className="flex flex-col items-center justify-center h-full text-center p-12"><div className="relative mb-12"><div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" /><div className="relative w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-border-subtle shadow-2xl"><Code2 size={64} className="text-slate-700" /></div></div><h2 className="text-3xl font-bold text-slate-100 tracking-tight mb-4">Ready to Review</h2><p className="text-slate-500 max-w-sm leading-relaxed mb-12">Upload your code files or drag them into the workspace to start your AI-powered code analysis.</p><button onClick={onUpload} className="btn-primary px-10 py-4 text-base rounded-2xl"><Upload size={20} />Get Started</button></div>;
}
