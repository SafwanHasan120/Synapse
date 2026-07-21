import { redirect }                             from 'next/navigation';
import type { JSX }                             from 'react';
import { getTeamData, getKnowledge, getStats }  from '@/lib/api';
import { Header }                               from '@/components/Header';
import type { KnowledgeItem }                   from '@/lib/api';

function KnowledgeCard({ unit }: { unit: KnowledgeItem }): JSX.Element {
  const authorLabel =
    unit.author_type === 'agent'
      ? (unit.agent_name ?? 'agent')
      : (unit.author_login ?? 'unknown');

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-3">
      <p className="text-sm leading-relaxed text-gray-100">{unit.content}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-400">
          {unit.scope}
        </span>
        <span>
          {unit.author_type === 'agent' ? '🤖' : '👤'} {authorLabel}
        </span>
        {unit.source != null && <span>· {unit.source}</span>}
        {unit.tags.map(tag => (
          <span
            key={tag}
            className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function KnowledgePage(): Promise<JSX.Element> {
  let teamData;
  try {
    teamData = await getTeamData();
  } catch {
    redirect('/');
  }

  const project = teamData.projects[0];

  if (project == null) {
    return (
      <>
        <Header teamName={teamData.team.name} activePath="/knowledge" />
        <main className="mx-auto max-w-5xl px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No projects yet.</p>
        </main>
      </>
    );
  }

  const [knowledge, stats] = await Promise.all([
    getKnowledge(project.id),
    getStats(project.id),
  ]);

  return (
    <>
      <Header teamName={teamData.team.name} activePath="/knowledge" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-lg font-semibold text-white">Knowledge base</h1>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{stats.accepted_count} accepted</span>
            <span>{stats.pending_count} pending review</span>
          </div>
        </div>
        {knowledge.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
            <p className="text-sm text-gray-500">
              No approved context yet. Approve proposals from the review queue.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledge.map(unit => (
              <KnowledgeCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
