import raw from "@/data/fullcircle.json";

export interface Recommendation {
  rank: number;
  artist: string;
  similarity: number;
  matching_tags: string[];
}

export interface Seed {
  seed: string;
  tags: string[];
  probability: number;
  weighted: Recommendation[];
  unweighted: Recommendation[];
}

export interface DemoData {
  model: { trained_at: string; test_accuracy: number; cv_accuracy: number; n_features: number };
  threshold: number;
  seeds: Seed[];
}

export const DATA = raw as DemoData;
