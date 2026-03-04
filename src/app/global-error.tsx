'use client';
import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>Global Error</h2>
          <p>{error.message}</p>
          <pre style={{ background: '#f5f5f5', padding: '16px', overflow: 'auto', maxHeight: '400px', fontSize: '12px' }}>
            {error.stack}
          </pre>
          <button onClick={reset} style={{ padding: '8px 16px', cursor: 'pointer' }}>Try Again</button>
        </div>
      </body>
    </html>
  );
}
