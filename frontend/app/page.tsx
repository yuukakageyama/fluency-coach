"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type State = "idle" | "recording" | "stopped" | "uploading";

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const textId = "en_beginner_01";
  const promptText = "I’d like a cup of coffee, please.";

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const start = async () => {
    setError(null);
    setSessionId(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("stopped");
      };

      mr.start();
      setState("recording");
    } catch (e: any) {
      setError(e?.message ?? "Failed to access microphone");
      setState("idle");
    }
  };

  const stop = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const upload = async () => {
    if (!audioUrl) return;

    setState("uploading");

    const blob = await (await fetch(audioUrl)).blob();
    const file = new File([blob], "recording.webm", { type: "audio/webm" });

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/sessions?text_id=${textId}`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();
      setSessionId(data.session_id);
      setState("stopped");
      // ✅ ここで結果ページへ
      router.push(`/result/${data.session_id}`);

    } catch {
      setError("Upload failed");
      setState("stopped");
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Fluency Coach</h1>
      <p className="mt-2 text-sm text-gray-600">{promptText}</p>

      <div className="mt-6 flex gap-3">
        <button onClick={start} disabled={state === "recording"}>
          Start
        </button>
        <button onClick={stop} disabled={state !== "recording"}>
          Stop
        </button>
        <button onClick={upload} disabled={!audioUrl}>
          Upload
        </button>
      </div>

      <p className="mt-4">State: {state}</p>

      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} />
        </div>
      )}

      {sessionId && (
        <div className="mt-4 text-green-600">
          Uploaded! session_id: {sessionId}
        </div>
      )}

      {error && <div className="mt-4 text-red-600">{error}</div>}
    </main>
  );
}