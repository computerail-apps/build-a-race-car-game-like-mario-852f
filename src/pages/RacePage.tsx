import { useState } from 'react';
import { Button } from '@/lib/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Input } from '@/lib/ui/Input';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Mail, Home } from 'lucide-react';
import type { RaceSelection } from '@/App';
import { RaceGame } from '@/components/RaceGame';
import { useSession, sendMagicLink } from '@/lib/auth';

export function RacePage({ selection, onExit }: { selection: RaceSelection; onExit: () => void }) {
  const { session, loading } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipAuth, setSkipAuth] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <CenteredSpinner label="Checking session" />;
  }

  if (!session && !skipAuth) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to race</CardTitle>
            <CardDescription>
              We'll send a magic link so your lap times are attributed to a real player name on the shared leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sent ? (
              <Alert variant="default">
                <AlertTitle>Check your inbox</AlertTitle>
                <AlertDescription>
                  We sent a sign-in link to {email}. Open it on this device to continue, or just race as a guest below.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <label className="text-small text-muted-foreground">Email address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Couldn't send link</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {!sent && (
              <Button onClick={handleSendLink} disabled={!email.trim() || sending}>
                <Mail size={16} />
                {sending ? 'Sending...' : 'Send magic link'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSkipAuth(true)}>
              Race as guest
            </Button>
            <Button variant="ghost" onClick={onExit}>
              <Home size={16} />
              Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <RaceGame selection={selection} onExit={onExit} session={session} />;
}
