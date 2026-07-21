import { redirect }              from 'next/navigation';
import type { JSX }              from 'react';
import { getTeamData, getQueue } from '@/lib/api';
import { Header }                from '@/components/Header';
import { ReviewCard }            from '@/components/ReviewCard';

export default async function QueuePage(): Promise<JSX.Element> {
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
        <Header teamName={teamData.team.name} activePath="/queue" />
        <main className="mx-auto max-w-content px-page-x py-page-y text-center">
          <p className="text-body text-warm">
            No projects yet. Create one via the API first.
          </p>
        </main>
      </>
    );
  }

  const queue = await getQueue(project.id);

  return (
    <>
      <Header teamName={teamData.team.name} activePath="/queue" />
      <main className="mx-auto max-w-content px-page-x py-page-y">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-section-heading font-serif text-ink">Review queue</h1>
          <span className="text-meta text-muted">{queue.length} pending</span>
        </div>
        {queue.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="italic text-body text-muted">
              All caught up. No proposals awaiting review.
            </p>
          </div>
        ) : (
          <div className="space-y-card-gap">
            {queue.map(unit => (
              <ReviewCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
