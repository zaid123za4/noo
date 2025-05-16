import dhanService from '../dhanService';
import { MarketData, PredictionResult } from '@/services/tradingLearning';
import { optimizeStrategyParameters } from '@/services/tradingLearning';
import { recordPrediction } from '@/services/tradingLearning';
import { recordOutcome, getSymbolPerformance } from '@/services/tradingLearning';
import { isMarketOpen, isCrypto } from './utils';
import {
  getCurrentPosition,
  getPositionEntryPrice,
  updatePosition,
  getSignalStrength,
  updateSignalStrength,
  SIGNAL_STRENGTH_THRESHOLD
} from './positionTracker';

// Helper function to calculate Simple Moving Average
function calculateSMA(data: MarketData[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(0); // Not enough data yet
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push(sum / period);
  }
  
  return sma;
}

// Trading strategy using SMA crossover with position holding and signal strength
export async function runTradingStrategy(
  symbol: string = 'NIFTY'
): Promise<PredictionResult> {
  try {
    // Get optimized parameters for this symbol based on market conditions
    const { shortSMA, longSMA, confidenceMultiplier } = await optimizeStrategyParameters(symbol);
    
    // Get historical data from the service
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const historicalData = await dhanService.getHistoricalData(
      symbol,
      '30minute',
      thirtyDaysAgo,
      now
    );
    
    // Convert any API-specific MarketData to our internal format
    const marketData: MarketData[] = historicalData.map(data => ({
      timestamp: new Date(data.date || data.time || Date.now()),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    }));
    
    // Calculate SMA with optimized parameters
    const sma20 = calculateSMA(marketData, shortSMA);
    const sma50 = calculateSMA(marketData, longSMA);
    
    // Get the latest values
    const latestSMA20 = sma20[sma20.length - 1];
    const previousSMA20 = sma20[sma20.length - 2];
    const latestSMA50 = sma50[sma50.length - 1];
    const previousSMA50 = sma50[sma50.length - 2];
    
    // Get the current price (latest close)
    const currentPrice = marketData[marketData.length - 1].close;
    
    // Check current position for this symbol
    const currentPosition = getCurrentPosition(symbol);
    
    // Check current signal strength
    const currentSignalStrength = getSignalStrength(symbol);
    
    // Determine action based on crossover and current position
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let message = '';
    let newSignalStrength = currentSignalStrength;
    
    // Market hours check for non-crypto assets
    const marketOpen = isCrypto(symbol) || isMarketOpen();
    
    if (!marketOpen && !isCrypto(symbol)) {
      action = 'HOLD';
      confidence = 0.9;
      message = `Market is closed for ${symbol}. Trading available between 9:15 AM and 3:30 PM on weekdays.`;
      
      // Still calculate the signal for informational purposes
      if (latestSMA20 > latestSMA50) {
        newSignalStrength = Math.min(95, currentSignalStrength + 5);
        message += ` Bullish signal strength: ${newSignalStrength}%`;
      } else if (latestSMA20 < latestSMA50) {
        newSignalStrength = Math.max(5, currentSignalStrength - 5);
        message += ` Bearish signal strength: ${100 - newSignalStrength}%`;
      }
      
      updateSignalStrength(symbol, newSignalStrength);
      
      return {
        action,
        confidence,
        timestamp: new Date(),
        price: currentPrice,
        message,
        signalStrength: newSignalStrength
      };
    }
    
    // Golden Cross (SMA20 crosses above SMA50) - Bullish signal
    if (previousSMA20 <= previousSMA50 && latestSMA20 > latestSMA50) {
      // Strong bullish signal
      newSignalStrength = Math.min(100, currentSignalStrength + 25);
      
      // Only BUY if we're not already in a BUY position
      if (currentPosition !== 'BUY') {
        action = 'BUY';
        confidence = 0.80 + (Math.random() * 0.15); // Higher confidence for crossover
        message = `SMA(${shortSMA}) crossed above SMA(${longSMA}) - Golden Cross detected`;
        
        // If we're in SELL position, record the outcome
        if (currentPosition === 'SELL') {
          const entryPrice = getPositionEntryPrice(symbol);
          if (entryPrice) {
            const successful = currentPrice < entryPrice;
            recordOutcome(symbol, 'SELL', entryPrice, currentPrice, successful);
          }
        }
        
        updatePosition(symbol, 'BUY', currentPrice); // Update position tracker
      } else {
        action = 'HOLD';
        confidence = 0.75 + (Math.random() * 0.15);
        message = `Already in BUY position - Continue holding as trend is still bullish`;
      }
    }
    // Death Cross (SMA20 crosses below SMA50) - Bearish signal
    else if (previousSMA20 >= previousSMA50 && latestSMA20 < latestSMA50) {
      // Strong bearish signal
      newSignalStrength = Math.max(0, currentSignalStrength - 25);
      
      // Only SELL if we're not already in a SELL position
      if (currentPosition !== 'SELL') {
        action = 'SELL';
        confidence = 0.75 + (Math.random() * 0.15); // High confidence for crossover
        message = `SMA(${shortSMA}) crossed below SMA(${longSMA}) - Death Cross detected`;
        
        // If we're in BUY position, record the outcome
        if (currentPosition === 'BUY') {
          const entryPrice = getPositionEntryPrice(symbol);
          if (entryPrice) {
            const successful = currentPrice > entryPrice;
            recordOutcome(symbol, 'BUY', entryPrice, currentPrice, successful);
          }
        }
        
        updatePosition(symbol, 'SELL', currentPrice); // Update position tracker
      } else {
        action = 'HOLD';
        confidence = 0.70 + (Math.random() * 0.15);
        message = `Already in SELL position - Continue holding as trend is still bearish`;
      }
    }
    // No crossover, check trends and signal strength changes
    else {
      if (latestSMA20 > latestSMA50) {
        // Bullish trend continues, increase signal strength
        newSignalStrength = Math.min(95, currentSignalStrength + 2);
        
        // Check if signal strength change is significant enough for action
        const signalChange = newSignalStrength - currentSignalStrength;
        
        // We're in a SELL position but signal is becoming strongly bullish
        if (currentPosition === 'SELL' && newSignalStrength >= 70 && signalChange >= SIGNAL_STRENGTH_THRESHOLD) {
          // Signal strong enough to change position
          action = 'BUY'; // Buy to close sell position
          confidence = 0.65 + (Math.random() * 0.15);
          message = `Closing SELL position as bullish signal strength increased to ${newSignalStrength}%`;
          
          // Record the outcome
          const entryPrice = getPositionEntryPrice(symbol);
          if (entryPrice) {
            const successful = entryPrice > currentPrice;
            recordOutcome(symbol, 'SELL', entryPrice, currentPrice, successful);
          }
          
          updatePosition(symbol, 'BUY', currentPrice);
        } else if (currentPosition !== 'BUY' && newSignalStrength >= 75) {
          // Not in a position yet, enter BUY if signal is strong enough
          action = 'BUY';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Strong bullish signal (${newSignalStrength}%) - Entering bullish trend`;
          updatePosition(symbol, 'BUY', currentPrice);
        } else {
          // Hold current position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Bullish trend continues - Signal strength: ${newSignalStrength}%`;
        }
      } else if (latestSMA20 < latestSMA50) {
        // Bearish trend continues, decrease signal strength
        newSignalStrength = Math.max(5, currentSignalStrength - 2);
        
        // Check if signal strength change is significant enough for action
        const signalChange = currentSignalStrength - newSignalStrength;
        
        // We're in a BUY position but signal is becoming strongly bearish
        if (currentPosition === 'BUY' && newSignalStrength <= 30 && signalChange >= SIGNAL_STRENGTH_THRESHOLD) {
          // Signal strong enough to change position
          action = 'SELL'; // Sell to close buy position
          confidence = 0.65 + (Math.random() * 0.15);
          message = `Closing BUY position as bearish signal strength increased to ${100 - newSignalStrength}%`;
          
          // Record the outcome
          const entryPrice = getPositionEntryPrice(symbol);
          if (entryPrice) {
            const successful = currentPrice > entryPrice;
            recordOutcome(symbol, 'BUY', entryPrice, currentPrice, successful);
          }
          
          updatePosition(symbol, 'SELL', currentPrice);
        } else if (currentPosition !== 'SELL' && newSignalStrength <= 25) {
          // Not in a position yet, enter SELL if signal is strong enough
          action = 'SELL';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Strong bearish signal (${100 - newSignalStrength}%) - Entering bearish trend`;
          updatePosition(symbol, 'SELL', currentPrice);
        } else {
          // Hold current position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Bearish trend continues - Signal strength: ${100 - newSignalStrength}%`;
        }
      } else {
        action = 'HOLD';
        confidence = 0.5;
        message = `SMA(${shortSMA}) and SMA(${longSMA}) are nearly equal - No clear trend`;
      }
    }
    
    // Update the signal strength
    updateSignalStrength(symbol, newSignalStrength);
    
    // Apply the confidence multiplier from learning algorithm
    confidence = Math.min(0.95, confidence * confidenceMultiplier);
    
    // Check performance data and add to message
    const performance = getSymbolPerformance(symbol);
    if (performance && performance.totalTrades > 0) {
      const successRatePercent = (performance.successRate * 100).toFixed(1);
      const profitLoss = performance.profitLossTotal.toFixed(2);
      message += `. Learning: ${performance.totalTrades} trades, ${successRatePercent}% success rate, ₹${profitLoss} P/L`;
    }
    
    // Record this prediction
    const predictionResult: PredictionResult = {
      action,
      confidence,
      timestamp: new Date(),
      price: currentPrice,
      message,
      signalStrength: newSignalStrength
    };
    recordPrediction(symbol, predictionResult);
    
    // Log the prediction
    dhanService.addLog(
      `Strategy prediction for ${symbol}: ${action} with ${(confidence * 100).toFixed(1)}% confidence. ${message}`,
      'info'
    );
    
    return predictionResult;
  } catch (error) {
    dhanService.addLog(`Strategy error for ${symbol}: ${(error as Error).message}`, 'error');
    
    // Default to HOLD if there's an error
    return {
      action: 'HOLD',
      confidence: 0,
      timestamp: new Date(),
      price: 0,
      message: `Error: ${(error as Error).message}`,
      signalStrength: 50
    };
  }
}
