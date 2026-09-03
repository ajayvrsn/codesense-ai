import { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeIssue } from '../types';

interface CodeEditorProps { code: string; language: string; issues?: CodeIssue[]; onLineClick?: (line: number) => void; }

export function CodeEditor({ code, language, issues = [], onLineClick }: CodeEditorProps) {
  const issuesByLine = useMemo(() => issues.reduce<Record<number, CodeIssue[]>>((map, issue) => { (map[issue.line] ||= []).push(issue); return map; }, {}), [issues]);
  return <div className="relative h-full overflow-auto bg-[#020617] font-mono text-sm leading-relaxed"><SyntaxHighlighter language={language} style={vscDarkPlus} showLineNumbers customStyle={{ margin: 0, padding: '2rem', backgroundColor: 'transparent', minHeight: '100%', fontSize: '13px' }} lineNumberStyle={{ minWidth: '3.5em', paddingRight: '2em', color: '#334155', textAlign: 'right', userSelect: 'none', opacity: 0.5 }} wrapLines lineProps={lineNumber => { const hasIssue = !!issuesByLine[lineNumber]; return { style: { display: 'block', cursor: 'pointer', backgroundColor: hasIssue ? 'rgba(239, 68, 68, 0.08)' : 'transparent', borderLeft: hasIssue ? '3px solid #ef4444' : '3px solid transparent', transition: 'all 0.2s ease' }, onClick: () => onLineClick?.(lineNumber), className: hasIssue ? 'hover:bg-red-500/15' : 'hover:bg-slate-800/30' }; }}>{code}</SyntaxHighlighter></div>;
}
