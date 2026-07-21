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
    <div className="card space-y-3">
      <p className="text-body leading-relaxed text-ink">{unit.content}</p>
      <div className="flex flex-wrap items-center gap-2 text-meta text-warm">
        <span className="rounded bg-border px-2 py-0.5 text-warm">
          {unit.scope}
        </span>
        <span>
          {unit.author_type === 'agent' ? '🤖' : '👤'} {authorLabel}
        </span>
        {unit.source != null && <span>· {unit.source}</span>}
        {unit.tags.map(tag => (
          <span
            key={tag}
            className={unit.author_type === 'agent' ? 'tag-agent' : 'tag'}
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
        <main className="mx-auto max-w-content px-page-x py-page-y text-center">
          <p className="text-body text-warm">No projects yet.</p>
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
      <main className="mx-auto max-w-content px-page-x py-page-y">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-section-heading font-serif text-ink">Knowledge base</h1>
          <div className="flex gap-4 text-meta text-muted">
            <span>{stats.accepted_count} accepted</span>
            <span>{stats.pending_count} pending review</span>
          </div>
        </div>
        {knowledge.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="italic text-body text-muted">
              No approved context yet. Approve proposals from the review queue.
            </p>
          </div>
        ) : (
          <div className="space-y-card-gap">
            {knowledge.map(unit => (
              <KnowledgeCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
