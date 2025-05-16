import dhanService from '@/services/dhanService';

// Interface for Market Data from API
export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Interface for prediction results
export interface PredictionResult {
  timestamp: Date;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  message?: string;
  signalStrength?: number;
}

// Interface for User Profile - aligning with dhanService types
export interface UserProfile {
  user_id: string;
  user_name: string;
  email: string;
  user_type: string;
  // Add any additional fields from dhanService.UserProfile if needed
}

// Interface for Funds - aligning with dhanService types
export interface Funds {
  equity: {
    available: {
      cash: number;
      collateral: number;
    },
    utilized: {
      m2m_unrealised: number;
    }
  }
  // Add any additional fields from dhanService.Funds if needed
}

// Interface for Order - aligning with dhanService types
export interface Order {
  id: string;
  timestamp: Date;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  status: 'ACTIVE' | 'COMPLETE' | 'CANCELLED';
  // Add any additional fields from dhanService.Order if needed
}

// Interface for Trade Log
export interface TradeLog {
  timestamp: Date;
  message: string;
  type: string;
}

// Interface for storing prediction history
interface PredictionHistory {
  timestamp: Date;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  signalStrength?: number;
  outcome?: {
    successful: boolean;
    profitLoss: number;
    closingPrice?: number;
    closingTimestamp?: Date;
  };
}

// Storage for our prediction history
let predictionHistory: Record<string, PredictionHistory[]> = {};

// Performance metrics by symbol
let symbolPerformance: Record<string, {
  totalPredictions: number;
  successfulPredictions: number;
  failedPredictions: number;
  profitLossTotal: number;
  averageConfidence: number;
  adjustmentFactor: number;
}> = {};

/**
 * Record a new prediction in the history
 */
export function recordPrediction(
  symbol: string,
  prediction: PredictionResult
): void {
  if (!predictionHistory[symbol]) {
    predictionHistory[symbol] = [];
  }

  predictionHistory[symbol].push({
    timestamp: prediction.timestamp,
    symbol,
    action: prediction.action,
    confidence: prediction.confidence,
    price: prediction.price,
    signalStrength: prediction.signalStrength
  });

  // Limit history to last 100 predictions
  if (predictionHistory[symbol].length > 100) {
    predictionHistory[symbol].shift();
  }

  // Initialize performance metrics if not exists
  if (!symbolPerformance[symbol]) {
    symbolPerformance[symbol] = {
      totalPredictions: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      profitLossTotal: 0,
      averageConfidence: 0.7, // Start with default confidence
      adjustmentFactor: 1.0   // Will be used to adjust confidence 
    };
  }

  symbolPerformance[symbol].totalPredictions++;
}

/**
 * Record the outcome of a prediction (successful or not)
 */
export function recordOutcome(
  symbol: string,
  action: 'BUY' | 'SELL',
  entryPrice: number,
  closingPrice: number,
  successful: boolean
): void {
  if (!predictionHistory[symbol] || predictionHistory[symbol].length === 0) {
    return;
  }

  // Find the most recent prediction for this symbol with the given action that doesn't have an outcome
  const predictionIndex = [...predictionHistory[symbol]]
    .reverse()
    .findIndex(p => p.action === action && !p.outcome);

  if (predictionIndex !== -1) {
    // Calculate actual index in the array
    const actualIndex = predictionHistory[symbol].length - 1 - predictionIndex;
    const profitLoss = action === 'BUY' 
      ? closingPrice - entryPrice 
      : entryPrice - closingPrice;
    
    predictionHistory[symbol][actualIndex].outcome = {
      successful,
      profitLoss,
      closingPrice,
      closingTimestamp: new Date()
    };

    // Update performance metrics
    if (successful) {
      symbolPerformance[symbol].successfulPredictions++;
    } else {
      symbolPerformance[symbol].failedPredictions++;
    }
    symbolPerformance[symbol].profitLossTotal += profitLoss;

    // Adjust the performance factor based on recent outcomes
    updateAdjustmentFactor(symbol);

    dhanService.addLog(
      `Learning: ${symbol} ${action} prediction ${successful ? 'succeeded' : 'failed'} with P/L of ₹${profitLoss.toFixed(2)}. New adjustment factor: ${symbolPerformance[symbol].adjustmentFactor.toFixed(2)}`, 
      successful ? 'success' : 'warning'
    );
  }
}

/**
 * Update the adjustment factor based on recent performance
 */
function updateAdjustmentFactor(symbol: string): void {
  const performance = symbolPerformance[symbol];
  
  if (!performance || performance.totalPredictions < 5) {
    return; // Not enough data
  }

  // Calculate success rate
  const successRate = performance.successfulPredictions / 
    (performance.successfulPredictions + performance.failedPredictions);

  // Adjust the factor based on success rate
  // Higher success = higher adjustment (up to 1.3)
  // Lower success = lower adjustment (down to 0.7)
  let newFactor;
  if (successRate >= 0.7) {
    // Very good performance - boost confidence
    newFactor = 1.0 + (successRate - 0.7) * 1.0; // max 1.3 when 100% success
  } else if (successRate >= 0.5) {
    // Average performance - slight modification
    newFactor = 0.9 + (successRate - 0.5) * 1.0; // 0.9 to 1.1
  } else {
    // Poor performance - reduce confidence
    newFactor = 0.7 + (successRate) * 0.4; // min 0.7 when 0% success
  }

  // Apply gradual change (30% new, 70% old) for stability
  symbolPerformance[symbol].adjustmentFactor = 
    symbolPerformance[symbol].adjustmentFactor * 0.7 + newFactor * 0.3;
}

/**
 * Get the confidence adjustment factor for a symbol
 */
export function getConfidenceAdjustment(symbol: string): number {
  if (!symbolPerformance[symbol]) {
    return 1.0; // Default - no adjustment
  }
  
  return symbolPerformance[symbol].adjustmentFactor;
}

/**
 * Get performance metrics for a symbol
 */
export function getSymbolPerformance(symbol: string): {
  successRate: number;
  totalTrades: number;
  profitLossTotal: number;
  adjustmentFactor: number;
} | null {
  if (!symbolPerformance[symbol]) {
    return null;
  }

  const performance = symbolPerformance[symbol];
  const completedTrades = performance.successfulPredictions + performance.failedPredictions;
  
  return {
    successRate: completedTrades === 0 ? 0 : performance.successfulPredictions / completedTrades,
    totalTrades: completedTrades,
    profitLossTotal: performance.profitLossTotal,
    adjustmentFactor: performance.adjustmentFactor
  };
}

/**
 * Get recent predictions for a symbol
 */
export function getRecentPredictions(symbol: string): PredictionHistory[] {
  return predictionHistory[symbol] || [];
}

/**
 * Check if we need to modify the strategy parameters based on market behavior
 * This analyzes recent market data to detect patterns and adjust strategy
 */
export async function optimizeStrategyParameters(
  symbol: string
): Promise<{
  shortSMA: number;
  longSMA: number;
  confidenceMultiplier: number;
}> {
  // Default parameters
  let shortSMA = 20;
  let longSMA = 50;
  let confidenceMultiplier = 1.0;
  
  try {
    // Get recent market data
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)); 
    
    const historicalData = await dhanService.getHistoricalData(
      symbol,
      '15minute', // Using 15-minute candles for optimization
      fiveDaysAgo,
      now
    );
    
    // Convert API data to our MarketData format
    const marketData: MarketData[] = historicalData.map(data => ({
      timestamp: new Date(data.date || data.time || Date.now()),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    }));
    
    // Check market volatility
    const volatility = calculateVolatility(marketData);
    
    // Adjust parameters based on volatility
    if (volatility > 0.025) { // High volatility
      shortSMA = 15; // Faster response
      longSMA = 40;
      confidenceMultiplier = 0.9; // More cautious
    } else if (volatility < 0.01) { // Low volatility
      shortSMA = 25; // Slower response to avoid false signals
      longSMA = 60;
      confidenceMultiplier = 1.1; // More confident
    }
    
    // Apply adjustment factor from performance history
    confidenceMultiplier *= getConfidenceAdjustment(symbol);
    
    // Log the optimization
    dhanService.addLog(
      `Optimized strategy for ${symbol}: SMA(${shortSMA}/${longSMA}), confidence x${confidenceMultiplier.toFixed(2)}. Volatility: ${(volatility * 100).toFixed(2)}%`,
      'info'
    );
  } catch (error) {
    dhanService.addLog(
      `Failed to optimize strategy for ${symbol}: ${(error as Error).message}`,
      'error'
    );
  }
  
  return { shortSMA, longSMA, confidenceMultiplier };
}

/**
 * Calculate market volatility based on price data
 */
function calculateVolatility(data: MarketData[]): number {
  if (data.length < 5) return 0.015; // Default value for brevity
  
  // Calculate returns
  const returns: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const returnVal = (data[i].close - data[i-1].close) / data[i-1].close;
    returns.push(returnVal);
  }
  
  // Calculate standard deviation of returns
  const avg = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const squareDiffs = returns.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  
  return Math.sqrt(avgSquareDiff);
}

// New function to analyze patterns for improved predictions
export async function analyzePatterns(symbol: string): Promise<{
  patternType: 'uptrend' | 'downtrend' | 'range' | 'unknown';
  strength: number; // 0-100
  recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
}> {
  try {
    // Get recent market data
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
    
    const historicalData = await dhanService.getHistoricalData(
      symbol,
      'day',
      tenDaysAgo,
      now
    );
    
    // Convert API data to our MarketData format
    const marketData: MarketData[] = historicalData.map(data => ({
      timestamp: new Date(data.date || data.time || Date.now()),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    }));
    
    // Simple pattern detection (in a real system, this would be much more sophisticated)
    const closes = marketData.map(d => d.close);
    
    // Calculate simple trend
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i-1]) upCount++;
      else if (closes[i] < closes[i-1]) downCount++;
    }
    
    // Determine pattern type
    let patternType: 'uptrend' | 'downtrend' | 'range' | 'unknown' = 'unknown';
    let strength = 50;
    let recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' = 'neutral';
    
    if (upCount > downCount * 2) {
      patternType = 'uptrend';
      strength = Math.min(100, 50 + (upCount - downCount) * 5);
      recommendation = strength > 80 ? 'strong_buy' : 'buy';
    } else if (downCount > upCount * 2) {
      patternType = 'downtrend';
      strength = Math.max(0, 50 - (downCount - upCount) * 5);
      recommendation = strength < 20 ? 'strong_sell' : 'sell';
    } else if (Math.abs(upCount - downCount) <= 2) {
      patternType = 'range';
      strength = 50;
      recommendation = 'neutral';
    }
    
    return { patternType, strength, recommendation };
    
  } catch (error) {
    dhanService.addLog(
      `Failed to analyze patterns for ${symbol}: ${(error as Error).message}`,
      'error'
    );
    return { patternType: 'unknown', strength: 50, recommendation: 'neutral' };
  }
}
