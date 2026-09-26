import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { Trophy, ArrowUpDown } from 'lucide-react';

interface RaceResult {
  id: string;
  player_name: string;
  track: string;
  car: string;
  lap_time_ms: number;
  laps: number;
  created_at: string;
}

const MOCK_RESULTS: RaceResult[] = [
  { id: '1', player_name: 'SpeedyGonzo', track: 'Neon Tunnel', car: 'Volt', lap_time_ms: 74210, laps: 3, created_at: '2024-05-01T12:00:00Z' },
  { id: '2', player_name: 'DriftKing', track: 'Sunset Speedway', car: 'Blaze', lap_time_ms: 68540, laps: 3, created_at: '2024-05-02T09:15:00Z' },
  { id: '3', player_name: 'IcyVeronica', track: 'Frost Summit', car: 'Nimbus', lap_time_ms: 91032, laps: 3, created_at: '2024-05-02T18:40:00Z' },
  { id: '4', player_name: 'TitanTom', track: 'Sunset Speedway', car: 'Titan', lap_time_ms: 71890, laps: 3, created_at: '2024-05-03T08:05:00Z' },
  { id: '5', player_name: 'ZoomZoe', track: 'Neon Tunnel', car: 'Nimbus', lap_time_ms: 76310, laps: 3, created_at: '2024-05-03T14:22:00Z' },
  { id: '6', player_name: 'DriftKing', track: 'Frost Summit', car: 'Blaze', lap_time_ms: 88450, laps: 3, created_at: '2024-05-04T11:10:00Z' },
  { id: '7', player_name: 'NightRider', track: 'Sunset Speedway', car: 'Volt', lap_time_ms: 69990, laps: 3, created_at: '2024-05-04T20:00:00Z' },
  { id: '8', player_name: 'PixelPete', track: 'Neon Tunnel', car: 'Titan', lap_time_ms: 79870, laps: 3, created_at: '2024-05-05T07:30:00Z' },
  { id: '9', player_name: 'SpeedyGonzo', track: 'Frost Summit', car: 'Volt', lap_time_ms: 85120, laps: 3, created_at: '2024-05-05T16:45:00Z' },
  { id: '10', player_name: 'RookieRae', track: 'Sunset Speedway', car: 'Nimbus', lap_time_ms: 73450, laps: 3, created_at: '2024-05-06T10:12:00Z' },
  { id: '11', player_name: 'ZoomZoe', track: 'Frost Summit', car: 'Blaze', lap_time_ms: 90210, laps: 3, created_at: '2024-05-06T19:05:00Z' },
  { id: '12', player_name: 'DriftKing', track: 'Neon Tunnel', car: 'Volt', lap_time_ms: 72100, laps: 3, created_at: '2024-05-07T13:33:00Z' },
];

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

const TRACK_OPTIONS = ['All tracks', 'Sunset Speedway', 'Neon Tunnel', 'Frost Summit'];

export function LeaderboardPanel({ limit = 10, showFilters = false }: { limit?: number; showFilters?: boolean }) {
  const [trackFilter, setTrackFilter] = useState('All tracks');

  const { data, isLoading, error, refetch } = useAppData<RaceResult[]>({
    key: 'race_results',
    mock: MOCK_RESULTS,
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const scoped = trackFilter === 'All tracks' ? rows : rows.filter((r) => r.track === trackFilter);
    return [...scoped].sort((a, b) => a.lap_time_ms - b.lap_time_ms).slice(0, limit);
  }, [data, trackFilter, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={18} className="text-warning" />
            Leaderboard
          </CardTitle>
          <CardDescription>Fastest single-lap times, live from the shared track.</CardDescription>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            {TRACK_OPTIONS.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={trackFilter === t ? 'secondary' : 'ghost'}
                onClick={() => setTrackFilter(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12">
            <CenteredSpinner label="Loading leaderboard" />
          </div>
        ) : error ? (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTitle>Couldn't load leaderboard</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{(error as Error).message}</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<ArrowUpDown size={20} />}
              title="No lap times yet"
              description="Finish a race to put your name on the board."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r, i) => (
              <li key={r.id} className="flex items-center gap-4 px-6 py-3">
                <span className={"w-6 text-small tabular-nums " + (i < 3 ? 'text-warning font-semibold' : 'text-muted-foreground')}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-body">{r.player_name}</span>
                <Badge variant="outline">{r.car}</Badge>
                <span className="hidden text-small text-muted-foreground sm:inline">{r.track}</span>
                <span className="font-mono text-small tabular-nums text-foreground">{formatMs(r.lap_time_ms)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
