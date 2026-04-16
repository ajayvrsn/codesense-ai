import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  FileCode, 
  Upload, 
  Bug, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Settings, 
  Github,
  Layout,
  Code2,
  Split,
  MessageSquare,
  AlertCircle,
  Loader2,
  X,
  FileText,
  LogOut,
  User as UserIcon,
  Chrome
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as diff from 'diff';
import { cn } from './lib/utils';
import { analyzeCode, debugCode, ReviewResult, CodeIssue } from './services/geminiService';
import { AuthForm } from './components/auth/AuthForm';

// --- Types ---

interface User {
  id: number;
  name: string;
  email: string;
}

interface FileData {
  id: string;
  name: string;
  content: string;
  language: string;
  review?: ReviewResult;
  isAnalyzing?: boolean;
  isDebugging?: boolean;
}

// --- Components ---

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdate 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  settings: { autoFix: boolean, deepDebug: boolean },
  onUpdate: (key: string, value: boolean) => void
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md glass-panel rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/10"
          >
            <div className="p-8 border-b border-border-subtle flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-border-subtle">
                  <Settings size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 tracking-tight">Settings</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between group">
                <div className="flex-1">
                  <p className="font-semibold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">Auto-Fix Suggestions</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Automatically apply non-breaking fixes and style improvements</p>
                </div>
                <button 
                  onClick={() => onUpdate('autoFix', !settings.autoFix)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-300 relative shrink-0 ml-4",
                    settings.autoFix ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings.autoFix ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex-1">
                  <p className="font-semibold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors">Deep Debug Mode</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Perform exhaustive analysis of logic errors and complex edge cases</p>
                </div>
                <button 
                  onClick={() => onUpdate('deepDebug', !settings.deepDebug)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-300 relative shrink-0 ml-4",
                    settings.deepDebug ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings.deepDebug ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            <div className="p-8 bg-slate-900/40 border-t border-border-subtle flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="btn-primary px-8"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Sidebar = ({ 
  files, 
  activeFileId, 
  onFileSelect, 
  onFileUpload,
  onRemoveFile
}: { 
  files: FileData[], 
  activeFileId: string | null, 
  onFileSelect: (id: string) => void,
  onFileUpload: (files: File[]) => void,
  onRemoveFile: (id: string) => void
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileUpload,
    noClick: true
  });

  return (
    <div className="w-64 glass-panel border-r flex flex-col h-full select-none">
      <div className="p-6 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Code2 size={20} className="text-white" />
          </div>
          <span className="font-bold text-slate-100 tracking-tight text-lg">CodeSense</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4" {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Workspace
        </div>
        
        {files.length === 0 ? (
          <div className={cn(
            "mx-4 my-2 p-6 border border-dashed rounded-xl text-center transition-all duration-300",
            isDragActive ? "border-blue-500 bg-blue-500/5" : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/20"
          )}>
            <Upload className="mx-auto mb-3 text-slate-600" size={24} />
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Drop code files here to analyze</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => onFileSelect(file.id)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-all duration-200",
                  activeFileId === file.id 
                    ? "bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]" 
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                )}
              >
                <FileCode size={16} className={cn(activeFileId === file.id ? "text-blue-400" : "text-slate-500")} />
                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                {file.isAnalyzing || file.isDebugging ? (
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 rounded-md transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-subtle bg-slate-900/20">
        <button 
          onClick={() => document.getElementById('file-input')?.click()}
          className="w-full py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-border-subtle active:scale-[0.98]"
        >
          <Upload size={16} />
          Import Files
        </button>
        <input 
          id="file-input" 
          type="file" 
          multiple 
          className="hidden" 
          onChange={(e) => e.target.files && onFileUpload(Array.from(e.target.files))} 
        />
      </div>
    </div>
  );
};

const CodeEditor = ({ 
  code, 
  language, 
  issues = [],
  onLineClick
}: { 
  code: string, 
  language: string, 
  issues?: CodeIssue[],
  onLineClick?: (line: number) => void
}) => {
  const issuesByLine = useMemo(() => {
    const map: Record<number, CodeIssue[]> = {};
    issues.forEach(issue => {
      if (!map[issue.line]) map[issue.line] = [];
      map[issue.line].push(issue);
    });
    return map;
  }, [issues]);

  return (
    <div className="relative h-full overflow-auto bg-[#020617] font-mono text-sm leading-relaxed">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '2rem',
          backgroundColor: 'transparent',
          minHeight: '100%',
          fontSize: '13px'
        }}
        lineNumberStyle={{
          minWidth: '3.5em',
          paddingRight: '2em',
          color: '#334155',
          textAlign: 'right',
          userSelect: 'none',
          opacity: 0.5
        }}
        wrapLines
        lineProps={(lineNumber) => {
          const lineIssues = issuesByLine[lineNumber];
          const hasIssue = !!lineIssues;
          return {
            style: { 
              display: 'block', 
              cursor: 'pointer',
              backgroundColor: hasIssue ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
              borderLeft: hasIssue ? '3px solid #ef4444' : '3px solid transparent',
              transition: 'all 0.2s ease'
            },
            onClick: () => onLineClick?.(lineNumber),
            className: hasIssue ? "hover:bg-red-500/15" : "hover:bg-slate-800/30"
          };
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const DiffViewer = ({ original, modified }: { original: string, modified: string }) => {
  const diffs = diff.diffLines(original, modified);

  return (
    <div className="h-full overflow-auto bg-[#020617] font-mono text-[13px] p-8 space-y-0.5">
      {diffs.map((part, index) => (
        <div
          key={index}
          className={cn(
            "whitespace-pre-wrap px-4 py-0.5 transition-colors",
            part.added ? "bg-green-500/10 text-green-400 border-l-4 border-green-500/50" : 
            part.removed ? "bg-red-500/10 text-red-400 border-l-4 border-red-500/50 line-through opacity-60" : 
            "text-slate-500 opacity-80"
          )}
        >
          {part.value}
        </div>
      ))}
    </div>
  );
};

const ReviewPanel = ({ 
  review, 
  onApplyRefactor,
  isDebugging
}: { 
  review?: ReviewResult, 
  onApplyRefactor: (issue: CodeIssue) => void,
  isDebugging?: boolean
}) => {
  if (!review) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-border-subtle shadow-xl">
        <AlertCircle size={32} className="text-slate-700" />
      </div>
      <p className="text-lg font-semibold text-slate-300 mb-2">No Analysis Yet</p>
      <p className="text-sm text-slate-500 leading-relaxed">Upload a file and run analysis to see AI-powered insights and bug reports.</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col glass-panel">
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Analysis</h2>
            <span className="text-[10px] font-bold uppercase text-blue-500 tracking-[0.2em]">
              {isDebugging ? 'Deep Debug Mode' : 'Standard Review'}
            </span>
          </div>
          <div className={cn(
            "px-4 py-1.5 rounded-full text-sm font-bold shadow-lg",
            review.overallScore >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-green-500/5" :
            review.overallScore >= 60 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-yellow-500/5" :
            "bg-red-500/10 text-red-400 border border-red-500/20 shadow-red-500/5"
          )}>
            Score: {review.overallScore}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-border-subtle">
          <p className="text-sm text-slate-400 leading-relaxed italic">
            "{review.summary}"
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Issues Found ({review.issues.length})</h3>
        </div>
        <div className="space-y-4">
          {review.issues.map((issue, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
              key={idx} 
              className="card-issue group"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110 duration-300",
                  issue.type === 'bug' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  issue.type === 'security' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                  issue.type === 'performance' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                  "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                )}>
                  {issue.type === 'bug' ? <Bug size={18} /> :
                   issue.type === 'security' ? <ShieldAlert size={18} /> :
                   issue.type === 'performance' ? <Zap size={18} /> :
                   <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Line {issue.line} • {issue.severity}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      issue.severity === 'high' ? "bg-red-500 text-white" :
                      issue.severity === 'medium' ? "bg-orange-500 text-white" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {issue.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-semibold mb-1.5 leading-snug">{issue.message}</p>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{issue.suggestion}</p>
                  
                  {issue.refactoredCode && (
                    <button 
                      onClick={() => onApplyRefactor(issue)}
                      className="w-full py-2 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all border border-blue-500/20"
                    >
                      <Split size={14} />
                      Compare Refactor
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ autoFix: false, deepDebug: true });

  // Check auth on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setFiles([]);
      setActiveFileId(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const activeFile = useMemo(() => 
    files.find(f => f.id === activeFileId), 
  [files, activeFileId]);

  const handleUpdateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const extension = file.name.split('.').pop() || 'txt';
        const newFile: FileData = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content,
          language: extension === 'js' ? 'javascript' : 
                    extension === 'ts' ? 'typescript' : 
                    extension === 'py' ? 'python' : 
                    extension === 'tsx' ? 'typescript' : extension,
        };
        setFiles(prev => [...prev, newFile]);
        if (!activeFileId) setActiveFileId(newFile.id);
      };
      reader.readAsText(file);
    });
  }, [activeFileId]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const runAnalysis = async () => {
    if (!activeFile || activeFile.isAnalyzing || activeFile.isDebugging) return;

    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isAnalyzing: true } : f));

    try {
      const result = await analyzeCode(activeFile.content, activeFile.name);
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, review: result, isAnalyzing: false } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isAnalyzing: false } : f));
      alert("Failed to analyze code. Please check your API key.");
    }
  };

  const runDebug = async () => {
    if (!activeFile || activeFile.isAnalyzing || activeFile.isDebugging) return;

    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isDebugging: true } : f));

    try {
      const result = await debugCode(activeFile.content, activeFile.name);
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, review: result, isDebugging: false } : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, isDebugging: false } : f));
      alert("Failed to debug code. Please check your API key.");
    }
  };

  const handleApplyRefactor = (issue: CodeIssue) => {
    setSelectedIssue(issue);
    setViewMode('diff');
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen bg-bg-main flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 py-12 overflow-y-auto">
        <div className="mb-10 text-center w-full max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto mb-6">
            <Code2 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight mb-3">CodeSense AI</h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">The next generation of code analysis</p>
        </div>
        <AuthForm 
          mode={authMode} 
          onSuccess={setUser} 
          onToggleMode={() => setAuthMode(mode => mode === 'login' ? 'register' : 'login')} 
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <Sidebar 
        files={files} 
        activeFileId={activeFileId} 
        onFileSelect={setActiveFileId}
        onFileUpload={handleFileUpload}
        onRemoveFile={removeFile}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdate={handleUpdateSetting}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-bg-main">
        {/* Toolbar */}
        <div className="h-16 glass-panel border-b flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-900/50 rounded-xl p-1 border border-border-subtle shadow-inner">
              <button 
                onClick={() => setViewMode('code')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 tracking-wide",
                  viewMode === 'code' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                CODE
              </button>
              <button 
                onClick={() => setViewMode('diff')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 tracking-wide",
                  viewMode === 'diff' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                DIFF
              </button>
            </div>
            
            {activeFile && (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900/30 rounded-full border border-border-subtle">
                <FileCode size={14} className="text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">{activeFile.name}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-50 uppercase tracking-widest opacity-60">{activeFile.language}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                disabled={!activeFile || activeFile.isAnalyzing || activeFile.isDebugging}
                onClick={runAnalysis}
                className="btn-secondary h-9 text-xs"
              >
                {activeFile?.isAnalyzing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                Analyze
              </button>

              <button 
                disabled={!activeFile || activeFile.isAnalyzing || activeFile.isDebugging}
                onClick={runDebug}
                className="btn-primary h-9 text-xs"
              >
                {activeFile?.isDebugging ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Bug size={14} />
                )}
                Debug
              </button>
            </div>

            <div className="w-px h-6 bg-border-subtle mx-1" />
            
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/50 rounded-xl border border-border-subtle mr-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Chrome size={14} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-slate-300">{user.name}</span>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="btn-ghost"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 relative min-w-0">
            {activeFile ? (
              viewMode === 'code' ? (
                <CodeEditor 
                  code={activeFile.content} 
                  language={activeFile.language} 
                  issues={activeFile.review?.issues}
                />
              ) : (
                <DiffViewer 
                  original={activeFile.content} 
                  modified={selectedIssue?.refactoredCode || activeFile.content} 
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="relative mb-12">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                  <div className="relative w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-border-subtle shadow-2xl">
                    <Code2 size={64} className="text-slate-700" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-100 tracking-tight mb-4">Ready to Review</h2>
                <p className="text-slate-500 max-w-sm leading-relaxed mb-12">
                  Upload your code files or drag them into the workspace to start your AI-powered code analysis.
                </p>
                <button 
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="btn-primary px-10 py-4 text-base rounded-2xl"
                >
                  <Upload size={20} />
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-96 border-l border-border-subtle h-full overflow-hidden">
            <ReviewPanel 
              review={activeFile?.review} 
              onApplyRefactor={handleApplyRefactor}
              isDebugging={activeFile?.isDebugging}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-slate-950 border-t border-border-subtle px-6 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span>System Ready</span>
            </div>
            {activeFile && (
              <div className="flex items-center gap-2 border-l border-border-subtle pl-6">
                <CheckCircle2 size={12} className="text-slate-600" />
                <span>{activeFile.content.split('\n').length} Lines</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-default transition-colors">UTF-8</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Gemini 3 Flash</span>
          </div>
        </div>
      </main>
    </div>
  );
}
