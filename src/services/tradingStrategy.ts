
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

// Trading strategy using SMA crossover
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
    
    // Determine action based on crossover
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let message = '';
    
    // Golden Cross (SMA20 crosses above SMA50) - Bullish signal
    if (previousSMA20 <= previousSMA50 && latestSMA20 > latestSMA50) {
      action = 'BUY';
      confidence = 0.75 + (Math.random() * 0.2); // Random confidence between 0.75 and 0.95
      message = 'SMA(20) crossed above SMA(50) - Golden Cross detected';
    }
    // Death Cross (SMA20 crosses below SMA50) - Bearish signal
    else if (previousSMA20 >= previousSMA50 && latestSMA20 < latestSMA50) {
      action = 'SELL';
      confidence = 0.70 + (Math.random() * 0.2); // Random confidence between 0.70 and 0.90
      message = 'SMA(20) crossed below SMA(50) - Death Cross detected';
    }
    // No crossover, check trends
    else {
      if (latestSMA20 > latestSMA50) {
        action = 'BUY';
        confidence = 0.55 + (Math.random() * 0.2); // Lower confidence as it's not a fresh signal
        message = 'SMA(20) remains above SMA(50) - Bullish trend continues';
      } else if (latestSMA20 < latestSMA50) {
        action = 'SELL';
        confidence = 0.55 + (Math.random() * 0.2);
        message = 'SMA(20) remains below SMA(50) - Bearish trend continues';
      } else {
        action = 'HOLD';
        confidence = 0.5;
        message = 'SMA(20) and SMA(50) are nearly equal - No clear trend';
      }
    }
    
    // Log the prediction
    zerodhaService.addLog(
      `Strategy prediction: ${action} with ${(confidence * 100).toFixed(1)}% confidence. ${message}`,
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
    zerodhaService.addLog(`Strategy error: ${(error as Error).message}`, 'error');
    
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
          prediction.action,
          quantity,
          'MARKET'
        );
      } else {
        // Confidence is too low, manual approval needed
        zerodhaService.addLog(
          `Decision: ${prediction.action} (confidence: ${(prediction.confidence * 100).toFixed(1)}%) - Manual approval needed`,
          'warning'
        );
      }
    } else {
      zerodhaService.addLog(
        `No trade action required. ${prediction.message}`,
        'info'
      );
    }
  } catch (error) {
    zerodhaService.addLog(
      `Auto trade execution error: ${(error as Error).message}`,
      'error'
    );
  }
}
