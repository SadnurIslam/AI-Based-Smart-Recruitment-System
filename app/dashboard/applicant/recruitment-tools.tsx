"use client";

import { useState } from "react";

type ScoreResult = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
};

type MatchResult = {
  count: number;
  matches: Array<{
    jobId: string;
    title: string;
    department: string;
    location: string;
    score: number;
    matchedKeywords: string[];
  }>;
};

type ApplicantRecruitmentToolsProps = {
  mode: "score" | "match" | "both";
};

export function ApplicantRecruitmentTools({ mode = "both" }: Partial<ApplicantRecruitmentToolsProps>) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scoreResume() {
    const resume = resumeText.trim();
    const description = jobDescription.trim();
    if (!resume || !description || scoreLoading) return;

    setError(null);
    setScoreLoading(true);
    try {
      const res = await fetch("/api/applicant/score-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resume, jobDescription: description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Resume scoring failed.");
        return;
      }
      setScoreResult(data.result as ScoreResult);
    } catch {
      setError("Network error while scoring the resume.");
    } finally {
      setScoreLoading(false);
    }
  }

  async function findMatches() {
    if (matchLoading) return;

    setError(null);
    setMatchLoading(true);
    try {
      const res = await fetch("/api/applicant/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumeText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Job matching failed.");
        return;
      }
      setMatchResult(data.result as MatchResult);
    } catch {
      setError("Network error while finding matched jobs.");
    } finally {
      setMatchLoading(false);
    }
  }

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Resume Score & Job Match</h2>
        <p className="text-sm text-slate-400">
          Paste any resume and any job description to score the fit, or leave the resume filled
          in to find matched jobs for your profile.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Resume text</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="text-area min-h-[220px]"
            placeholder="Paste your resume or use the resume builder text here..."
          />
        </div>

        {mode !== "match" && (
          <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Job description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="text-area min-h-[220px]"
            placeholder="Paste a job description to score your resume against it..."
          />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {(mode === "score" || mode === "both") && (
          <button
            type="button"
            onClick={scoreResume}
            className="btn-main"
            disabled={scoreLoading || !resumeText.trim() || !jobDescription.trim()}
          >
            {scoreLoading ? "Scoring..." : "Score Resume"}
          </button>
        )}
        {(mode === "match" || mode === "both") && (
          <button
            type="button"
            onClick={findMatches}
            className="btn-soft"
            disabled={matchLoading || !resumeText.trim()}
          >
            {matchLoading ? "Finding..." : "Find Matching Jobs"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
          {error}
        </p>
      )}

      {scoreResult && (mode === "score" || mode === "both") && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Score result</h3>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
              {scoreResult.score.toFixed(0)}/100
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{scoreResult.reasoning}</p>
          <p className="mt-3 text-xs text-slate-500">
            Matched: {scoreResult.matchedKeywords.length ? scoreResult.matchedKeywords.join(", ") : "None"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Missing: {scoreResult.missingKeywords.length ? scoreResult.missingKeywords.join(", ") : "None"}
          </p>
        </div>
      )}

      {matchResult && (mode === "match" || mode === "both") && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Matched jobs</h3>
            <span className="text-sm text-slate-400">{matchResult.count} results</span>
          </div>
          <div className="mt-3 space-y-3">
            {matchResult.matches.map((job) => (
              <a
                key={job.jobId}
                href={`/jobs/${job.jobId}`}
                className="block rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 transition hover:border-teal-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{job.title}</p>
                    <p className="text-sm text-slate-400">
                      {job.department} · {job.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-500/20 px-3 py-1 text-sm font-semibold text-teal-300">
                    {job.score.toFixed(0)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Matched keywords: {job.matchedKeywords.length ? job.matchedKeywords.join(", ") : "None"}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}