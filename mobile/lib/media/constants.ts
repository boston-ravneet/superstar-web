export const PORTFOLIO_SLOT_COUNT = 6;
export const PORTFOLIO_MIN = 4;
export const PORTFOLIO_MAX = 6;
export const SHOWREEL_MAX = 2;

export type PortfolioSlots = [
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
  string | null,
];

export const EMPTY_PORTFOLIO: PortfolioSlots = [
  null,
  null,
  null,
  null,
  null,
  null,
];
