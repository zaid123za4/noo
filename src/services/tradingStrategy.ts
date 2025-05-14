
// This file re-exports all trading functionality from the new modules
// for backward compatibility
import { 
  runTradingStrategy,
  autoTradeExecutor,
  runAllSymbolsStrategy,
  executeManualTrade,
  stopCurrentTrade,
  getSignalStrength,
  getCurrentPosition,
  getChartProvider,
  isMarketOpen,
  isCrypto
} from './trading';

// Re-export all functions
export {
  runTradingStrategy,
  autoTradeExecutor,
  runAllSymbolsStrategy,
  executeManualTrade,
  stopCurrentTrade,
  getSignalStrength,
  getCurrentPosition,
  getChartProvider,
  isMarketOpen,
  isCrypto
};
