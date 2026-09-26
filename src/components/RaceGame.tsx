import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/lib/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Input } from '@/lib/ui/Input';
import { Badge } from '@/lib/ui/Badge';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Flag, Gauge, Timer, RotateCcw, Home, Trophy } from 'lucide-react';
import type { RaceSelection } from '@/App';
import { submitResult } from '@/lib/races';
import type { Session } from '@supabase/supabase-js';

const TOTAL_LAPS = 3;
const TRACK_COLORS: Record<string, string> = {
  'Sunset Speedway': '#e8935a',
  'Neon Tunnel': '#7c5cff',
  'Frost Summit': '#7ecbe0',
};

interface CarPhysics {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

type Phase = 'countdown' | 'racing' | 'finished';

function buildCheckpoints(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.36;
  const ry = h * 0.32;
  const pts: { x: number; y: number }[] = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

export function RaceGame({
  selection,
  onExit,
  session,
}: {
  selection: RaceSelection;
  onExit: () => void;
  session: Session | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [lap, setLap] = useState(1);
  const [speedDisplay, setSpeedDisplay] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState(
    session?.user?.email ? session.user.email.split('@')[0] : ''
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetTick, setResetTick] = useState(0);

  const qc = useQueryClient();

  const stateRef = useRef({
    keys: {} as Record<string, boolean>,
    car: { x: 0, y: 0, angle: -Math.PI / 2, speed: 0 } as CarPhysics,
    checkpointIdx: 0,
    lapsDone: 0,
    startTime: 0,
    boostUntil: 0,
    lastTs: 0,
    finished: false,
  });

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('racing');
      stateRef.current.startTime = performance.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const trackColor = TRACK_COLORS[selection.track] ?? '#7c5cff';
    const cps0 = buildCheckpoints(canvas.width, canvas.height);
    stateRef.current.car.x = cps0[0].x;
    stateRef.current.car.y = cps0[0].y + 40;
    stateRef.current.car.angle = -Math.PI / 2;

    const boostPads = [4, 9, 13];

    const loop = (ts: number) => {
      const st = stateRef.current;
      const dt = st.lastTs ? Math.min((ts - st.lastTs) / 1000, 0.05) : 0.016;
      st.lastTs = ts;

      const w = canvas.width;
      const h = canvas.height;
      const cps = buildCheckpoints(w, h);

      if (phase === 'racing' && !st.finished) {
        const keys = st.keys;
        const accel = keys['arrowup'] || keys['w'] ? 1 : 0;
        const brake = keys['arrowdown'] || keys['s'] ? 1 : 0;
        const left = keys['arrowleft'] || keys['a'] ? 1 : 0;
        const right = keys['arrowright'] || keys['d'] ? 1 : 0;

        const boosted = ts < st.boostUntil;
        const maxSpeed = boosted ? 620 : 380;
        const accelRate = 260;
        const brakeRate = 340;
        const friction = 120;

        if (accel) st.car.speed = Math.min(maxSpeed, st.car.speed + accelRate * dt);
        else if (brake) st.car.speed = Math.max(-160, st.car.speed - brakeRate * dt);
        else {
          if (st.car.speed > 0) st.car.speed = Math.max(0, st.car.speed - friction * dt);
          else if (st.car.speed < 0) st.car.speed = Math.min(0, st.car.speed + friction * dt);
        }

        const turnRate = 2.4 * Math.min(1, Math.abs(st.car.speed) / 200 + 0.3);
        if (left) st.car.angle -= turnRate * dt;
        if (right) st.car.angle += turnRate * dt;

        st.car.x += Math.cos(st.car.angle) * st.car.speed * dt;
        st.car.y += Math.sin(st.car.angle) * st.car.speed * dt;

        const target = cps[st.checkpointIdx];
        const dx = target.x - st.car.x;
        const dy = target.y - st.car.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 55) {
          if (boostPads.includes(st.checkpointIdx)) {
            st.boostUntil = ts + 900;
          }
          st.checkpointIdx = (st.checkpointIdx + 1) % cps.length;
          if (st.checkpointIdx === 0) {
            st.lapsDone += 1;
            setLap(Math.min(TOTAL_LAPS, st.lapsDone + 1));
            if (st.lapsDone >= TOTAL_LAPS) {
              st.finished = true;
              const total = performance.now() - st.startTime;
              setFinalTimeMs(Math.round(total));
              setPhase('finished');
            }
          }
        }

        setSpeedDisplay(Math.round(Math.abs(st.car.speed)));
        setElapsedMs(performance.now() - st.startTime);
      }

      ctx.fillStyle = '#0b0d12';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2, rx = w * 0.36, ry = h * 0.32;
      ctx.save();
      ctx.strokeStyle = '#1c2030';
      ctx.lineWidth = 90;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      boostPads.forEach((idx) => {
        const p = cps[idx];
        ctx.fillStyle = 'rgba(124,92,255,0.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.fill();
      });

      const startP = cps[0];
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(startP.x - 3, startP.y - 46, 6, 92);

      ctx.save();
      ctx.translate(st.car.x, st.car.y);
      ctx.rotate(st.car.angle);
      const boostedRender = ts < st.boostUntil;
      ctx.fillStyle = boostedRender ? '#ffd166' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-12, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selection.track, resetTick]);

  const handleSubmit = useCallback(async () => {
    if (!playerName.trim() || finalTimeMs == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitResult({
        player_name: playerName.trim(),
        track: selection.track,
        car: selection.car,
        lap_time_ms: finalTimeMs,
        laps: TOTAL_LAPS,
      });
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['race_results'] });
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [playerName, finalTimeMs, qc, selection]);

  const formatMs = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  const restart = () => {
    setPhase('countdown');
    setCountdown(3);
    setLap(1);
    setElapsedMs(0);
    setFinalTimeMs(null);
    setSubmitted(false);
    setSubmitError(null);
    stateRef.current = {
      keys: {},
      car: { x: 0, y: 0, angle: -Math.PI / 2, speed: 0 },
      checkpointIdx: 0,
      lapsDone: 0,
      startTime: 0,
      boostUntil: 0,
      lastTs: 0,
      finished: false,
    };
    setResetTick((t) => t + 1);
  };

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-border bg-surface shadow-elev-3">
        <canvas ref={canvasRef} className="h-full w-full" />

        {phase !== 'finished' && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-surface/80 backdrop-blur">{selection.car}</Badge>
              <Badge variant="outline" className="bg-surface/80 backdrop-blur">{selection.track}</Badge>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 rounded-md bg-surface/80 px-3 py-1.5 backdrop-blur">
                <Timer size={14} className="text-muted-foreground" />
                <span className="font-mono text-small tabular-nums">{formatMs(elapsedMs)}</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-surface/80 px-3 py-1.5 backdrop-blur">
                <Flag size={14} className="text-muted-foreground" />
                <span className="text-small tabular-nums">Lap {lap}/{TOTAL_LAPS}</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-surface/80 px-3 py-1.5 backdrop-blur">
                <Gauge size={14} className="text-muted-foreground" />
                <span className="font-mono text-small tabular-nums">{speedDisplay} u/s</span>
              </div>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
            <span className="text-display text-foreground">{countdown > 0 ? countdown : 'GO!'}</span>
          </div>
        )}

        {phase !== 'finished' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
            <p className="text-center text-micro text-muted-foreground">
              Arrow keys / WASD to drive &middot; purple rings are boost pads
            </p>
          </div>
        )}

        {phase === 'finished' && finalTimeMs != null && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-elev-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy size={18} className="text-warning" />
                  Race complete
                </CardTitle>
                <CardDescription>
                  {selection.car} on {selection.track} &middot; {TOTAL_LAPS} laps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <div className="text-micro text-muted-foreground">Final time</div>
                  <div className="font-mono text-h1 tabular-nums">{formatMs(finalTimeMs)}</div>
                </div>
                {!submitted ? (
                  <div className="space-y-2">
                    <label className="text-small text-muted-foreground">
                      {session ? 'Confirm the name to post this time' : 'Enter your name to post this time'}
                    </label>
                    <Input
                      placeholder="Player name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={submitting}
                    />
                    {submitError && (
                      <Alert variant="destructive">
                        <AlertTitle>Couldn't submit</AlertTitle>
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert variant="default">
                    <AlertTitle>Time posted</AlertTitle>
                    <AlertDescription>Your lap has been added to the leaderboard.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {!submitted && (
                  <Button onClick={handleSubmit} disabled={!playerName.trim() || submitting}>
                    {submitting ? 'Submitting...' : 'Submit time'}
                  </Button>
                )}
                <Button variant="outline" onClick={onExit}>
                  <Home size={16} />
                  Back to garage
                </Button>
                <Button variant="ghost" onClick={restart}>
                  <RotateCcw size={16} />
                  Race again
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
