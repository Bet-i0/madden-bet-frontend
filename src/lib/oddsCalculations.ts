/**
 * Odds conversion and calculation utilities
 * Supports American, Decimal, and Fractional odds formats
 */

export type OddsFormat = 'american' | 'decimal' | 'fractional';

/**
 * Convert American odds to implied probability
 * @param americanOdds - American odds (e.g., -110, +150)
 * @returns Implied probability as a decimal (0-1)
 */
export function americanToImpliedProbability(americanOdds: number): number {
  if (americanOdds === 0) return 0;
  
  if (americanOdds > 0) {
    // Positive odds (underdog)
    return 100 / (americanOdds + 100);
  } else {
    // Negative odds (favorite)
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }
}

/**
 * Convert decimal odds to implied probability
 * @param decimalOdds - Decimal odds (e.g., 1.91, 2.50)
 * @returns Implied probability as a decimal (0-1)
 */
export function decimalToImpliedProbability(decimalOdds: number): number {
  if (decimalOdds <= 0) return 0;
  return 1 / decimalOdds;
}

/**
 * Convert American odds to decimal odds
 * @param americanOdds - American odds (e.g., -110, +150)
 * @returns Decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds === 0) return 1;
  
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 * @param decimalOdds - Decimal odds (e.g., 1.91, 2.50)
 * @returns American odds
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds <= 1) return 0;
  
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Calculate true odds (no-vig odds) for a parlay
 * @param impliedProbabilities - Array of implied probabilities for each leg
 * @returns True decimal odds for the parlay
 */
export function calculateParlayTrueOdds(impliedProbabilities: number[]): number {
  if (impliedProbabilities.length === 0) return 1;
  
  const combinedProbability = impliedProbabilities.reduce((acc, prob) => acc * prob, 1);
  return 1 / combinedProbability;
}

/**
 * Calculate parlay odds with vig (what the book offers)
 * @param decimalOdds - Array of decimal odds for each leg
 * @returns Parlay decimal odds (with vig)
 */
export function calculateParlayOdds(decimalOdds: number[]): number {
  if (decimalOdds.length === 0) return 1;
  return decimalOdds.reduce((acc, odds) => acc * odds, 1);
}

/**
 * Calculate the hold/vig percentage from implied probabilities
 * @param impliedProbabilities - Array of all possible outcomes' implied probabilities
 * @returns Hold percentage as a decimal (0-1)
 */
export function calculateHold(impliedProbabilities: number[]): number {
  const sum = impliedProbabilities.reduce((acc, prob) => acc + prob, 0);
  return sum - 1;
}

/**
 * Format odds according to user preference
 * @param decimalOdds - Decimal odds to format
 * @param format - Desired format
 * @returns Formatted odds string
 */
export function formatOdds(decimalOdds: number, format: OddsFormat = 'american'): string {
  if (format === 'decimal') {
    return decimalOdds.toFixed(2);
  }
  
  if (format === 'fractional') {
    const fraction = decimalToFraction(decimalOdds);
    return fraction;
  }
  
  // American format (default)
  const american = decimalToAmerican(decimalOdds);
  return american > 0 ? `+${american}` : `${american}`;
}

/**
 * Convert decimal odds to fractional representation
 * @param decimalOdds - Decimal odds
 * @returns Fractional odds as string (e.g., "5/2")
 */
function decimalToFraction(decimalOdds: number): string {
  if (decimalOdds <= 1) return '0/1';
  
  const decimal = decimalOdds - 1;
  
  // Find greatest common divisor
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  
  // Convert to fraction (multiply by 100 to handle decimals)
  const numerator = Math.round(decimal * 100);
  const denominator = 100;
  const divisor = gcd(numerator, denominator);
  
  return `${numerator / divisor}/${denominator / divisor}`;
}

/**
 * Calculate expected value (EV) of a bet
 * @param decimalOdds - Decimal odds offered
 * @param trueProbability - True probability of winning (0-1)
 * @returns Expected value as a percentage
 */
export function calculateExpectedValue(decimalOdds: number, trueProbability: number): number {
  const payout = decimalOdds - 1; // Profit on $1 bet
  const ev = (trueProbability * payout) - ((1 - trueProbability) * 1);
  return ev * 100; // Return as percentage
}

/**
 * Format implied probability as percentage
 * @param probability - Probability as decimal (0-1)
 * @returns Formatted percentage string
 */
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Calculate CLV (Closing Line Value) in basis points
 * @param placedOdds - Odds when bet was placed
 * @param closingOdds - Odds at closing/kickoff
 * @returns CLV in basis points (bps)
 */
export function calculateCLVBps(placedOdds: number, closingOdds: number): number {
  if (!placedOdds || !closingOdds) return 0;
  return Math.round(((closingOdds - placedOdds) / placedOdds) * 10000);
}

/**
 * Get CLV tier for display purposes
 * @param clvBps - CLV in basis points
 * @returns Tier classification
 */
export function getCLVTier(clvBps: number | null): 'positive' | 'negative' | 'neutral' | 'unknown' {
  if (clvBps === null || clvBps === undefined) return 'unknown';
  if (clvBps > 50) return 'positive';
  if (clvBps < -50) return 'negative';
  return 'neutral';
}
