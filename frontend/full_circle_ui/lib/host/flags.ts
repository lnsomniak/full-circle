export interface Flags {
  /** `?welcomed`: skip any welcome screen. This demo has none, so the flag is read and nothing changes. */
  welcomed: boolean;
  /** `?still`: one settled frame, no motion. */
  still: boolean;
}

export function readFlags(search: string): Flags {
  const params = new URLSearchParams(search);
  return { welcomed: params.has("welcomed"), still: params.has("still") };
}
