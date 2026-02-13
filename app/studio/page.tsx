'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ApiEnvelope<T> = {
  executionId: string;
  ok: boolean;
  failClass: string;
  userSafeMessage: string;
  data: T | null;
};

type CompileData = {
  compileId: string;
  constraints: unknown;
};

type CheckItem = { id: string; title: string; detail: string };

export default function StudioPage() {
  const params = useSearchParams();
  const compileId = useMemo(() => params.get('compileId') ?? '', [params]);

  const [csrfToken, setCsrfToken] = useState('');
  const [compile, setCompile] = useState<CompileData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [latestExecutionId, setLatestExecutionId] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  useEffect(() => {
    void fetch('/api/csrf')
      .then((res) => res.json())
      .then((json: { csrfToken: string }) => setCsrfToken(json.csrfToken));
  }, []);

  useEffect(() => {
    if (!compileId) {
      return;
    }
    void fetch(`/api/compile/${compileId}`)
      .then((res) => res.json())
      .then((json: ApiEnvelope<CompileData>) => {
        setLatestExecutionId(json.executionId);
        if (json.ok && json.data) {
          setCompile(json.data);
        }
      });
  }, [compileId]);

  const call = async (path: '/api/generate' | '/api/check') => {
    if (!compileId) {
      return;
    }
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ compileId })
    });

    if (path === '/api/generate') {
      const json = (await res.json()) as ApiEnvelope<{ prompt: string }>;
      setLatestExecutionId(json.executionId);
      setPrompt(json.data?.prompt ?? json.userSafeMessage);
      return;
    }

    const json = (await res.json()) as ApiEnvelope<{ checks: CheckItem[] }>;
    setLatestExecutionId(json.executionId);
    setChecks(json.data?.checks ?? []);
  };

  const sendFeedback = async () => {
    if (!latestExecutionId || !feedbackText) {
      return;
    }
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({
        executionId: latestExecutionId,
        compileId,
        screenId: 'studio-result',
        freeText: feedbackText
      })
    });

    const json = (await res.json()) as ApiEnvelope<{ feedbackId: string }>;
    setFeedbackStatus(json.userSafeMessage);
  };

  return (
    <main>
      <div className="panel">
        <a href="/">ResyncExit</a>
      </div>
      <h1>Studio</h1>

      <div className="panel">
        <p>compileId: {compileId || '-'}</p>
        <p>latest executionId: {latestExecutionId || '-'}</p>
        <pre>{JSON.stringify(compile?.constraints ?? 'No compile data.', null, 2)}</pre>
      </div>

      <div className="panel row">
        <button type="button" onClick={() => void call('/api/generate')} disabled={!compileId || !csrfToken}>
          Generate Prompt
        </button>
        <button type="button" onClick={() => void call('/api/check')} disabled={!compileId || !csrfToken}>
          Check Plan
        </button>
      </div>

      <div className="panel">
        <h2>Prompt</h2>
        <pre>{prompt || 'No prompt generated yet.'}</pre>
      </div>

      <div className="panel">
        <h2>Check Plan</h2>
        <ul>
          {checks.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>: {item.detail}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>Feedback</h2>
        <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={4} />
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" onClick={() => void sendFeedback()} disabled={!latestExecutionId || !csrfToken}>
            Send Feedback
          </button>
        </div>
        <p>{feedbackStatus}</p>
      </div>
    </main>
  );
}
