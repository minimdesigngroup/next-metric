import { describe, expect, it } from "vitest";
import { resolveTagDisplays } from "@/utils/tag-labels";

describe("resolveTagDisplays", () => {
  it("maps stored slugs to current taxonomy labels", () => {
    expect(
      resolveTagDisplays(
        ["Home", "Listing", "Premium A+", "New type"],
        [
          { slug: "Home", label: "Beauty & Personal Care" },
          { slug: "Listing", label: "Listing" },
          { slug: "Premium A+", label: "Premium A+" },
          { slug: "New type", label: "3D Product Modeling" },
        ],
      ),
    ).toEqual([
      { slug: "Home", label: "Beauty & Personal Care" },
      { slug: "Listing", label: "Listing" },
      { slug: "Premium A+", label: "Premium A+" },
      { slug: "New type", label: "3D Product Modeling" },
    ]);
  });

  it("keeps the raw slug when the taxonomy has no match", () => {
    expect(resolveTagDisplays(["Unknown"], [])).toEqual([
      { slug: "Unknown", label: "Unknown" },
    ]);
  });
});
