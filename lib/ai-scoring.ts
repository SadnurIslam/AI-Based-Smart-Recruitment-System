import Groq from "groq-sdk";

type ScoreDetails = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function scoreResumeAgainstRequirements(
  resumeText: string,
  requirementsText: string
): Promise<ScoreDetails> {
  try {
    const prompt = `
You are an expert HR recruiter and resume evaluator.

Analyze the resume below against the job requirements and return a JSON score.

JOB REQUIREMENTS:
${requirementsText}

RESUME:
${resumeText}

Evaluate based on:
- Skill and keyword match
- Experience relevance  
- Education fit
- Overall suitability for the role

Return ONLY this JSON (no markdown, no extra text outside the JSON):
{
  "score": <number 0 to 100>,
  "matchedKeywords": [<list of key skills/terms found in both resume and requirements>],
  "missingKeywords": [<list of important skills/terms in requirements but missing from resume>],
  "reasoning": "<2-3 sentence explanation of the score>"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert HR recruiter. You always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences if model wraps with ```json
    const clean = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(clean) as ScoreDetails;

    // Clamp score to 0-100 just in case
    parsed.score = Math.min(100, Math.max(0, Number(parsed.score)));

    return parsed;
  } catch (error) {
    console.error("Groq scoring failed, returning fallback score:", error);

    // Fallback so the app never crashes if Groq fails
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      reasoning: "AI scoring temporarily unavailable. Please try reapplying.",
    };
  }
}

export async function polishResumeWithGroq(resumeText: string): Promise<string> {
  try {
    const prompt = `
You are an expert technical recruiter and resume writer.
Review the following resume draft. 
Rewrite the professional summary and experience bullet points to be highly impactful.
- Fix any grammatical errors or awkward phrasing.
- Use strong action verbs (e.g., spearheaded, architected, delivered).
- Use the STAR method implicitly where possible (Situation, Task, Action, Result).
- Maintain the original markdown structure and sections.
- Do NOT hallucinate or add fake experiences. Enhance only what is there.

RESUME DRAFT:
${resumeText}

Return ONLY the polished markdown. Do not include any conversational text before or after.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Output only the polished markdown resume.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    
    // Strip markdown code fences if model wraps with ```markdown
    const clean = text
      .replace(/^```markdown\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    return clean || resumeText;
  } catch (error) {
    console.error("Groq polishing failed:", error);
    return resumeText; // Fallback to original text if error
  }
}