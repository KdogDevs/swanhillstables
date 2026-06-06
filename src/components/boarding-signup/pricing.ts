// Boarding pricing matrix — single source of truth

export type Tier = "indoor" | "outdoor";
export type FeedPlan =
  | "boarder"
  | "barn_1bag_basic"
  | "barn_1bag_tcs"
  | "barn_2bag_basic"
  | "barn_2bag_tcs";

export const TIER_LABELS: Record<Tier, string> = {
  indoor: "Top Tier — Indoor Stall",
  outdoor: "Outdoor / Shed-Row Stall",
};

export const TIER_SHORT: Record<Tier, string> = {
  indoor: "Indoor Stall",
  outdoor: "Outdoor / Shed-Row",
};

export const FEED_LABELS: Record<FeedPlan, string> = {
  boarder: "Boarder provides feed",
  barn_1bag_basic: "Barn provides — 1 bag/week (Basic 14% Starch)",
  barn_1bag_tcs: "Barn provides — 1 bag/week (Triple Crown Senior)",
  barn_2bag_basic: "Barn provides — 2 bags/week (Basic 14% Starch)",
  barn_2bag_tcs: "Barn provides — 2 bags/week (Triple Crown Senior)",
};

export const PRICE_MATRIX: Record<Tier, Record<FeedPlan, number>> = {
  indoor: {
    boarder: 525,
    barn_1bag_basic: 545,
    barn_1bag_tcs: 590,
    barn_2bag_basic: 565,
    barn_2bag_tcs: 610,
  },
  outdoor: {
    boarder: 425,
    barn_1bag_basic: 445,
    barn_1bag_tcs: 465,
    barn_2bag_basic: 465,
    barn_2bag_tcs: 505,
  },
};

export const ADDONS = {
  hay: { label: "Hay", price: 100, description: "$100/month" },
  bedding: { label: "Pelletized bedding", price: 60, description: "$60/month" },
} as const;

export const ADDON_NOTES = [
  "Blanketing: $50–$75/month (billed separately, by request)",
  "Holding for vet/farrier: $15–$25 per visit",
  "Deworming: $10 plus the cost of dewormer",
  "Daily grooming: $100–$200/month",
  "Training rides: $35–$55 per ride or monthly package",
];

export function calculateMonthly(
  tier: Tier,
  feedPlan: FeedPlan,
  addons: { hay: boolean; bedding: boolean },
): number {
  let total = PRICE_MATRIX[tier][feedPlan];
  if (addons.hay) total += ADDONS.hay.price;
  if (addons.bedding) total += ADDONS.bedding.price;
  return total;
}

export const TIER_INCLUDES: Record<Tier, string[]> = {
  indoor: [
    "Premium bedded indoor stall (10x10)",
    "Stall cleaning as needed",
    "Turnout/in",
    "Feeding twice daily",
    "Full arena and facility access",
  ],
  outdoor: [
    "Covered bedded stall (11x12)",
    "Stall cleaning as needed",
    "Turnout/in",
    "Feeding twice daily",
    "Arena and trail access",
  ],
};

export const TIER_AVAILABILITY: Record<Tier, string> = {
  indoor: "5 stalls",
  outdoor: "10 stalls",
};
