import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CodeAnalysisResult {
  summary: string;
  score: number;
  insights: {
    category: "security" | "performance" | "quality" | "maintainability";
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    suggestion: string;
    codeSnippet?: string;
  }[];
  refactoredCode?: string;
}

export async function analyzeCode(code: string, language: string): Promise<CodeAnalysisResult> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `Analyze the following ${language} code for security vulnerabilities, performance bottlenecks, code quality issues, and maintainability. 
  Provide a detailed report including a summary, a quality score (0-100), and specific insights with suggestions for improvement.
  
  Code to analyze:
  \`\`\`${language}
  ${code}
  \`\`\``;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          score: { type: Type.NUMBER },
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { 
                  type: Type.STRING,
                  enum: ["security", "performance", "quality", "maintainability"]
                },
                severity: {
                  type: Type.STRING,
                  enum: ["low", "medium", "high", "critical"]
                },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                codeSnippet: { type: Type.STRING }
              },
              required: ["category", "severity", "title", "description", "suggestion"]
            }
          },
          refactoredCode: { type: Type.STRING }
        },
        required: ["summary", "score", "insights"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid analysis result from AI");
  }
}
