
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
import zerodhaService from '@/services/zerodhaService';

interface InstrumentSelectorProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ onSymbolSelect, selectedSymbol }) => {
  const [stocksList, setStocksList] = useState<string[]>([]);
  const [cryptosList, setCryptosList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentType, setInstrumentType] = useState<'stocks' | 'crypto'>('stocks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        setLoading(true);
        const { stocks, cryptos } = await zerodhaService.getAvailableSymbols();
        setStocksList(stocks);
        setCryptosList(cryptos);
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
            {filteredInstruments.map((instrument) => (
              <button
                key={instrument}
                className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground ${
                  selectedSymbol === instrument ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => onSymbolSelect(instrument)}
              >
                {instrument}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">No instruments found</div>
        )}
      </div>
    </div>
  );
};

export default InstrumentSelector;
