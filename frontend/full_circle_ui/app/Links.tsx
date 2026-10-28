import { t } from "@/lib/copy";
import { LINKS } from "@/lib/links";
import type { Lang } from "@/lib/host/lang";

export default function Links({ lang, className = "" }: { lang: Lang; className?: string }) {
  return (
    <nav aria-label={t(lang, "links")} className={`flex items-center gap-5 ${className}`}>
      {LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-ink-dim transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
            <path d={link.path} />
          </svg>
          <span className="text-sm">{link.label}</span>
          <span className="sr-only">{` ${t(lang, "newTab")}`}</span>
        </a>
      ))}
    </nav>
  );
}
