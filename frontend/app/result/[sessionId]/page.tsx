type SessionResult = {
  session_id: string;
  status: string;
  audio_filename: string;
  has_result?: boolean;
  result?: {
    transcript?: string;
    summary?: string;
    fluency_score?: number;
    strengths?: string[];
    improvements?: string[];
    overall_comment?: string;
  };
};

async function getSession(sessionId: string): Promise<SessionResult> {
  const res = await fetch(`http://127.0.0.1:8000/api/sessions/${sessionId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch session result");
  }

  return res.json();
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const data = await getSession(sessionId);

  if (data.status !== "done" || !data.result) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Result</h1>
        <p>Processing...</p>
      </main>
    );
  }

  const result = data.result;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-bold">Fluency Coach Result</h1>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Transcript</h2>
        <p className="whitespace-pre-wrap">
          {result.transcript || "No transcript available."}
        </p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p>{result.summary || "No summary available."}</p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Fluency Score</h2>
        <p className="text-2xl font-bold">
          {result.fluency_score ?? "-"} / 10
        </p>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Strengths</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(result.strengths ?? []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Areas to Improve</h2>
        <ul className="list-disc pl-5 space-y-1">
          {(result.improvements ?? []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-2">Overall Comment</h2>
        <p>{result.overall_comment || "No comment available."}</p>
      </section>
    </main>
  );
}