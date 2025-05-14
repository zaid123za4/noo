
import dhanService from '../dhanService';

// Check if market is open
export const isMarketOpen = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay();
  
  // Weekend check (0 is Sunday, 6 is Saturday)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Indian market hours (9:15 AM to 3:30 PM)
  // Note: This uses local time, adjust if needed for timezone differences
  const isRegularHours = (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
  
  return isRegularHours;
};

// Check if symbol is a cryptocurrency
export const isCrypto = (symbol: string): boolean => {
  return symbol.startsWith('CRYPTO_') || 
         symbol.includes('BTC') || 
         symbol.includes('ETH') ||
         symbol.includes('USDT');
};

// Simple SMA calculation function
export function calculateSMA(data: any[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(0); // Not enough data for SMA yet
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / period);
    }
  }
  
  return sma;
}

// Get specific chart URL provider based on symbol type
export function getChartProvider(symbol: string): string {
  if (isCrypto(symbol)) {
    return 'BINANCE';
  } else if (symbol.includes('NSE') || ['NIFTY', 'BANKNIFTY'].includes(symbol)) {
    return 'NSE';
  } else if (symbol.includes('BSE')) {
    return 'BSE';
  } else {
    return 'NSE'; // Default to NSE for Indian markets
  }
}
