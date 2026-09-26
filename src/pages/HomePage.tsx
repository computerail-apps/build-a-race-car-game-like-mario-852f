import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Badge } from '@/lib/ui/Badge';
import { Zap, Gauge, Shield, Flag } from 'lucide-react';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import type { RaceSelection } from '@/App';
import { cn } from '@/lib/cn';

const CARS = [
  { name: 'Blaze', color: 'bg-destructive', speed: 8, accel: 6, handling: 7, desc: 'Balanced flame-red racer with strong top speed.' },
  { name: 'Volt', color: 'bg-primary', speed: 6, accel: 9, handling: 8, desc: 'Electric quick-starter, best off the line.' },
  { name: 'Titan', color: 'bg-warning', speed: 9, accel: 5, handling: 5, desc: 'Heavyweight bruiser — brutal top end, clumsy turns.' },
  { name: 'Nimbus', color: 'bg-success', speed: 7, accel: 7, handling: 9, desc: 'Featherweight glider with razor-sharp handling.' },
];

const TRACKS = [
  { name: 'Sunset Speedway', laps: 3, difficulty: 'Easy', desc: 'Wide sweeping curves along a coastal cliff at dusk.' },
  { name: 'Neon Tunnel', laps: 3, difficulty: 'Medium', desc: 'Tight chicanes through a glowing underground circuit.' },
  { name: 'Frost Summit', laps: 3, difficulty: 'Hard', desc: 'Icy hairpins up a snowbound mountain pass.' },
];

export function HomePage({ onRace }: { onRace: (sel: RaceSelection) => void }) {
  const [car, setCar] = useState(CARS[0].name);
  const [track, setTrack] = useState(TRACKS[0].name);

  return (
    <div className="space-y-12">
      <section className="space-y-4 pt-4">
        <h1 className="text-display">Pick your kart. Set the pace.</h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          Choose a car and a track, then race three laps against the clock. Every finish posts a real lap
          time to the shared leaderboard — no fakes, just you against the field.
        </p>
        <Button size="lg" onClick={() => onRace({ car, track })}>
          <Flag size={16} />
          Race now
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Choose your kart</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARS.map((c) => (
            <Card
              key={c.name}
              className={cn(
                'cursor-pointer transition-all duration-150 ease-out hover:shadow-elev-3',
                car === c.name && 'ring-2 ring-primary'
              )}
              onClick={() => setCar(c.name)}
            >
              <CardHeader>
                <div className={cn('mb-3 h-2 w-full rounded-full', c.color)} />
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Stat icon={<Gauge size={14} />} label="Speed" value={c.speed} />
                <Stat icon={<Zap size={14} />} label="Accel" value={c.accel} />
                <Stat icon={<Shield size={14} />} label="Handling" value={c.handling} />
              </CardContent>
              <CardFooter>
                {car === c.name ? <Badge variant="success">Selected</Badge> : <Badge variant="outline">Select</Badge>}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-h2">Choose your track</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRACKS.map((t) => (
            <Card
              key={t.name}
              className={cn(
                'cursor-pointer transition-all duration-150 ease-out hover:shadow-elev-3',
                track === t.name && 'ring-2 ring-primary'
              )}
              onClick={() => setTrack(t.name)}
            >
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant={t.difficulty === 'Easy' ? 'success' : t.difficulty === 'Medium' ? 'warning' : 'destructive'}>
                  {t.difficulty}
                </Badge>
                <span className="text-small text-muted-foreground">{t.laps} laps</span>
              </CardContent>
              <CardFooter>
                {track === t.name ? <Badge variant="success">Selected</Badge> : <Badge variant="outline">Select</Badge>}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-h2">Top 10 leaderboard</h2>
        </div>
        <LeaderboardPanel limit={10} />
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-16 text-small text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}
