import Link        from 'next/link';
import type { JSX } from 'react';

interface HeaderProps {
  teamName:   string;
  activePath: '/queue' | '/knowledge';
}

export function Header({ teamName, activePath }: HeaderProps): JSX.Element {
  return (
    <header className="border-b border-border bg-cream px-page-x py-4">
      <div className="mx-auto flex max-w-content items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-logo font-serif text-rust">Synapse</span>
          <nav className="flex gap-1">
            <Link
              href="/queue"
              className={`px-3 py-1.5 text-ui transition-colors ${
                activePath === '/queue'
                  ? 'border-b-2 border-rust text-rust'
                  : 'text-warm hover:text-ink'
              }`}
            >
              Review queue
            </Link>
            <Link
              href="/knowledge"
              className={`px-3 py-1.5 text-ui transition-colors ${
                activePath === '/knowledge'
                  ? 'border-b-2 border-rust text-rust'
                  : 'text-warm hover:text-ink'
              }`}
            >
              Knowledge base
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-meta text-muted">{teamName}</span>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-meta text-muted transition-colors hover:text-warm"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
