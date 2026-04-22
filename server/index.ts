
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import OpenAI from "openai";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ─── SANITY CHECK on startup ──────────────────────────────────────────────────
// if (!process.env.OPENAI_API_KEY) {
//   console.error("❌ OPENAI_API_KEY is missing from your .env file!");
//   console.error("   Create a .env file in the same folder as this server with:");
//   console.error("   OPENAI_API_KEY=sk-...");
//   process.exit(1); // Stop the server immediately so you know why it failed
// }

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // ─── HEALTH CHECK (visit http://localhost:5000/ping to confirm server is up) ──
// app.get("/ping", (req, res) => {
//   res.json({ ok: true, message: "Server is running ✅" });
// });

// // ─── MAIN AI ENDPOINT ─────────────────────────────────────────────────────────
// app.post("/ai", async (req, res) => {
//   const { question, answer, role, followUpQ, followUpA } = req.body;

//   // ── Validate required fields ─────────────────────────────────────────────
//   if (!question || !answer || !role) {
//     console.warn("⚠️  Missing fields in request body:", req.body);
//     return res.status(400).json({
//       score: 50,
//       feedback: "Request was missing required fields.",
//       followUp: "Could you clarify your answer?",
//     });
//   }

//   // ── Build follow-up context if provided ──────────────────────────────────
//   const followUpSection =
//     followUpQ && followUpA
//       ? `\n\nA follow-up question was also asked:
// Follow-up Q: ${followUpQ}
// Follow-up A: ${followUpA}
// Consider this when scoring — a strong follow-up answer should boost the score.`
//       : "";

//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0.7,
//       messages: [
//         {
//           role: "system",
//           content: `You are a sharp, experienced ${role} interviewer.
// Give specific, actionable feedback — never generic.
// Always return valid JSON only, with no extra text or markdown.`,
//         },
//         {
//           role: "user",
//           content: `Evaluate this interview answer:

// Question: ${question}
// Answer: ${answer}${followUpSection}

// Return ONLY this JSON (no markdown, no explanation):
// {
//   "score": <integer 0-100>,
//   "feedback": "<2-3 specific sentences — mention one strength and one improvement>",
//   "followUp": "<one sharp follow-up question based on their answer>"
// }

// Scoring guide:
// - 80-100: Excellent STAR structure, concrete examples, clear impact
// - 60-79: Good but missing depth or measurable results
// - 40-59: Basic answer, vague, missing key elements
// - 0-39: Off-topic, too short, or no real substance`,
//         },
//       ],
//     });

//     let text = completion.choices?.[0]?.message?.content || "";
//     console.log("🤖 RAW AI RESPONSE:", text);

//     // Strip markdown fences if model accidentally adds them
//     text = text.replace(/```json|```/g, "").trim();

//     let parsed;
//     try {
//       parsed = JSON.parse(text);
//     } catch (parseErr) {
//       console.error("❌ JSON parse failed. Raw text was:", text);
//       parsed = {
//         score: 65,
//         feedback:
//           "You covered the key idea but lacked concrete metrics or depth. Add a measurable outcome.",
//         followUp:
//           "What specific results did your approach achieve — can you quantify the impact?",
//       };
//     }

//     // Ensure all required fields exist
//     const safeScore = typeof parsed.score === "number"
//       ? Math.max(0, Math.min(100, parsed.score))
//       : 60;

//     return res.json({
//       score: safeScore,
//       feedback: parsed.feedback || "Decent answer — add more structured impact and clarity.",
//       followUp: parsed.followUp || "Can you walk me through your approach step by step?",
//     });

//   } catch (err) {
//     // This catches OpenAI API errors (wrong key, rate limit, network, etc.)
//     console.error("❌ OpenAI API ERROR:", err?.message || err);

//     // Give a hint in the response so you can debug from frontend console too
//     return res.status(500).json({
//       score: 50,
//       feedback: "Server error while evaluating. Check that your OPENAI_API_KEY is valid.",
//       followUp: "Can you explain your solution in a more structured way?",
//       _debug: err?.message, // visible in browser Network tab
//     });
//   }
// });

// app.listen(5000, () => {
//   console.log("✅ Server running on http://localhost:5000");
//   console.log("   Test it: http://localhost:5000/ping");
// });



import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./src/routes/ai.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── SANITY CHECK ─────────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from your .env file!");
  console.error("   Get a free key at: https://aistudio.google.com");
  process.exit(1);
}

app.use(cors({ origin: "http://localhost:5173" })); // Vite default port
app.use(express.json());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/ai", aiRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/ping", (_req, res) => {
  res.json({ ok: true, message: "MockAI server is running ✅" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/ping`);
});