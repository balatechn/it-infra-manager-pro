'use client';
import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2">Digest: {error.digest}</p>
          )}
        </div>
        <pre className="text-xs bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-60 mb-4">
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
