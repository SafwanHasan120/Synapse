'use client';

import { useState, useTransition } from 'react';
import type { JSX }                from 'react';
import { reviewContextUnit }       from '@/app/actions';
import type { QueueItem }          from '@/lib/api';

export function ReviewCard({ unit }: { unit: QueueItem }): JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [done, setDone]              = useState(false);
  const [error, setError]            = useState<string | null>(null);

  function handle(action: 'approved' | 'rejected'): void {
    startTransition(async () => {
      const result = await reviewContextUnit(unit.id, action);
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error ?? 'Something went wrong');
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 opacity-40">
        <p className="text-sm text-gray-500">Reviewed ✓</p>
      </div>
    );
  }

  const authorLabel =
    unit.author_type === 'agent'
      ? (unit.agent_name ?? 'agent')
      : (unit.author_login ?? 'unknown');

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="flex-1 text-sm leading-relaxed text-gray-100">{unit.content}</p>
        <span className="shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
          {unit.scope}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>
          {unit.author_type === 'agent' ? '🤖' : '👤'} {authorLabel}
        </span>
        {unit.source != null && <span>· {unit.source}</span>}
        <span>· {new Date(unit.created_at).toLocaleDateString()}</span>
        {unit.tags.map(tag => (
          <span
            key={tag}
            className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {error != null && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handle('approved')}
          disabled={isPending}
          className="rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => handle('rejected')}
          disabled={isPending}
          className="rounded-md bg-gray-800 px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
