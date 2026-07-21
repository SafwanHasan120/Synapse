import Link        from 'next/link';
import type { JSX } from 'react';

interface HeaderProps {
  teamName:   string;
  activePath: '/queue' | '/knowledge';
}

export function Header({ teamName, activePath }: HeaderProps): JSX.Element {
  return (
    <header className="border-b border-gray-800 bg-gray-950 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold text-white">Synapse</span>
          <nav className="flex gap-1">
            <Link
              href="/queue"
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                activePath === '/queue'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Review queue
            </Link>
            <Link
              href="/knowledge"
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                activePath === '/knowledge'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Knowledge base
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{teamName}</span>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-xs text-gray-500 transition-colors hover:text-gray-300"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
