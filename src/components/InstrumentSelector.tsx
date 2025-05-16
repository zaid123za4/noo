
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import dhanService from '@/services/dhanService';
import { PredictionResult } from '@/services/tradingLearning';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [filteredInstruments, setFilteredInstruments] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    // Load available instruments
    try {
      // Get available symbols from dhanService
      const getSymbols = async () => {
        let availableInstruments: string[] = [];
        
        // Check if getAvailableSymbols exists first
        if (typeof dhanService.getAvailableSymbols === 'function') {
          const symbols = await dhanService.getAvailableSymbols();
          
          // Handle different return types
          if (Array.isArray(symbols)) {
            availableInstruments = symbols;
          } else if (symbols && typeof symbols === 'object') {
            // If it returns an object with stocks and cryptos arrays
            availableInstruments = [
              ...(symbols.stocks || []),
              ...(symbols.cryptos || [])
            ];
          }
        }
        
        // If no symbols were found, use default fallback values
        if (availableInstruments.length === 0) {
          availableInstruments = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFC', 'INFY'];
        }
        
        setInstruments(availableInstruments);
        setFilteredInstruments(availableInstruments);
      };
      
      getSymbols();
    } catch (error) {
      console.error('Error loading instruments:', error);
      // Provide some default instruments as fallback
      const defaultInstruments = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFC', 'INFY'];
      setInstruments(defaultInstruments);
      setFilteredInstruments(defaultInstruments);
    }
  }, []);

  useEffect(() => {
    // Filter instruments based on search term and category
    let filtered = instruments;
    
    if (searchTerm) {
      filtered = filtered.filter(instrument => 
        instrument.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(instrument => {
        if (category === 'indices') {
          return ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].some(
            index => instrument.includes(index)
          );
        } else if (category === 'stocks') {
          return !['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'BTC', 'ETH'].some(
            nonStock => instrument.includes(nonStock)
          );
        } else if (category === 'crypto') {
          return ['BTC', 'ETH'].some(crypto => instrument.includes(crypto));
        }
        return true;
      });
    }
    
    setFilteredInstruments(filtered);
  }, [searchTerm, category, instruments]);

  const handleSymbolSelect = (value: string) => {
    onSymbolSelect(value);
  };

  const renderPredictionBadge = () => {
    if (!predictionData) return null;
    
    return (
      <Badge variant="outline" className={`ml-2 ${
        predictionData.action === 'BUY' 
          ? 'bg-green-500/10 text-green-500 border-green-500/30' 
          : predictionData.action === 'SELL'
            ? 'bg-red-500/10 text-red-500 border-red-500/30'
            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
        }`}>
        {predictionData.action === 'BUY' && <ArrowUp className="h-3 w-3 mr-1" />}
        {predictionData.action === 'SELL' && <ArrowDown className="h-3 w-3 mr-1" />}
        {predictionData.action === 'HOLD' && <Minus className="h-3 w-3 mr-1" />}
        {predictionData.action}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              <SelectItem value="all">All Instruments</SelectItem>
              <SelectItem value="indices">Indices</SelectItem>
              <SelectItem value="stocks">Stocks</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Input
          type="text"
          placeholder="Search instruments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <Select value={selectedSymbol} onValueChange={handleSymbolSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an instrument" />
          {selectedSymbol && renderPredictionBadge()}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Instruments</SelectLabel>
            {filteredInstruments.length > 0 ? (
              filteredInstruments.map((instrument) => (
                <SelectItem key={instrument} value={instrument}>
                  {instrument}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No matching instruments
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {filteredInstruments.length > 10 && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredInstruments.length} instruments. Use search to narrow down results.
        </p>
      )}
    </div>
  );
};

export default InstrumentSelector;
