import { supabase } from '@/lib/supabase';

// Logical "race_results" table -> real physical Supabase table name.
export const RACE_RESULTS_TABLE = 'build_a_race_car_gam_race_results';

export interface RaceResult {
  id: string;
  player_name: string;
  track: string;
  car: string;
  lap_time_ms: number;
  laps: number;
  created_at: string;
}

export async function fetchTopResults(limit = 10): Promise<RaceResult[]> {
  const { data, error } = await supabase
    .from(RACE_RESULTS_TABLE)
    .select('id,player_name,track,car,lap_time_ms,laps,created_at')
    .order('lap_time_ms', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RaceResult[];
}

export async function fetchAllResults(): Promise<RaceResult[]> {
  const { data, error } = await supabase
    .from(RACE_RESULTS_TABLE)
    .select('id,player_name,track,car,lap_time_ms,laps,created_at')
    .order('lap_time_ms', { ascending: true })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as RaceResult[];
}

export async function submitResult(entry: {
  player_name: string;
  track: string;
  car: string;
  lap_time_ms: number;
  laps: number;
}): Promise<void> {
  const { error } = await supabase.from(RACE_RESULTS_TABLE).insert(entry);
  if (error) throw error;
}
