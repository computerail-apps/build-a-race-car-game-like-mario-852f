import { useState } from 'react';
import { Nav } from '@/lib/ui/Nav';
import { Container } from '@/lib/ui/Container';
import { Button } from '@/lib/ui/Button';
import { Flag, Trophy, Home } from 'lucide-react';
import { HomePage } from '@/pages/HomePage';
import { RacePage } from '@/pages/RacePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';

type Route = '/' | '/race' | '/leaderboard';

export interface RaceSelection {
  car: string;
  track: string;
}

export default function App() {
  const [route, setRoute] = useState<Route>('/');
  const [selection, setSelection] = useState<RaceSelection>({ car: 'Blaze', track: 'Sunset Speedway' });

  const goRace = (sel: RaceSelection) => {
    setSelection(sel);
    setRoute('/race');
  };

  return (
    <div className="min-h-screen">
      <Nav
        brand={
          <span className="flex items-center gap-2">
            <Flag size={20} className="text-primary" />
            KartDash
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant={route === '/' ? 'secondary' : 'ghost'} size="sm" onClick={() => setRoute('/')}>
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button variant={route === '/leaderboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setRoute('/leaderboard')}>
              <Trophy size={16} />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          </div>
        }
      />
      <main className={route === '/race' ? '' : 'py-8'}>
        {route === '/race' ? (
          <Container>
            <RacePage selection={selection} onExit={() => setRoute('/')} />
          </Container>
        ) : route === '/leaderboard' ? (
          <Container>
            <LeaderboardPage />
          </Container>
        ) : (
          <Container>
            <HomePage onRace={goRace} />
          </Container>
        )}
      </main>
    </div>
  );
}
