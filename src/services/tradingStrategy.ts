
import dhanService, { MarketData, PredictionResult } from './zerodhaService';
import { 
  recordPrediction, 
  recordOutcome, 
  optimizeStrategyParameters,
  getSymbolPerformance
} from './tradingLearning';

// Simple SMA calculation function
function calculateSMA(data: MarketData[], period: number): number[] {
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

// Keep track of positions for each symbol
const activePositions: Record<string, 'BUY' | 'SELL' | null> = {};

// Keep track of position entry prices for P&L calculation
const positionEntryPrices: Record<string, number> = {};

// Trading strategy using SMA crossover with position holding
export async function runTradingStrategy(
  symbol: string = 'NIFTY'
): Promise<PredictionResult> {
  try {
    // Get historical data for the last 3 days with 5-minute candles
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    const historicalData = await dhanService.getHistoricalData(
      symbol,
      '5minute',
      threeDaysAgo,
      now
    );
    
    // Optimize strategy parameters based on performance and market conditions
    const { shortSMA, longSMA, confidenceMultiplier } = await optimizeStrategyParameters(symbol);
    
    // Calculate SMA with optimized parameters
    const sma20 = calculateSMA(historicalData, shortSMA);
    const sma50 = calculateSMA(historicalData, longSMA);
    
    // Get the latest values
    const latestSMA20 = sma20[sma20.length - 1];
    const previousSMA20 = sma20[sma20.length - 2];
    const latestSMA50 = sma50[sma50.length - 1];
    const previousSMA50 = sma50[sma50.length - 2];
    
    // Get the current price (latest close)
    const currentPrice = historicalData[historicalData.length - 1].close;
    
    // Check current position for this symbol
    const currentPosition = activePositions[symbol] || null;
    
    // Determine action based on crossover and current position
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let message = '';
    
    // Golden Cross (SMA20 crosses above SMA50) - Bullish signal
    if (previousSMA20 <= previousSMA50 && latestSMA20 > latestSMA50) {
      // Only BUY if we're not already in a BUY position
      if (currentPosition !== 'BUY') {
        action = 'BUY';
        confidence = 0.75 + (Math.random() * 0.2); // Random confidence between 0.75 and 0.95
        message = `SMA(${shortSMA}) crossed above SMA(${longSMA}) - Golden Cross detected`;
        
        // If we're in SELL position, record the outcome
        if (currentPosition === 'SELL' && positionEntryPrices[symbol]) {
          const successful = currentPrice < positionEntryPrices[symbol];
          recordOutcome(symbol, 'SELL', positionEntryPrices[symbol], currentPrice, successful);
        }
        
        activePositions[symbol] = 'BUY'; // Update position tracker
        positionEntryPrices[symbol] = currentPrice; // Record entry price
      } else {
        action = 'HOLD';
        confidence = 0.65 + (Math.random() * 0.2);
        message = `Already in BUY position - Continue holding as trend is still bullish`;
      }
    }
    // Death Cross (SMA20 crosses below SMA50) - Bearish signal
    else if (previousSMA20 >= previousSMA50 && latestSMA20 < latestSMA50) {
      // Only SELL if we're not already in a SELL position
      if (currentPosition !== 'SELL') {
        action = 'SELL';
        confidence = 0.70 + (Math.random() * 0.2); // Random confidence between 0.70 and 0.90
        message = `SMA(${shortSMA}) crossed below SMA(${longSMA}) - Death Cross detected`;
        
        // If we're in BUY position, record the outcome
        if (currentPosition === 'BUY' && positionEntryPrices[symbol]) {
          const successful = currentPrice > positionEntryPrices[symbol];
          recordOutcome(symbol, 'BUY', positionEntryPrices[symbol], currentPrice, successful);
        }
        
        activePositions[symbol] = 'SELL'; // Update position tracker
        positionEntryPrices[symbol] = currentPrice; // Record entry price
      } else {
        action = 'HOLD';
        confidence = 0.65 + (Math.random() * 0.2);
        message = `Already in SELL position - Continue holding as trend is still bearish`;
      }
    }
    // No crossover, check trends
    else {
      if (latestSMA20 > latestSMA50) {
        // Bullish trend continues
        if (currentPosition === 'SELL') {
          // We're in a SELL position but trend is turning bullish - close position
          action = 'BUY'; // Buy to close sell position
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Closing SELL position as SMA(${shortSMA}) remains above SMA(${longSMA}) - Bullish trend detected`;
          
          // Record the outcome
          if (positionEntryPrices[symbol]) {
            const successful = positionEntryPrices[symbol] > currentPrice;
            recordOutcome(symbol, 'SELL', positionEntryPrices[symbol], currentPrice, successful);
          }
          
          activePositions[symbol] = 'BUY';
          positionEntryPrices[symbol] = currentPrice;
        } else if (currentPosition !== 'BUY') {
          // Not in a position yet, enter BUY
          action = 'BUY';
          confidence = 0.55 + (Math.random() * 0.2);
          message = `SMA(${shortSMA}) remains above SMA(${longSMA}) - Entering bullish trend`;
          activePositions[symbol] = 'BUY';
          positionEntryPrices[symbol] = currentPrice;
        } else {
          // Already in BUY position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `SMA(${shortSMA}) remains above SMA(${longSMA}) - Continue holding bullish position`;
        }
      } else if (latestSMA20 < latestSMA50) {
        // Bearish trend continues
        if (currentPosition === 'BUY') {
          // We're in a BUY position but trend is turning bearish - close position
          action = 'SELL'; // Sell to close buy position
          confidence = 0.60 + (Math.random() * 0.15);
          message = `Closing BUY position as SMA(${shortSMA}) remains below SMA(${longSMA}) - Bearish trend detected`;
          
          // Record the outcome
          if (positionEntryPrices[symbol]) {
            const successful = currentPrice > positionEntryPrices[symbol];
            recordOutcome(symbol, 'BUY', positionEntryPrices[symbol], currentPrice, successful);
          }
          
          activePositions[symbol] = 'SELL';
          positionEntryPrices[symbol] = currentPrice;
        } else if (currentPosition !== 'SELL') {
          // Not in a position yet, enter SELL
          action = 'SELL';
          confidence = 0.55 + (Math.random() * 0.2);
          message = `SMA(${shortSMA}) remains below SMA(${longSMA}) - Entering bearish trend`;
          activePositions[symbol] = 'SELL';
          positionEntryPrices[symbol] = currentPrice;
        } else {
          // Already in SELL position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = `SMA(${shortSMA}) remains below SMA(${longSMA}) - Continue holding bearish position`;
        }
      } else {
        action = 'HOLD';
        confidence = 0.5;
        message = `SMA(${shortSMA}) and SMA(${longSMA}) are nearly equal - No clear trend`;
      }
    }
    
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
      message
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
      message: `Error: ${(error as Error).message}`
    };
  }
}

// Execute trades based on the trading strategy
export async function autoTradeExecutor(
  symbol: string = 'NIFTY',
  quantity: number = 1
): Promise<void> {
  try {
    // Run the trading strategy
    const prediction = await runTradingStrategy(symbol);
    
    // Check if we should execute a trade
    if (prediction.action !== 'HOLD') {
      if (prediction.confidence >= 0.7) {
        // Confidence is high enough for automatic execution
        dhanService.addLog(
          `Auto-executing ${prediction.action} order for ${quantity} ${symbol} @ ₹${prediction.price.toFixed(2)} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
          'info'
        );
        
        // Place the order
        await dhanService.placeOrder(
          symbol,
          prediction.action as 'BUY' | 'SELL', // Type assertion needed since we've checked action !== 'HOLD'
          quantity,
          'MARKET'
        );
      } else {
        // Confidence is too low, manual approval needed
        dhanService.addLog(
          `Decision for ${symbol}: ${prediction.action} (confidence: ${(prediction.confidence * 100).toFixed(1)}%) - Manual approval needed`,
          'warning'
        );
      }
    } else {
      dhanService.addLog(
        `No trade action required for ${symbol}. ${prediction.message}`,
        'info'
      );
    }
  } catch (error) {
    dhanService.addLog(
      `Auto trade execution error for ${symbol}: ${(error as Error).message}`,
      'error'
    );
  }
}

// New function to run the strategy on all available symbols
export async function runAllSymbolsStrategy(): Promise<void> {
  try {
    const { stocks, cryptos } = await dhanService.getAvailableSymbols();
    const allSymbols = [...stocks, ...cryptos];
    
    // Run the strategy for each symbol
    for (const symbol of allSymbols) {
      await autoTradeExecutor(symbol);
    }
  } catch (error) {
    dhanService.addLog(
      `Error running all symbols strategy: ${(error as Error).message}`,
      'error'
    );
  }
}

// New function to stop/close a current trade position
export async function stopCurrentTrade(
  symbol: string,
  currentPosition: 'BUY' | 'SELL',
  quantity: number
): Promise<void> {
  try {
    // To close a position, we need to do the opposite action
    // If current position is BUY, we need to SELL to close it
    // If current position is SELL, we need to BUY to close it
    const closeAction = currentPosition === 'BUY' ? 'SELL' : 'BUY';
    
    dhanService.addLog(
      `Manually closing ${currentPosition} position for ${symbol} with ${closeAction} order for ${quantity} units`,
      'info'
    );
    
    // Place the order to close the position
    await dhanService.placeOrder(
      symbol,
      closeAction,
      quantity,
      'MARKET'
    );
    
    // Update our internal state
    if (activePositions[symbol] === currentPosition) {
      // Get the current price to calculate P&L
      const currentPrice = await dhanService.getCurrentPrice(symbol);
      
      // Record the outcome of this closed position for learning
      if (positionEntryPrices[symbol]) {
        const entryPrice = positionEntryPrices[symbol];
        let successful = false;
        
        if (currentPosition === 'BUY') {
          // For BUY positions, successful if selling price > buying price
          successful = currentPrice > entryPrice;
        } else {
          // For SELL positions, successful if buying price < selling price
          successful = currentPrice < entryPrice;
        }
        
        recordOutcome(symbol, currentPosition, entryPrice, currentPrice, successful);
      }
      
      // Reset position tracking
      activePositions[symbol] = null;
      delete positionEntryPrices[symbol];
    }
    
    return;
  } catch (error) {
    dhanService.addLog(
      `Error closing position for ${symbol}: ${(error as Error).message}`,
      'error'
    );
    throw error;
  }
}
