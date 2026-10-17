import { describe, expect, it } from "vitest";
import { readFlags } from "./flags";

describe("readFlags", () => {
  it("reads ?still and ?welcomed", () => {
    expect(readFlags("?still&welcomed")).toEqual({ still: true, welcomed: true });
  });

  it("is off with no flags", () => {
    expect(readFlags("")).toEqual({ still: false, welcomed: false });
    expect(readFlags("?other=1")).toEqual({ still: false, welcomed: false });
  });
});
