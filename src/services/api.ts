import { ReviewResult } from './geminiService';

const requestReview = async (
  endpoint: string,
  code: string,
  fileName: string,
  errorMessage: string
): Promise<ReviewResult> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, fileName }),
  });

  if (!response.ok) {
    const text = await response.text();
    let error: { error?: string } = {};
    try {
      error = text ? JSON.parse(text) : {};
    } catch {
      error.error = text;
    }
    throw new Error(error.error || errorMessage);
  }

  return response.json();
};

export const analyzeCode = (code: string, fileName: string) =>
  requestReview('/api/analyze', code, fileName, 'Failed to analyze code');

export const debugCode = (code: string, fileName: string) =>
  requestReview('/api/debug', code, fileName, 'Failed to debug code');
