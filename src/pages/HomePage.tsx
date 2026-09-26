import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Badge } from '@/lib/ui/Badge';
import { Flag, Zap, Play } from 'lucide-react';
import type { RaceSelection } from '@/App';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';

const CARS = [
  { name: 'Blaze', desc: 'Balanced all-rounder with steady grip.', stat: 'Speed 7 / Grip 7 / Boost 6' },
  { name: 'Volt', desc: 'Featherweight speedster, twitchy handling.', stat: 'Speed 9 / Grip 5 / Boost 7' },
  { name: 'Titan', desc: 'Heavy chassis, hits boosts hardest.', stat: 'Speed 6 / Grip 8 / Boost 9' },
];

const TRACKS = [
  { name: 'Sunset Speedway', desc: 'Wide sweeping curves through golden dunes.', color: 'bg-[#e8935a]' },
  { name: 'Neon Tunnel', desc: 'Tight underground loop lit by violet neon.', color: 'bg-[#7c5cff]' },
  { name: 'Frost Summit', desc: 'Icy switchbacks with high-speed straights.', color: 'bg-[#7ecbe0]' },
];

export function HomePage({ onRace }: { onRace: (sel: RaceSelection) => void }) {
  const [car, setCar] = useState(CARS[0].name);
  const [track, setTrack] = useState(TRACKS[0].name);

  return (
    <div className="space-y-10">
      <section className="space-y-3 py-4">
        <h1 className="text-display text-foreground">Pick your kart. Set the pace.</h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          Choose a car and a track, race three laps against the clock with real-time arcade physics, and post your
          time to the live shared leaderboard the moment you cross the line.
        </p>
        <Button size="lg" onClick={() => onRace({ car, track })}>
          <Play size={16} />
          Race now
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section className="space-y-3">
            <h2 className="text-h2 text-foreground">Choose your kart</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CARS.map((c) => (
                <Card
                  key={c.name}
                  className={`cursor-pointer transition-colors duration-150 ${car === c.name ? 'border-primary' : ''}`}
                  onClick={() => setCar(c.name)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {c.name}
                      {car === c.name && <Badge variant="default">Selected</Badge>}
                    </CardTitle>
                    <CardDescription>{c.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
                      <Zap size={12} />
                      {c.stat}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-foreground">Choose your track</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TRACKS.map((t) => (
                <Card
                  key={t.name}
                  className={`cursor-pointer transition-colors duration-150 ${track === t.name ? 'border-primary' : ''}`}
                  onClick={() => setTrack(t.name)}
                >
                  <CardHeader>
                    <div className={`mb-2 h-2 w-10 rounded-full ${t.color}`} />
                    <CardTitle className="flex items-center justify-between">
                      {t.name}
                      {track === t.name && <Badge variant="default">Selected</Badge>}
                    </CardTitle>
                    <CardDescription>{t.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag size={18} />
                Ready to go
              </CardTitle>
              <CardDescription>
                {car} on {track} &middot; 3 laps &middot; arrow keys or WASD
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => onRace({ car, track })}>
                <Play size={16} />
                Start race
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="lg:col-span-4">
          <LeaderboardPanel />
        </aside>
      </div>
    </div>
  );
}
