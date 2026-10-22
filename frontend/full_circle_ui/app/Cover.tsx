import { CARDS, cardIndex } from "@/lib/cards";

/** An artist's swatch card. Decorative: the name is always set as text beside it. */
export function Card({ artist, className }: { artist: string; className?: string }) {
  const index = cardIndex(artist);
  if (index === undefined) return null;
  // Built from our own specs, with names escaped in coverSvg, so inserting it as markup is safe.
  return <span aria-hidden="true" className={className} dangerouslySetInnerHTML={{ __html: CARDS[index] }} />;
}

/** An artist's chips in a row, the first twice as wide as the card draws it. Decorative. */
export function Strip({ palette, className = "" }: { palette: string[]; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex gap-px ${className}`}>
      {palette.map((color, i) => (
        <span key={color} className="rounded-[1px]" style={{ backgroundColor: color, flex: i === 0 ? 2 : 1 }} />
      ))}
    </span>
  );
}
