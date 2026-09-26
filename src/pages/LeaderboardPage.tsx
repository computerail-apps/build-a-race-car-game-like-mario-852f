import { LeaderboardPanel } from '@/components/LeaderboardPanel';

export function LeaderboardPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-h1">Leaderboard</h1>
        <p className="text-body text-muted-foreground">
          Every real lap time submitted across all tracks and racers, live from Postgres.
        </p>
      </div>
      <LeaderboardPanel limit={100} showFilters />
    </div>
  );
}
