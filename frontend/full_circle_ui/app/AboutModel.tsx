"use client";

import { useEffect, useId, useRef, useState } from "react";
import { t, type CopyKey } from "@/lib/copy";
import type { Lang } from "@/lib/host/lang";

type Era = "rf" | "xgb";

const ERAS: { era: Era; label: CopyKey; text: CopyKey }[] = [
  { era: "rf", label: "eraRf", text: "historyRf" },
  { era: "xgb", label: "eraXgb", text: "historyXgb" },
];

const RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

/** The footer's "About this model" control: Sergio's note on the model, and its history from his dev log. */
export default function AboutModel({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [era, setEra] = useState<Era>("xgb");
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const shown = ERAS.find((e) => e.era === era)!;

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`rounded-full bg-field px-3 py-1 text-ink transition hover:bg-line ${RING}`}
      >
        {t(lang, "aboutModel")}
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t(lang, "aboutModel")}
          className="absolute bottom-full left-0 z-10 mb-2 w-[34rem] max-w-[calc(100vw-2.5rem)] space-y-3 rounded-xl border border-line bg-panel p-4 text-xs text-ink-dim shadow-2xl"
        >
          <p>{t(lang, "precomputed")}</p>
          <div className="space-y-2 border-t border-line pt-3">
            <p className="text-ink">{t(lang, "historyHeading")}</p>
            <p>{t(lang, "historyStory")}</p>
            <div className="flex gap-2">
              {ERAS.map((e) => (
                <button
                  key={e.era}
                  type="button"
                  aria-pressed={e.era === era}
                  onClick={() => setEra(e.era)}
                  className={`rounded-full px-3 py-1 text-xs transition ${RING} ${
                    e.era === era ? "bg-accent-fill text-accent-ink" : "bg-field text-ink hover:bg-line"
                  }`}
                >
                  {t(lang, e.label)}
                </button>
              ))}
            </div>
            <p aria-live="polite">{t(lang, shown.text)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
