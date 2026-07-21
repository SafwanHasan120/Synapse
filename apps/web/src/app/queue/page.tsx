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
        <main className="mx-auto max-w-5xl px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
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
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-lg font-semibold text-white">Review queue</h1>
          <span className="text-sm text-gray-500">{queue.length} pending</span>
        </div>
        {queue.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
            <p className="text-sm text-gray-500">
              All caught up. No proposals awaiting review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map(unit => (
              <ReviewCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
