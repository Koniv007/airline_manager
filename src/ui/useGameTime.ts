import { useEffect, useState } from "react";
import { useGameState } from "../game/gameStore.ts";
import { clockAt, dayPhase, timeOfDay } from "../simulation/gameClock.ts";

/** Live game time. Refreshes 10x per second so the game minutes visibly run. */
export function useGameTime() {
  const { worldStartMs } = useGameState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);
  const clock = clockAt(worldStartMs, now);
  const time = timeOfDay(worldStartMs, now);
  return { clock, ...time, phase: dayPhase(time.hour) };
}
