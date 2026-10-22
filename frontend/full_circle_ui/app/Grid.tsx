"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { t } from "@/lib/copy";
import { CARDS } from "@/lib/cards";
import { COVER_SPECS } from "@/lib/cover-specs";
import { DATA } from "@/lib/data";
import { assignArtists, GRID, layoutTiles, MOVE_KEYS, moveFocus, tilesInRadius, waveDelays, type MoveKey, type Rect } from "@/lib/grid";
import type { Lang } from "@/lib/host/lang";
import Links from "./Links";

// CARDS is built from our own specs, with names escaped in coverSvg, so inserting it as markup is safe.
const SEEDS = DATA.seeds.length;
const LINES = ["line1", "line2", "line3", "line4", "line5"] as const;
// Four changes by 4.8 s: nothing updates by itself for more than 5 s (WCAG 2.2.2).
const STATUS_STEP_MS = 1200;
const WAVE_START_MS = 350;

const subscribeSize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
const sizeKey = () => `${window.innerWidth}x${window.innerHeight}`;
const serverSize = () => "0x0";

function Status({ lang, calm }: { lang: Lang; calm: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (calm) return;
    const timers = [1, 2, 3, 4].map((i) => window.setTimeout(() => setStep(i), i * STATUS_STEP_MS));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [calm]);
  const shown = calm ? LINES.length - 1 : step;
  const last = shown === LINES.length - 1;
  return (
    <p className="flex items-center gap-2 text-ink-dim">
      <span aria-hidden="true" className="status-dot h-2 w-2 rounded-full bg-accent-text" />
      <span>
        {t(lang, LINES[shown])}
        {last ? "" : "..."}
      </span>
    </p>
  );
}

export default function Grid({ lang, calm, onPick }: { lang: Lang; calm: boolean; onPick: (seedIndex: number) => void }) {
  const [width, height] = useSyncExternalStore(subscribeSize, sizeKey, serverSize).split("x").map(Number);
  const tiles = useMemo(() => (width > 0 && height > 0 ? layoutTiles(width, height) : []), [width, height]);
  const reserved = useMemo<Rect[]>(
    () => [
      { x: width / 2 - 280, y: height / 2 - 150, w: 560, h: 300 },
      { x: 0, y: height - 100, w: width, h: 100 },
    ],
    [width, height],
  );
  const artistOf = useMemo(() => assignArtists(tiles, COVER_SPECS.length, SEEDS, reserved), [tiles, reserved]);
  const firstSeedTile = artistOf.indexOf(0);

  const [active, setActive] = useState<number | null>(null);
  const [caption, setCaption] = useState<number | null>(null);
  const els = useRef(new Map<number, HTMLButtonElement>());
  const timers = useRef(new Map<number, number>());
  const waveTimers = useRef<number[]>([]);
  const pinned = useRef<number | null>(null);
  const waving = useRef(false);
  const played = useRef(false);
  const lastSweep = useRef(0);

  const setFlipped = useCallback((id: number, on: boolean) => {
    const el = els.current.get(id);
    if (!el) return;
    if (on) el.setAttribute("data-flipped", "");
    else el.removeAttribute("data-flipped");
  }, []);

  const hold = useCallback(
    (id: number) => {
      const timer = timers.current.get(id);
      if (timer !== undefined) window.clearTimeout(timer);
      timers.current.delete(id);
      setFlipped(id, true);
    },
    [setFlipped],
  );

  const release = useCallback(
    (id: number) => {
      if (timers.current.has(id)) return;
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id);
          if (pinned.current !== id) setFlipped(id, false);
        }, GRID.flipBackMs),
      );
    },
    [setFlipped],
  );

  const ripple = useCallback(() => {
    if (calm || waving.current || tiles.length === 0) return;
    waving.current = true;
    const delays = waveDelays(tiles, width, height, GRID.waveSpreadMs);
    const pass = GRID.waveSpreadMs + GRID.flipMs;
    for (const tile of tiles) {
      const el = els.current.get(tile.id);
      if (el) el.style.transitionDelay = `${delays[tile.id]}ms`;
      setFlipped(tile.id, true);
    }
    waveTimers.current = [
      window.setTimeout(() => {
        for (const tile of tiles) if (pinned.current !== tile.id) setFlipped(tile.id, false);
      }, pass + GRID.waveHoldMs),
      window.setTimeout(
        () => {
          for (const tile of tiles) {
            const el = els.current.get(tile.id);
            if (el) el.style.transitionDelay = "";
          }
          waving.current = false;
        },
        2 * pass + GRID.waveHoldMs + 50,
      ),
    ];
  }, [calm, tiles, width, height, setFlipped]);

  useEffect(() => {
    if (calm || played.current || tiles.length === 0) return;
    const start = window.setTimeout(() => {
      played.current = true;
      ripple();
    }, WAVE_START_MS);
    return () => window.clearTimeout(start);
  }, [calm, tiles, ripple]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending.values()) window.clearTimeout(id);
      for (const id of waveTimers.current) window.clearTimeout(id);
    };
  }, []);

  const sweep = (event: React.PointerEvent<HTMLDivElement>) => {
    if (calm || waving.current) return;
    const now = performance.now();
    if (now - lastSweep.current < 16) return;
    lastSweep.current = now;
    const box = event.currentTarget.getBoundingClientRect();
    const near = tilesInRadius(tiles, event.clientX - box.left, event.clientY - box.top, GRID.radius);
    const nearIds = new Set(near.map((tile) => tile.id));
    for (const tile of tiles) {
      if (nearIds.has(tile.id)) hold(tile.id);
      else if (els.current.get(tile.id)?.hasAttribute("data-flipped") && pinned.current !== tile.id) release(tile.id);
    }
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const under = near.reduce<(typeof near)[number] | null>((best, tile) => (best === null || Math.hypot(tile.cx - x, tile.cy - y) < Math.hypot(best.cx - x, best.cy - y) ? tile : best), null);
    setCaption(under ? artistOf[under.id] : null);
  };

  const letGo = (keepCaption = false) => {
    if (calm) return;
    for (const tile of tiles) if (els.current.get(tile.id)?.hasAttribute("data-flipped") && pinned.current !== tile.id) release(tile.id);
    if (!keepCaption) setCaption(null);
  };

  const tileId = (target: EventTarget): number | null => {
    const id = (target as HTMLElement).closest?.("[data-id]")?.getAttribute("data-id");
    return id === null || id === undefined ? null : Number(id);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-ground text-ink">
      <div
        role="group"
        aria-label={t(lang, "tilesLabel")}
        className="absolute inset-0 touch-none"
        onPointerMove={sweep}
        onPointerDown={sweep}
        onPointerLeave={() => letGo()}
        onPointerUp={(event) => event.pointerType !== "mouse" && letGo(true)}
        onPointerCancel={() => letGo()}
        onFocus={(event) => {
          const id = tileId(event.target);
          if (id === null) return;
          pinned.current = id;
          hold(id);
          setActive(id);
          setCaption(artistOf[id]);
        }}
        onBlur={(event) => {
          const id = tileId(event.target);
          if (id === null) return;
          if (pinned.current === id) pinned.current = null;
          release(id);
          setCaption(null);
        }}
        onKeyDown={(event) => {
          if (!MOVE_KEYS.includes(event.key)) return;
          const id = tileId(event.target);
          if (id === null) return;
          const to = moveFocus(tiles, tiles[id], event.key as MoveKey);
          if (!to) return;
          event.preventDefault();
          els.current.get(to.id)?.focus();
        }}
      >
        {tiles.map((tile) => {
          const artist = artistOf[tile.id];
          const seed = artist < SEEDS;
          const name = COVER_SPECS[artist].artist;
          return (
            <button
              key={tile.id}
              ref={(el) => {
                if (el) els.current.set(tile.id, el);
                else els.current.delete(tile.id);
              }}
              type="button"
              data-id={tile.id}
              className="tile"
              style={{ left: tile.x, top: tile.y }}
              tabIndex={tile.inView && tile.id === (active ?? firstSeedTile) ? 0 : -1}
              aria-hidden={tile.inView ? undefined : true}
              aria-disabled={seed ? undefined : true}
              aria-label={`${name}. ${t(lang, seed ? "seedHint" : "recHint")}`}
              onClick={() => seed && onPick(artist)}
            >
              <span className="tile-front">{seed && <span className="tile-seed" />}</span>
              <span className="tile-back">
                {seed && <span className="tile-seed tile-seed-back" />}
                <span className="tile-card" style={{ transform: `rotate(-45deg) scale(${GRID.cardScale})` }} dangerouslySetInnerHTML={{ __html: CARDS[artist] }} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid-scrim pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="grid-title font-voice text-6xl text-accent-text md:text-7xl">{t(lang, "gridTitle")}</h1>
        <Status lang={lang} calm={calm} />
        <div className="pointer-events-auto mt-2 flex max-w-xl flex-wrap justify-center gap-2" role="group" aria-label={t(lang, "seeds")}>
          {DATA.seeds.map((s, i) => (
            <button
              key={s.seed}
              type="button"
              onClick={() => onPick(i)}
              className="rounded-full bg-field px-3 py-1.5 text-sm text-ink transition hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
            >
              {s.seed}
            </button>
          ))}
        </div>
        <p className="grid-caption max-w-md rounded px-3 py-1 text-xs text-ink-dim">{t(lang, "coversNote")}</p>
      </div>

      <p aria-live="polite" className="grid-caption pointer-events-none absolute bottom-16 left-1/2 max-w-[90%] -translate-x-1/2 rounded px-3 py-1 text-center text-sm text-ink empty:hidden">
        {caption === null ? "" : `${COVER_SPECS[caption].artist} · ${t(lang, caption < SEEDS ? "seedHint" : "recHint")}`}
      </p>

      <Links lang={lang} className="grid-caption absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2" />

      {!calm && (
        <button
          type="button"
          onClick={ripple}
          className="absolute bottom-5 right-5 rounded-full bg-field px-4 py-1.5 text-sm text-ink transition hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          {t(lang, "ripple")}
        </button>
      )}
    </div>
  );
}
