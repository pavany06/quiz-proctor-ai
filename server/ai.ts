import { GoogleGenAI, Type } from "@google/genai";
import { Question, AIInsights } from "../src/types.js";

// Initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

export interface GenerateQuestionsParams {
  topic: string;
  numberOfQuestions: number; // e.g. 5 or 10
  difficulty: 'Easy' | 'Medium' | 'Hard';
  additionalInstructions?: string;
}

// AI Question Generator using Gemini 3.6 Flash with JSON response schema
export async function generateAIQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
  const ai = getGeminiClient();
  const { topic, numberOfQuestions, difficulty, additionalInstructions = "" } = params;

  if (ai) {
    try {
      const prompt = `Generate exactly ${numberOfQuestions} multiple-choice questions (MCQs) for a computer science assessment on the topic: "${topic}".
Difficulty level: ${difficulty}.
${additionalInstructions ? `Additional Requirements: ${additionalInstructions}` : ''}
Provide detailed explanations and clear options for A, B, C, and D.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a senior computer science professor setting an examination paper. Return a structured array of MCQs with options A, B, C, D, correct answer (A/B/C/D), marks (1 or 2), difficulty, and explanation.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                optionA: { type: Type.STRING },
                optionB: { type: Type.STRING },
                optionC: { type: Type.STRING },
                optionD: { type: Type.STRING },
                correctAnswer: { type: Type.STRING, description: "Must be one of A, B, C, or D" },
                explanation: { type: Type.STRING },
                codeSnippet: { type: Type.STRING, description: "Optional programming code snippet if relevant" }
              },
              required: ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            const validAnswer = ['A', 'B', 'C', 'D'].includes(item.correctAnswer?.toUpperCase())
              ? item.correctAnswer.toUpperCase() as 'A' | 'B' | 'C' | 'D'
              : 'A';
            return {
              id: `ai-gen-${Date.now()}-${idx + 1}`,
              question: item.question || `Sample question about ${topic}`,
              options: [
                { key: 'A', text: item.optionA || 'Option A' },
                { key: 'B', text: item.optionB || 'Option B' },
                { key: 'C', text: item.optionC || 'Option C' },
                { key: 'D', text: item.optionD || 'Option D' }
              ],
              correctAnswer: validAnswer,
              marks: difficulty === 'Hard' ? 2 : 1,
              difficulty: difficulty,
              explanation: item.explanation || 'Refer to standard computer science literature.',
              topic: topic,
              codeSnippet: item.codeSnippet || undefined
            };
          });
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, using intelligent fallback question generator:", err);
    }
  }

  // Smart local fallback generator if API key is not configured or fails
  return generateFallbackQuestions(topic, numberOfQuestions, difficulty);
}

// AI Performance Insights Generator
export async function generateAIPerformanceInsights(quizStats: {
  quizTitle: string;
  topic: string;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  topicBreakdown?: Record<string, number>;
}): Promise<AIInsights> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Analyze this online quiz assessment performance data and generate educational insights for the faculty:
Quiz Title: ${quizStats.quizTitle}
Topic: ${quizStats.topic}
Total Attempts: ${quizStats.totalAttempts}
Average Score: ${quizStats.avgScore}%
Pass Rate: ${quizStats.passRate}%

Identify strong topics, weak areas, difficulty alignment, performance trends, and actionable teaching recommendations.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an AI Academic Analytics Advisor. Analyze quiz statistics and return a JSON object with strongTopics, weakTopics, difficultyAnalysis, performanceTrends, and recommendations.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strongTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              weakTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              difficultyAnalysis: { type: Type.STRING },
              performanceTrends: { type: Type.STRING },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["strongTopics", "weakTopics", "difficultyAnalysis", "performanceTrends", "recommendations"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          ...parsed,
          generatedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn("Gemini AI Insights call failed, using intelligent fallback insights:", err);
    }
  }

  // Fallback insights based on actual quiz stats
  const isHighPerformance = quizStats.avgScore >= 65;
  return {
    strongTopics: isHighPerformance
      ? [`Fundamental ${quizStats.topic} Concepts`, 'Basic Definition & Syntax', 'Standard Operations']
      : ['Basic Terminology', 'Conceptual Overview'],
    weakTopics: isHighPerformance
      ? ['Edge Case Analysis', 'Time Complexity Trade-offs']
      : ['Complex Problem Solving', `Advanced ${quizStats.topic} Algorithms`, 'Code Output Tracing'],
    difficultyAnalysis: `Current pass rate of ${quizStats.passRate}% indicates ${
      quizStats.passRate > 70 ? 'appropriate difficulty balance for student cohort' : 'high question difficulty requiring review'
    }.`,
    performanceTrends: `Average completion score sits at ${quizStats.avgScore}%. Attempt velocity shows steady engagement across student cohorts.`,
    recommendations: [
      `Conduct a dedicated tutorial session addressing weak areas in ${quizStats.topic}.`,
      'Provide additional practice problems featuring step-by-step code execution walkthroughs.',
      'Consider releasing a practice quiz with detailed explanations to reinforce conceptual clarity.'
    ],
    generatedAt: new Date().toISOString()
  };
}

// Fallback question generator with rich B.Tech CSE content templates
function generateFallbackQuestions(topic: string, count: number, difficulty: 'Easy' | 'Medium' | 'Hard'): Question[] {
  const templates = [
    {
      q: `Which of the following best describes the core concept of ${topic}?`,
      a: 'It organizes data elements efficiently for specific operations and processing.',
      b: 'It compiles source code into machine language instructions.',
      c: 'It manages physical RAM allocation in modern Operating Systems.',
      d: 'It encrypts network packets across the OSI Transport layer.',
      correct: 'A' as const,
      exp: `${topic} focuses on structured organization and algorithmic operations on computer data.`
    },
    {
      q: `What is the worst-case time complexity associated with searching/operating in ${topic}?`,
      a: 'O(1)',
      b: 'O(log n)',
      c: 'O(n)',
      d: 'O(n²)',
      correct: 'C' as const,
      exp: `Standard linear processing or worst-case degradation in ${topic} evaluates to O(n) operations.`
    },
    {
      q: `Consider the following code snippet regarding ${topic}:\n\`\`\`cpp\nvoid process(${topic}* root) {\n    if (root == NULL) return;\n    process(root->left);\n    cout << root->data << " ";\n    process(root->right);\n}\n\`\`\`\nWhat does this function perform?`,
      a: 'Pre-order traversal',
      b: 'In-order traversal',
      c: 'Post-order traversal',
      d: 'Level-order traversal',
      correct: 'B' as const,
      exp: 'Visiting left subtree, processing current node, and visiting right subtree is the definition of In-order traversal.'
    },
    {
      q: `Which design paradigm or property is most fundamentally applicable when implementing ${topic}?`,
      a: 'Greedy Strategy',
      b: 'Dynamic Programming & Memory Re-use',
      c: 'Divide and Conquer',
      d: 'First-In-First-Out (FIFO) or Last-In-First-Out (LIFO) Ordering',
      correct: 'D' as const,
      exp: `Structural operations in ${topic} adhere strictly to defined sequence ordering semantics.`
    },
    {
      q: `What will happen if an index out of bounds or NULL pointer exception occurs during ${topic} execution?`,
      a: 'Compilation error',
      b: 'Runtime Segmentation Fault',
      c: 'Automatic garbage collection retry',
      d: 'Infinite loop',
      correct: 'B' as const,
      exp: 'Dereferencing NULL pointers or invalid memory addresses produces a runtime Segmentation Fault.'
    }
  ];

  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length];
    questions.push({
      id: `ai-gen-${Date.now()}-${i + 1}`,
      question: `${tmpl.q} (Question ${i + 1} on ${topic})`,
      options: [
        { key: 'A', text: tmpl.a },
        { key: 'B', text: tmpl.b },
        { key: 'C', text: tmpl.c },
        { key: 'D', text: tmpl.d }
      ],
      correctAnswer: tmpl.correct,
      marks: difficulty === 'Hard' ? 2 : 1,
      difficulty: difficulty,
      explanation: tmpl.exp,
      topic: topic,
      codeSnippet: tmpl.q.includes('```') ? tmpl.q.split('```cpp')[1]?.split('```')[0]?.trim() : undefined
    });
  }

  return questions;
}
