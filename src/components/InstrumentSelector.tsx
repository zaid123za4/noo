
import React, { useEffect, useState } from 'react';
import { Search, Brain } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import dhanService from '@/services/dhanService';
import { PredictionResult } from '@/services/dhanService';
import { getSymbolPerformance } from '@/services/tradingLearning';

interface InstrumentSelectorProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
  predictionData?: PredictionResult | null;
}

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ 
  onSymbolSelect, 
  selectedSymbol,
  predictionData 
}) => {
  const [stocksList, setStocksList] = useState<string[]>([]);
  const [cryptosList, setCryptosList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentType, setInstrumentType] = useState<'stocks' | 'crypto'>('stocks');
  const [loading, setLoading] = useState(true);
  const [symbolsWithLearning, setSymbolsWithLearning] = useState<Record<string, {
    successRate: number;
    adjustmentFactor: number;
  }>>({});

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setLoading(true);
        const { stocks, cryptos } = await dhanService.getAvailableSymbols();
        setStocksList(stocks);
        setCryptosList(cryptos);
        
        // Get learning data for all symbols
        const learningData: Record<string, {
          successRate: number;
          adjustmentFactor: number;
        }> = {};
        
        [...stocks, ...cryptos].forEach(symbol => {
          const performance = getSymbolPerformance(symbol);
          if (performance && performance.totalTrades > 0) {
            learningData[symbol] = {
              successRate: performance.successRate,
              adjustmentFactor: performance.adjustmentFactor
            };
          }
        });
        
        setSymbolsWithLearning(learningData);
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, []);

  const filteredInstruments = instrumentType === 'stocks'
    ? stocksList.filter(stock => stock.toLowerCase().includes(searchQuery.toLowerCase()))
    : cryptosList.filter(crypto => crypto.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select
          value={instrumentType}
          onValueChange={(value: 'stocks' | 'crypto') => setInstrumentType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Instrument Type</SelectLabel>
              <SelectItem value="stocks">Stocks</SelectItem>
              <SelectItem value="crypto">Cryptocurrencies</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search instruments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-md max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading instruments...</div>
        ) : filteredInstruments.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredInstruments.map((instrument) => {
              const hasLearningData = symbolsWithLearning[instrument];
              
              return (
                <button
                  key={instrument}
                  className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground ${
                    selectedSymbol === instrument ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => onSymbolSelect(instrument)}
                >
                  <div className="flex justify-between items-center">
                    <span>{instrument}</span>
                    <div className="flex items-center gap-2">
                      {hasLearningData && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center ${
                              hasLearningData.successRate > 0.6 
                                ? 'text-trade-buy' 
                                : hasLearningData.successRate < 0.4 
                                  ? 'text-trade-sell' 
                                  : 'text-muted-foreground'
                            }`}>
                              <Brain className="h-3.5 w-3.5" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI learning: {(hasLearningData.successRate * 100).toFixed(1)}% success rate</p>
                            <p>Confidence adjustment: ×{hasLearningData.adjustmentFactor.toFixed(2)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {predictionData && selectedSymbol === instrument && (
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          predictionData.action === 'BUY' 
                            ? 'bg-trade-buy/20 text-trade-buy' 
                            : predictionData.action === 'SELL'
                              ? 'bg-trade-sell/20 text-trade-sell'
                              : 'bg-muted/20 text-muted-foreground'
                          }`}>
                          {predictionData.action}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">No instruments found</div>
        )}
      </div>

      {selectedSymbol && predictionData && (
        <div className={`p-4 rounded-md border ${
          predictionData.action === 'BUY' 
            ? 'bg-trade-buy/10 border-trade-buy/30' 
            : predictionData.action === 'SELL'
              ? 'bg-trade-sell/10 border-trade-sell/30'
              : 'bg-muted/10 border-border'
          }`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">{selectedSymbol} Prediction</h4>
            <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
              predictionData.action === 'BUY' 
                ? 'bg-trade-buy/30 text-trade-buy' 
                : predictionData.action === 'SELL'
                  ? 'bg-trade-sell/30 text-trade-sell'
                  : 'bg-muted/30 text-muted-foreground'
              }`}>
              {predictionData.action}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="text-muted-foreground">Confidence:</div>
            <div className="text-right">{(predictionData.confidence * 100).toFixed(1)}%</div>
            
            <div className="text-muted-foreground">Price:</div>
            <div className="text-right font-mono">₹{predictionData.price.toFixed(2)}</div>
          </div>
          
          <p className="text-xs mt-2 text-muted-foreground">{predictionData.message}</p>
        </div>
      )}
    </div>
  );
};

export default InstrumentSelector;
