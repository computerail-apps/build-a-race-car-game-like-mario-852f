import type { RaceSelection } from '@/App';
import { RaceGame } from '@/components/RaceGame';

export function RacePage({ selection, onExit }: { selection: RaceSelection; onExit: () => void }) {
  return <RaceGame selection={selection} onExit={onExit} />;
}
