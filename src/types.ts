import { CodeIssue, ReviewResult } from './services/geminiService';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface FileData {
  id: string;
  name: string;
  content: string;
  language: string;
  review?: ReviewResult;
  isAnalyzing?: boolean;
  isDebugging?: boolean;
}

export type { CodeIssue, ReviewResult };
