import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { Trophy, ArrowUpDown } from 'lucide-react';
import { fetchAllResults } from '@/lib/races';

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

type SortKey = 'lap_time_ms' | 'player_name' | 'track' | 'car';

export function LeaderboardPage() {
  const [sortKey, setSortKey] = useState<SortKey>('lap_time_ms');
  const [trackFilter, setTrackFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['race_results', 'all'],
    queryFn: fetchAllResults,
  });

  const tracks = useMemo(() => {
    const set = new Set((data ?? []).map((r) => r.track));
    return Array.from(set);
  }, [data]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (trackFilter !== 'all') list = list.filter((r) => r.track === trackFilter);
    return [...list].sort((a, b) => {
      if (sortKey === 'lap_time_ms') return a.lap_time_ms - b.lap_time_ms;
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
  }, [data, sortKey, trackFilter]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-h1 text-foreground">Leaderboard</h1>
        <p className="text-body text-muted-foreground">Every submitted lap time across every player and track.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={trackFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setTrackFilter('all')}>
          All tracks
        </Button>
        {tracks.map((t) => (
          <Button key={t} size="sm" variant={trackFilter === t ? 'secondary' : 'ghost'} onClick={() => setTrackFilter(t)}>
            {t}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSortKey('lap_time_ms')}>
            <ArrowUpDown size={14} />
            Fastest
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSortKey('player_name')}>
            Player
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSortKey('track')}>
            Track
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={18} className="text-warning" />
            All results
          </CardTitle>
          <CardDescription>{rows.length} lap{rows.length === 1 ? '' : 's'} recorded</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12">
              <CenteredSpinner label="Loading results" />
            </div>
          ) : error ? (
            <div className="px-6 pb-6">
              <Alert variant="destructive">
                <AlertTitle>Couldn't load results</AlertTitle>
                <AlertDescription>{(error as Error).message}</AlertDescription>
              </Alert>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={<Trophy size={20} />}
                title="No results yet"
                description="Be the first to post a lap time from the race screen."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-micro text-muted-foreground">
                    <th className="px-6 py-2 font-normal">#</th>
                    <th className="px-6 py-2 font-normal">Player</th>
                    <th className="px-6 py-2 font-normal">Track</th>
                    <th className="px-6 py-2 font-normal">Car</th>
                    <th className="px-6 py-2 font-normal">Laps</th>
                    <th className="px-6 py-2 text-right font-normal">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td className="px-6 py-3 text-small font-mono tabular-nums text-muted-foreground">{i + 1}</td>
                      <td className="px-6 py-3 text-body">{r.player_name}</td>
                      <td className="px-6 py-3 text-small text-muted-foreground">{r.track}</td>
                      <td className="px-6 py-3">
                        <Badge variant="outline">{r.car}</Badge>
                      </td>
                      <td className="px-6 py-3 text-small tabular-nums text-muted-foreground">{r.laps}</td>
                      <td className="px-6 py-3 text-right font-mono text-small tabular-nums">{formatMs(r.lap_time_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
