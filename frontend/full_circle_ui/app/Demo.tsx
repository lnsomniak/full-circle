"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { t } from "@/lib/copy";
import { DATA } from "@/lib/data";
import { startBridge } from "@/lib/host/bridge";
import { useCalm } from "@/lib/host/calm";
import { readFlags } from "@/lib/host/flags";
import { readLang, type Lang } from "@/lib/host/lang";
import { applyTheme, followOsWhileUnsaved, initialTheme } from "@/lib/host/theme";
import { applyTypefaces } from "@/lib/host/typefaces";
import Grid from "./Grid";

function Recommender({ lang, seedIndex, onSeed, onBack }: { lang: Lang; seedIndex: number; onSeed: (index: number) => void; onBack: () => void }) {
  const [isWeighted, setIsWeighted] = useState(true);
  const seed = DATA.seeds[seedIndex];
  const recommendations = isWeighted ? seed.weighted : seed.unweighted;

  return (
    <main className="flex min-h-screen flex-col items-center bg-ground p-5 font-label text-sm text-ink">
      <div className="grid w-full max-w-[1100px] grid-cols-[280px_minmax(0,1fr)] gap-6">
        <section>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 rounded-full bg-field px-3 py-1 text-ink transition hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            {t(lang, "back")}
          </button>
          <h1 className="title-gradient mb-4 bg-clip-text font-voice text-4xl text-transparent">{t(lang, "title")}</h1>

          <div className="rounded-xl border border-line bg-panel p-4 shadow-2xl">
            <p className="mb-3 text-ink-dim">{t(lang, "seeds")}</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {DATA.seeds.map((s, i) => (
                <button
                  key={s.seed}
                  type="button"
                  aria-pressed={i === seedIndex}
                  onClick={() => onSeed(i)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    i === seedIndex ? "bg-accent text-accent-ink" : "bg-field text-ink hover:bg-line"
                  }`}
                >
                  {s.seed}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="artist" className="mb-1 block text-ink-dim">
                  {t(lang, "artistName")}
                </label>
                <input
                  id="artist"
                  readOnly
                  value={seed.seed}
                  className="w-full rounded border border-line bg-field p-2 text-ink focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="tags" className="mb-1 block text-ink-dim">
                  {t(lang, "tags")}
                </label>
                <textarea
                  id="tags"
                  readOnly
                  rows={5}
                  value={seed.tags.join(", ")}
                  className="w-full resize-none rounded border border-line bg-field p-2 text-xs text-ink focus:outline-none"
                />
              </div>
              <label className="flex cursor-pointer items-start space-x-2">
                <input
                  type="checkbox"
                  checked={isWeighted}
                  onChange={(e) => setIsWeighted(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded"
                />
                <span className="select-none text-ink-dim">{t(lang, "weighted")}</span>
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
            <h2 className="font-voice text-xl">{t(lang, "topTen")}</h2>
            <p>
              <span className="text-ink-dim">{t(lang, "confidence")}</span>
              <span className="text-2xl text-accent-text">{(seed.probability * 100).toFixed(2)}%</span>
            </p>
          </div>

          <div className="mb-1 grid grid-cols-[2rem_11rem_minmax(0,1fr)_4.5rem] gap-2.5 px-3 text-xs text-ink-dim">
            <span />
            <span />
            <span>{t(lang, "matched")}</span>
            <span className="text-right">{t(lang, "similarity")}</span>
          </div>

          <ol className="grid gap-1.5">
            {recommendations.map((rec) => (
              <li
                key={rec.artist}
                className="grid grid-cols-[2rem_11rem_minmax(0,1fr)_4.5rem] items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-1.5"
              >
                <span className="text-accent-text">#{rec.rank}</span>
                <span className="truncate font-voice text-base">{rec.artist}</span>
                <span className="flex flex-wrap gap-1">
                  {rec.matching_tags.map((tag) => (
                    <span key={tag} className="rounded bg-tag px-2 py-0.5 text-xs text-tag-ink">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="text-right text-accent-soft">{(rec.similarity * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="mt-3 w-full max-w-[1100px] text-xs text-ink-dim">
        {t(lang, "precomputed")} {t(lang, "accuracy")}: {(DATA.model.test_accuracy * 100).toFixed(1)}%.
      </p>
    </main>
  );
}

// Only for a host that never sends a theme: show the saved mode instead of a blank frame.
const HOST_THEME_WAIT_MS = 1500;

// The language is fixed for the life of the page; the server render has no storage to read.
const noSubscription = () => () => {};
const serverLang = (): Lang => "en";

export default function Demo() {
  const [resets, setResets] = useState(0);
  const [seed, setSeed] = useState<number | null>(null);
  const lang = useSyncExternalStore(noSubscription, readLang, serverLang);
  const calm = useCalm();

  // Runs before first paint. Until a theme is applied, globals.css keeps the page hidden.
  // Embedded, the portfolio's first message (which may carry a Nexus palette) is that theme,
  // so the saved mode is not painted ahead of it.
  useLayoutEffect(() => {
    const embedded = window.parent !== window;
    if (!embedded) applyTheme(initialTheme());
    document.documentElement.lang = readLang();
    if (readFlags(location.search).still) document.documentElement.setAttribute("data-still", "");
    const stopBridge = startBridge({
      onTheme: (mode, palette, typefaces) => {
        applyTheme(mode, palette);
        applyTypefaces(typefaces);
      },
      onReset: () => {
        setSeed(null);
        setResets((n) => n + 1);
      },
    });
    const stopOs = followOsWhileUnsaved(applyTheme);
    const hostSilent = embedded
      ? window.setTimeout(() => {
          if (!document.documentElement.hasAttribute("data-theme")) applyTheme(initialTheme());
        }, HOST_THEME_WAIT_MS)
      : undefined;
    return () => {
      stopBridge();
      stopOs();
      window.clearTimeout(hostSilent);
    };
  }, []);

  if (seed === null) return <Grid key={resets} lang={lang} calm={calm} onPick={setSeed} />;
  return <Recommender key={resets} lang={lang} seedIndex={seed} onSeed={setSeed} onBack={() => setSeed(null)} />;
}
