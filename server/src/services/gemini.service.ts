// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// export async function callGemini(
//   systemPrompt: string,
//   userPrompt: string
// ): Promise<string> {
//   const res = await fetch(GEMINI_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       system_instruction: {
//         parts: [{ text: systemPrompt }],
//       },
//       contents: [
//         {
//           parts: [{ text: userPrompt }],
//         },
//       ],
//       generationConfig: {
//         temperature: 0.7,
//         maxOutputTokens: 1024,
//       },
//     }),
//   });

//   if (!res.ok) {
//     const err = await res.json() as { error?: { message?: string } };
//     throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
//   }

//   const data = await res.json() as {
//     candidates?: { content?: { parts?: { text?: string }[] } }[];
//   };

//   const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   if (!text) throw new Error("Empty response from Gemini");
//   return text;
// }


// ❌ was: process.env.VITE_GEMINI_API_KEY  (Vite-only, Node can't read it)
// ✅ fix: process.env.GEMINI_API_KEY

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

export async function callGemini(fullPrompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }], // single prompt, no system_instruction
      generationConfig: {
        temperature: 0.4, // lower = more consistent scoring
        maxOutputTokens: 512,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}