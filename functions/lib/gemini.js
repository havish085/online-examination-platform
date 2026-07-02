"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMCQs = generateMCQs;
const generative_ai_1 = require("@google/generative-ai");
const getApiKey = () => {
    return process.env.GEMINI_API_KEY || process.env.FIREBASE_CONFIG_API_KEY || "AIzaSyB3_1lREx_u8uZ-8cP5HZGAiPh5x5MdDeI";
};
async function generateMCQs(subject, topic, difficulty, count = 10) {
    const apiKey = getApiKey();
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for speed and structural accuracy
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });
    const prompt = `
Generate exactly ${count} multiple choice questions (MCQs) for the subject "${subject}", topic "${topic}", and difficulty level "${difficulty}".
Each question must follow this exact JSON structure:
- questionText: string
- options: an object with keys A, B, C, D and string values
- correctAnswer: "A", "B", "C", or "D"
- explanation: string explaining why the answer is correct
- difficulty: "${difficulty}"
- marks: number (e.g. 1 for easy, 2 for medium, 5 for hard)

Return ONLY a JSON array containing these question objects:
[
  {
    "questionText": "What is the time complexity of binary search?",
    "options": {
      "A": "O(n)",
      "B": "O(log n)",
      "C": "O(n log n)",
      "D": "O(1)"
    },
    "correctAnswer": "B",
    "explanation": "Binary search divides the search space in half at each step, resulting in a logarithmic time complexity.",
    "difficulty": "${difficulty}",
    "marks": ${difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 5}
  }
]
`;
    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        if (!text) {
            throw new Error("Empty response received from Gemini.");
        }
        // Clean markdown code blocks if present (e.g., ```json ... ```)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const questions = JSON.parse(text);
        if (!Array.isArray(questions)) {
            throw new Error("Gemini response is not a valid JSON array.");
        }
        return questions;
    }
    catch (error) {
        console.error("Error in generateMCQs:", error);
        throw new Error(`Failed to generate questions: ${error.message}`);
    }
}
//# sourceMappingURL=gemini.js.map