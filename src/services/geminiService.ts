import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "").trim();
const ai = new GoogleGenAI({ apiKey });

export interface CodeIssue {
  line: number;
  type: "bug" | "security" | "style" | "performance";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
  refactoredCode?: string;
}

export interface ReviewResult {
  summary: string;
  issues: CodeIssue[];
  overallScore: number;
}

export async function analyzeCode(code: string, fileName: string): Promise<ReviewResult> {
  const model = "gemini-3.6-flash";
  
  const prompt = `
    You are a senior software engineer and security expert. 
    Review the following code file: ${fileName}.
    
    Analyze for:
    1. Bugs and logical errors.
    2. Security vulnerabilities (OWASP Top 10, etc.).
    3. Code quality, readability, and best practices.
    4. Performance bottlenecks.
    
    Provide a structured JSON response.
    Return an array of issues with line numbers, types, severity, and clear explanations.
    Also provide a brief summary and an overall quality score (0-100).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt },
        { text: `CODE:\n${code}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["bug", "security", "style", "performance"] },
                  severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  refactoredCode: { type: Type.STRING }
                },
                required: ["line", "type", "severity", "message", "suggestion"]
              }
            }
          },
          required: ["summary", "overallScore", "issues"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function debugCode(code: string, fileName: string): Promise<ReviewResult> {
  const model = "gemini-3.6-flash";
  
  const prompt = `
    You are a world-class debugger and software engineer. 
    Your goal is to find every single bug, logical error, and edge case in the following code: ${fileName}.
    
    Focus ONLY on:
    1. Functional bugs (code that doesn't work as intended).
    2. Logical errors (incorrect algorithms, off-by-one errors).
    3. Edge cases (null pointers, empty inputs, overflow).
    4. Runtime errors.
    
    For every bug found, you MUST provide:
    - The exact line number.
    - A detailed explanation of why it's a bug.
    - A complete, refactored version of the function or block that fixes the bug.
    
    Provide a structured JSON response.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { text: prompt },
        { text: `CODE:\n${code}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["bug"] },
                  severity: { type: Type.STRING, enum: ["medium", "high"] },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  refactoredCode: { type: Type.STRING }
                },
                required: ["line", "type", "severity", "message", "suggestion", "refactoredCode"]
              }
            }
          },
          required: ["summary", "overallScore", "issues"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Debug Error:", error);
    throw error;
  }
}
