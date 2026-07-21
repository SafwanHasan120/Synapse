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
      <div className="card opacity-60">
        <p className="italic text-meta text-muted">Reviewed ✓</p>
      </div>
    );
  }

  const authorLabel =
    unit.author_type === 'agent'
      ? (unit.agent_name ?? 'agent')
      : (unit.author_login ?? 'unknown');

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="flex-1 text-body leading-relaxed text-ink">{unit.content}</p>
        <span className="shrink-0 rounded-full bg-border px-3 py-1 text-meta text-warm">
          {unit.scope}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-meta text-warm">
        <span>
          {unit.author_type === 'agent' ? '🤖' : '👤'} {authorLabel}
        </span>
        {unit.source != null && <span>· {unit.source}</span>}
        <span>· {new Date(unit.created_at).toLocaleDateString()}</span>
        {unit.tags.map(tag => (
          <span
            key={tag}
            className={unit.author_type === 'agent' ? 'tag-agent' : 'tag'}
          >
            {tag}
          </span>
        ))}
      </div>

      {error != null && (
        <p className="text-meta text-rust">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handle('approved')}
          disabled={isPending}
          className="btn-approve"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => handle('rejected')}
          disabled={isPending}
          className="btn-reject"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
