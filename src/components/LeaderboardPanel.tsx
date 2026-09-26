import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { Trophy } from 'lucide-react';
import { fetchTopResults } from '@/lib/races';

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

const medalColor = ['text-warning', 'text-muted-foreground', 'text-primary'];

export function LeaderboardPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['race_results', 'top10'],
    queryFn: () => fetchTopResults(10),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={18} className="text-warning" />
          Top 10
        </CardTitle>
        <CardDescription>Fastest lap times across all tracks and cars.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-10">
            <CenteredSpinner label="Loading leaderboard" />
          </div>
        ) : error ? (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTitle>Couldn't load leaderboard</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<Trophy size={20} />}
              title="No lap times yet"
              description="Race a track and submit your time to claim the top spot."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 px-6 py-3">
                <span className={`w-5 text-small font-mono tabular-nums ${medalColor[i] ?? 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-body">{r.player_name}</div>
                  <div className="truncate text-micro text-muted-foreground">
                    {r.car} &middot; {r.track}
                  </div>
                </div>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {formatMs(r.lap_time_ms)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
