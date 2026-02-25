"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Result = {
  duration_sec: number;
  speech_rate_wpm: number;
  pause_ratio: number;
  volume_stability: number;
  pitch_variation: number;
  feedback: string[];
};

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;

  const [data, setData] = useState<{ status: string; result?: Result } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const run = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      }
    };

    run();
  }, [sessionId]);

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Result</h1>

      <p className="mt-2 text-sm text-gray-600">
        session_id: <span className="font-mono">{sessionId ?? "(loading...)"}</span>
      </p>

      {error && <div className="mt-6 text-red-600">{error}</div>}
      {!data && !error && <div className="mt-6">Loading...</div>}

      {data?.result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded">
            <div>Duration: {data.result.duration_sec.toFixed(2)} sec</div>
            <div>Speech rate: {data.result.speech_rate_wpm} WPM</div>
            <div>Pause ratio: {(data.result.pause_ratio * 100).toFixed(1)}%</div>
            <div>Volume stability: {data.result.volume_stability.toFixed(2)}</div>
            <div>Pitch variation: {data.result.pitch_variation.toFixed(2)}</div>
          </div>

          <div className="p-4 border rounded">
            <div className="font-semibold">Feedback</div>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {data.result.feedback.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}