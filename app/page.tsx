'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ApiEnvelope<T> = {
  executionId: string;
  ok: boolean;
  failClass: string;
  userSafeMessage: string;
  data: T | null;
};

const initialPDL = `Module:module:security\nDeclare:executionId:all api responses include executionId\nRule:failClass:must be from fixed enum\nCheck:feedback:feedback is linked to executionId\nRule:rateLimit:server side rate limiting is required\nRule:budgetCap:server side budget cap is required`;

export default function HomePage() {
  const [csrfToken, setCsrfToken] = useState('');
  const [title, setTitle] = useState('PDL v0.1');
  const [sourceText, setSourceText] = useState(initialPDL);
  const [result, setResult] = useState<string>('');
  const [executionId, setExecutionId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void fetch('/api/csrf')
      .then((res) => res.json())
      .then((json: { csrfToken: string }) => setCsrfToken(json.csrfToken));
  }, []);

  const callApi = async (path: '/api/validate' | '/api/compile') => {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ title, sourceText })
      });
      const json = (await res.json()) as ApiEnvelope<{ compileId: string; constraints: unknown }>;
      setExecutionId(json.executionId);
      setResult(JSON.stringify(json, null, 2));
      if (json.ok && json.data && path === '/api/compile') {
        router.push(`/studio?compileId=${json.data.compileId}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>PDL Studio</h1>
      <p>PDLテキストを入力し、検証とコンパイルを行います。</p>

      <div className="panel">
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="panel">
        <label htmlFor="pdl">PDL</label>
        <textarea id="pdl" rows={16} value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
      </div>

      <div className="panel row">
        <button type="button" onClick={() => void callApi('/api/validate')} disabled={busy || csrfToken.length === 0}>
          Validate
        </button>
        <button type="button" onClick={() => void callApi('/api/compile')} disabled={busy || csrfToken.length === 0}>
          Compile
        </button>
      </div>

      <div className="panel">
        <p>Latest executionId: {executionId || '-'}</p>
        <pre>{result || 'No result yet.'}</pre>
      </div>
    </main>
  );
}
