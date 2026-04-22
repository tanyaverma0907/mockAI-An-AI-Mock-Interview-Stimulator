
import { Request, Response } from "express";
import { callGemini } from "../services/gemini.service.js";

interface AIRequestBody {
  question: string;
  answer: string;
  role: string;
  followUpQ?: string;
  followUpA?: string;
}

interface GeminiParsedResponse {
  score: number;
  feedback: string;
  followUp: string;
  isCorrect: boolean;
}

export async function evaluateAnswer(req: Request, res: Response) {
  const { question, answer, role, followUpQ, followUpA } = req.body as AIRequestBody;

  if (!question || !answer || !role) {
    return res.status(400).json({
      score: 50,
      feedback: "Request was missing required fields.",
      followUp: "Could you clarify your answer?",
      isCorrect: false,
    });
  }

  // Pre-screen very short answers before calling Gemini
  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount < 10) {
    return res.json({
      score: 15,
      feedback: "Your answer is too short. Interviewers expect at least 2-3 sentences with a concrete example using the STAR method.",
      followUp: "Can you give a specific example that demonstrates this?",
      isCorrect: false,
    });
  }

  const followUpSection = followUpQ && followUpA
    ? `\nFollow-up Question: "${followUpQ}"\nFollow-up Answer: "${followUpA}"\nFactor the follow-up into the final score.`
    : "";

  // Everything in one prompt — Gemini Flash ignores system_instruction via REST
  const fullPrompt = `You are a STRICT and CRITICAL ${role} interviewer at a top tech company.
You do NOT give benefit of the doubt. You score based on actual content, not potential.

=== INTERVIEW EVALUATION ===
Question: "${question}"
Answer: "${answer}"
${followUpSection}

=== STRICT SCORING RUBRIC ===
Score 85-100 ONLY IF ALL of these are true:
- Uses STAR format (Situation, Task, Action, Result) explicitly
- Has SPECIFIC numbers, metrics, or measurable outcomes
- Demonstrates clear impact and personal ownership
- Answer is at least 80 words with real substance

Score 65-84 IF:
- Has some structure but missing 1-2 STAR elements
- Mentions results but without specific numbers
- Good content but lacks depth or clarity

Score 45-64 IF:
- Vague answer without specific examples
- Claims without evidence ("I'm good at X" with no proof)
- Missing situation/context or missing results
- Under 50 words or rambling without structure

Score 0-44 IF:
- Off-topic, too short, or just restating the question
- No real example given
- Generic phrases only ("I work hard", "I'm a team player")
- Clearly low effort

=== IMPORTANT ===
- isCorrect = true ONLY if score >= 75. Otherwise false.
- Be honest and critical. Do NOT inflate scores.
- If the answer is average, score it 50-64, NOT 75+.
- feedback must cite ACTUAL words from their answer, not generic advice.

Return ONLY this JSON, no markdown, no extra text:
{
  "score": <integer 0-100>,
  "feedback": "<2-3 sentences: name ONE specific strength quoting their words, then ONE specific weakness with how to fix it>",
  "followUp": "<one probing question that challenges the weakest part of their answer>",
  "isCorrect": <true if score >= 75, false otherwise>
}`;

  try {
    let text = await callGemini(fullPrompt);
    console.log("🤖 RAW GEMINI:", text);

    text = text.replace(/```json|```/g, "").trim();

    let parsed: GeminiParsedResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("❌ JSON parse failed:", text);
      return res.json({
        score: 55,
        feedback: "You covered the basic idea but lacked concrete metrics or a clear outcome. Structure your answer using STAR: Situation, Task, Action, Result.",
        followUp: "What specific measurable result did your actions achieve?",
        isCorrect: false,
      });
    }

    // Post-process: prevent score inflation
    let score = Math.max(0, Math.min(100, parsed.score ?? 55));
    if (wordCount < 30 && score > 50) score = 45;
    const isCorrect = score >= 75;

    return res.json({
      score,
      feedback: parsed.feedback || "Add more structure and concrete examples.",
      followUp: parsed.followUp || "Can you walk me through your approach step by step?",
      isCorrect,
    });

  } catch (err) {
    const error = err as Error;
    console.error("❌ Gemini ERROR:", error.message);
    return res.status(500).json({
      score: 50,
      feedback: "Server error while evaluating.",
      followUp: "Can you explain your solution in a more structured way?",
      isCorrect: false,
      _debug: error.message,
    });
  }
}