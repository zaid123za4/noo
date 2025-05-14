// Keep track of positions for each symbol
const activePositions: Record<string, 'BUY' | 'SELL' | null> = {};

// Keep track of position entry prices for P&L calculation
const positionEntryPrices: Record<string, number> = {};

// Track signal strength for each symbol (0-100 scale)
const signalStrength: Record<string, number> = {};

// Minimum required signal strength difference to change position
export const SIGNAL_STRENGTH_THRESHOLD = 15;

// Get current signal strength for a symbol
export function getSignalStrength(symbol: string): number {
  return signalStrength[symbol] || 50; // Default to neutral
}

// Get current active position for a symbol
export function getCurrentPosition(symbol: string): 'BUY' | 'SELL' | null {
  return activePositions[symbol] || null;
}

// Update position and signal strength
export function updatePosition(symbol: string, position: 'BUY' | 'SELL' | null, price?: number): void {
  activePositions[symbol] = position;
  if (price) {
    positionEntryPrices[symbol] = price;
  }
}

// Get position entry price
export function getPositionEntryPrice(symbol: string): number | undefined {
  return positionEntryPrices[symbol];
}

// Remove position tracking
export function clearPosition(symbol: string): void {
  activePositions[symbol] = null;
  delete positionEntryPrices[symbol];
}

// Update signal strength for a symbol
export function updateSignalStrength(symbol: string, strength: number): void {
  signalStrength[symbol] = strength;
}

// Export active positions for external use
export function getAllActivePositions(): Record<string, 'BUY' | 'SELL' | null> {
  return { ...activePositions };
}
