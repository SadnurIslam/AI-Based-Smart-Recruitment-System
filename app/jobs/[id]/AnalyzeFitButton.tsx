"use client";

import { useState } from "react";
import { analyzeFitAction } from "@/app/actions/recruitment";

type AnalyzeFitButtonProps = {
  jobId: string;
};

type ResultType = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
};

export function AnalyzeFitButton({ jobId }: AnalyzeFitButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeFitAction(jobId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze fit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      {!result && !loading && (
        <button
          type="button"
          onClick={handleAnalyze}
          className="btn-soft w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
        >
          ✨ Analyze My Fit Before Applying
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center space-x-2 py-3 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-sm font-medium text-slate-600">Analyzing your profile with AI...</span>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm fade-up">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <h3 className="font-semibold text-indigo-900">AI Fit Analysis</h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                result.score >= 70
                  ? "bg-emerald-100 text-emerald-800"
                  : result.score >= 50
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {Math.round(result.score)}% Match
            </span>
          </div>
          
          <div className="mt-3 text-sm text-slate-700 leading-relaxed">
            <p>{result.reasoning}</p>
          </div>

          {result.missingKeywords.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Missing Skills to Add
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 border border-rose-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.matchedKeywords.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Matched Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
