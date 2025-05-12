import zerodhaService, { MarketData, PredictionResult } from './zerodhaService';

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

// Trading strategy using SMA crossover with position holding
export async function runTradingStrategy(
  symbol: string = 'NIFTY'
): Promise<PredictionResult> {
  try {
    // Get historical data for the last 3 days with 5-minute candles
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    const historicalData = await zerodhaService.getHistoricalData(
      symbol,
      '5minute',
      threeDaysAgo,
      now
    );
    
    // Calculate SMA 20 and SMA 50
    const sma20 = calculateSMA(historicalData, 20);
    const sma50 = calculateSMA(historicalData, 50);
    
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
        message = 'SMA(20) crossed above SMA(50) - Golden Cross detected';
        activePositions[symbol] = 'BUY'; // Update position tracker
      } else {
        action = 'HOLD';
        confidence = 0.65 + (Math.random() * 0.2);
        message = 'Already in BUY position - Continue holding as trend is still bullish';
      }
    }
    // Death Cross (SMA20 crosses below SMA50) - Bearish signal
    else if (previousSMA20 >= previousSMA50 && latestSMA20 < latestSMA50) {
      // Only SELL if we're not already in a SELL position
      if (currentPosition !== 'SELL') {
        action = 'SELL';
        confidence = 0.70 + (Math.random() * 0.2); // Random confidence between 0.70 and 0.90
        message = 'SMA(20) crossed below SMA(50) - Death Cross detected';
        activePositions[symbol] = 'SELL'; // Update position tracker
      } else {
        action = 'HOLD';
        confidence = 0.65 + (Math.random() * 0.2);
        message = 'Already in SELL position - Continue holding as trend is still bearish';
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
          message = 'Closing SELL position as SMA(20) remains above SMA(50) - Bullish trend detected';
          activePositions[symbol] = 'BUY';
        } else if (currentPosition !== 'BUY') {
          // Not in a position yet, enter BUY
          action = 'BUY';
          confidence = 0.55 + (Math.random() * 0.2);
          message = 'SMA(20) remains above SMA(50) - Entering bullish trend';
          activePositions[symbol] = 'BUY';
        } else {
          // Already in BUY position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = 'SMA(20) remains above SMA(50) - Continue holding bullish position';
        }
      } else if (latestSMA20 < latestSMA50) {
        // Bearish trend continues
        if (currentPosition === 'BUY') {
          // We're in a BUY position but trend is turning bearish - close position
          action = 'SELL'; // Sell to close buy position
          confidence = 0.60 + (Math.random() * 0.15);
          message = 'Closing BUY position as SMA(20) remains below SMA(50) - Bearish trend detected';
          activePositions[symbol] = 'SELL';
        } else if (currentPosition !== 'SELL') {
          // Not in a position yet, enter SELL
          action = 'SELL';
          confidence = 0.55 + (Math.random() * 0.2);
          message = 'SMA(20) remains below SMA(50) - Entering bearish trend';
          activePositions[symbol] = 'SELL';
        } else {
          // Already in SELL position
          action = 'HOLD';
          confidence = 0.60 + (Math.random() * 0.15);
          message = 'SMA(20) remains below SMA(50) - Continue holding bearish position';
        }
      } else {
        action = 'HOLD';
        confidence = 0.5;
        message = 'SMA(20) and SMA(50) are nearly equal - No clear trend';
      }
    }
    
    // Log the prediction
    zerodhaService.addLog(
      `Strategy prediction for ${symbol}: ${action} with ${(confidence * 100).toFixed(1)}% confidence. ${message}`,
      'info'
    );
    
    return {
      action,
      confidence,
      timestamp: new Date(),
      price: currentPrice,
      message
    };
  } catch (error) {
    zerodhaService.addLog(`Strategy error for ${symbol}: ${(error as Error).message}`, 'error');
    
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
        zerodhaService.addLog(
          `Auto-executing ${prediction.action} order for ${quantity} ${symbol} @ ₹${prediction.price.toFixed(2)} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
          'info'
        );
        
        // Place the order
        await zerodhaService.placeOrder(
          symbol,
          prediction.action as 'BUY' | 'SELL', // Type assertion needed since we've checked action !== 'HOLD'
          quantity,
          'MARKET'
        );
      } else {
        // Confidence is too low, manual approval needed
        zerodhaService.addLog(
          `Decision for ${symbol}: ${prediction.action} (confidence: ${(prediction.confidence * 100).toFixed(1)}%) - Manual approval needed`,
          'warning'
        );
      }
    } else {
      zerodhaService.addLog(
        `No trade action required for ${symbol}. ${prediction.message}`,
        'info'
      );
    }
  } catch (error) {
    zerodhaService.addLog(
      `Auto trade execution error for ${symbol}: ${(error as Error).message}`,
      'error'
    );
  }
}

// New function to run the strategy on all available symbols
export async function runAllSymbolsStrategy(): Promise<void> {
  try {
    const { stocks, cryptos } = await zerodhaService.getAvailableSymbols();
    const allSymbols = [...stocks, ...cryptos];
    
    // Run the strategy for each symbol
    for (const symbol of allSymbols) {
      await autoTradeExecutor(symbol);
    }
  } catch (error) {
    zerodhaService.addLog(
      `Error running all symbols strategy: ${(error as Error).message}`,
      'error'
    );
  }
}
