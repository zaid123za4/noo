
import dhanService from '../dhanService';
import { runTradingStrategy } from './tradingStrategy';
import { isMarketOpen, isCrypto } from './utils';
import { 
  getCurrentPosition, 
  getPositionEntryPrice, 
  updatePosition, 
  clearPosition
} from './positionTracker';
import { recordOutcome } from '../tradingLearning';
import { toast } from "@/components/ui/use-toast";

// Execute trades based on the trading strategy
export async function autoTradeExecutor(
  symbol: string = 'CRYPTO_BTC', // Default to Bitcoin trading
  quantity: number = 1
): Promise<void> {
  try {
    // Run the trading strategy
    const prediction = await runTradingStrategy(symbol);
    
    // Check if we should execute a trade
    if (prediction.action !== 'HOLD') {
      // Check if market is open for non-crypto assets
      if (!isCrypto(symbol) && !isMarketOpen()) {
        dhanService.addLog(
          `Cannot execute ${prediction.action} order for ${symbol} - Market is closed.`,
          'warning'
        );
        
        toast({
          title: "Market Closed",
          description: `Cannot execute ${prediction.action} order for ${symbol}. Trading available between 9:15 AM and 3:30 PM on weekdays.`,
          variant: "destructive",
        });
        
        return;
      }
      
      // For Bitcoin, we want to be more aggressive with trades
      const confidenceThreshold = symbol === 'CRYPTO_BTC' ? 0.6 : 0.7;
      
      if (prediction.confidence >= confidenceThreshold) {
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
          'MARKET',
          true  // Flag to indicate AI-initiated trade
        );
        
        toast({
          title: "AI Trade Executed",
          description: `${prediction.action} ${quantity} ${symbol} @ ₹${prediction.price.toFixed(2)}`,
        });
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

// Run the Bitcoin trading strategy at regular intervals
let btcAutoTradeInterval: NodeJS.Timeout | null = null;

export function startBitcoinAutoTrading(intervalMinutes: number = 5): void {
  if (btcAutoTradeInterval) {
    clearInterval(btcAutoTradeInterval);
  }
  
  // Execute immediately once
  autoTradeExecutor('CRYPTO_BTC');
  
  // Then set interval
  btcAutoTradeInterval = setInterval(() => {
    autoTradeExecutor('CRYPTO_BTC');
  }, intervalMinutes * 60 * 1000);
  
  dhanService.addLog(
    `Bitcoin auto-trading started with ${intervalMinutes} minute intervals`,
    'info'
  );
  
  toast({
    title: "Bitcoin Auto-Trading Activated",
    description: `AI will trade BTC every ${intervalMinutes} minutes`,
  });
}

export function stopBitcoinAutoTrading(): void {
  if (btcAutoTradeInterval) {
    clearInterval(btcAutoTradeInterval);
    btcAutoTradeInterval = null;
    
    dhanService.addLog('Bitcoin auto-trading stopped', 'info');
    
    toast({
      title: "Bitcoin Auto-Trading Stopped",
      description: "AI trading for BTC has been deactivated",
    });
  }
}

export function isBitcoinAutoTradingActive(): boolean {
  return btcAutoTradeInterval !== null;
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

// Execute manual trade for a symbol
export async function executeManualTrade(
  symbol: string,
  action: 'BUY' | 'SELL',
  quantity: number = 1
): Promise<boolean> {
  try {
    // Check if market is open for non-crypto assets
    if (!isCrypto(symbol) && !isMarketOpen()) {
      dhanService.addLog(
        `Cannot execute manual ${action} order for ${symbol} - Market is closed.`,
        'warning'
      );
      
      toast({
        title: "Market Closed",
        description: `Cannot execute ${action} order for ${symbol}. Trading available between 9:15 AM and 3:30 PM on weekdays.`,
        variant: "destructive",
      });
      
      return false;
    }
    
    // Get current price
    const currentPrice = await dhanService.getCurrentPrice(symbol);
    
    dhanService.addLog(
      `Manually executing ${action} order for ${quantity} ${symbol} @ ₹${currentPrice.toFixed(2)}`,
      'info'
    );
    
    // Place the order
    await dhanService.placeOrder(
      symbol,
      action,
      quantity,
      'MARKET'
    );
    
    // Update our internal state if the order was successful
    if (action === 'BUY' || action === 'SELL') {
      // If we're switching positions, record outcome of previous position
      const currentPosition = getCurrentPosition(symbol);
      if (currentPosition && currentPosition !== action) {
        const entryPrice = getPositionEntryPrice(symbol);
        if (entryPrice) {
          const successful = currentPosition === 'BUY' ? 
            currentPrice > entryPrice : 
            currentPrice < entryPrice;
          
          recordOutcome(symbol, currentPosition, entryPrice, currentPrice, successful);
        }
      }
      
      // Update position tracking
      updatePosition(symbol, action, currentPrice);
    }
    
    return true;
  } catch (error) {
    dhanService.addLog(
      `Manual trade execution error for ${symbol}: ${(error as Error).message}`,
      'error'
    );
    return false;
  }
}

// Stop/close a current trade position
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
    
    // Check if market is open for non-crypto assets
    if (!isCrypto(symbol) && !isMarketOpen()) {
      dhanService.addLog(
        `Cannot close position for ${symbol} - Market is closed.`,
        'warning'
      );
      
      toast({
        title: "Market Closed",
        description: `Cannot close position for ${symbol}. Trading available between 9:15 AM and 3:30 PM on weekdays.`,
        variant: "destructive",
      });
      
      throw new Error(`Market is closed for ${symbol}`);
    }
    
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
    if (getCurrentPosition(symbol) === currentPosition) {
      // Get the current price to calculate P&L
      const currentPrice = await dhanService.getCurrentPrice(symbol);
      
      // Record the outcome of this closed position for learning
      const entryPrice = getPositionEntryPrice(symbol);
      if (entryPrice) {
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
      clearPosition(symbol);
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
