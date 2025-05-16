
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PredictionResult } from '@/services/tradingLearning';
import { runTradingStrategy } from '@/services/trading/tradingStrategy';

export function useTradingStrategy() {
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  const [strategyRunning, setStrategyRunning] = useState<boolean>(false);
  
  // Handle instrument selection
  const handleSymbolSelect = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setPredictionData(null); // Clear previous prediction data
    
    // Run strategy immediately after symbol selection
    setStrategyRunning(true);
    try {
      const prediction = await runTradingStrategy(symbol);
      setPredictionData(prediction);
    } catch (error) {
      console.error('Error running trading strategy:', error);
      toast({
        title: "Strategy Error",
        description: `Failed to run trading strategy for ${symbol}.`,
        variant: "destructive"
      });
      setPredictionData({
        action: 'HOLD',
        confidence: 0,
        timestamp: new Date(),
        price: 0,
        message: `Error: ${(error as Error).message}`,
        signalStrength: 50
      });
    } finally {
      setStrategyRunning(false);
    }
  };
  
  // Run trading strategy
  const handleRunStrategy = async () => {
    setStrategyRunning(true);
    try {
      const prediction = await runTradingStrategy(selectedSymbol);
      setPredictionData(prediction);
    } catch (error) {
      console.error('Error running trading strategy:', error);
      toast({
        title: "Strategy Error",
        description: `Failed to run trading strategy for ${selectedSymbol}.`,
        variant: "destructive"
      });
      setPredictionData({
        action: 'HOLD',
        confidence: 0,
        timestamp: new Date(),
        price: 0,
        message: `Error: ${(error as Error).message}`,
        signalStrength: 50
      });
    } finally {
      setStrategyRunning(false);
    }
  };
  
  return {
    selectedSymbol,
    predictionData,
    strategyRunning,
    handleSymbolSelect,
    handleRunStrategy
  };
}
