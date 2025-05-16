
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import InstrumentSelector from '@/components/InstrumentSelector';
import { PredictionResult } from '@/services/tradingLearning';

interface InstrumentSelectorCardProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
  predictionData: PredictionResult | null;
  handleRunStrategy: () => void;
  strategyRunning: boolean;
  isAutoMode: boolean;
  toggleTradingMode: () => void;
}

const InstrumentSelectorCard: React.FC<InstrumentSelectorCardProps> = ({
  onSymbolSelect,
  selectedSymbol,
  predictionData,
  handleRunStrategy,
  strategyRunning,
  isAutoMode,
  toggleTradingMode
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Select Instrument</CardTitle>
        <CardDescription>Choose an instrument to analyze and trade.</CardDescription>
      </CardHeader>
      <CardContent>
        <InstrumentSelector
          onSymbolSelect={onSymbolSelect}
          selectedSymbol={selectedSymbol}
          predictionData={predictionData}
        />
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button onClick={handleRunStrategy} disabled={strategyRunning}>
          {strategyRunning ? 'Running Strategy...' : 'Run Strategy'}
        </Button>
        <Switch 
          id="automated" 
          checked={isAutoMode} 
          onCheckedChange={toggleTradingMode} 
        />
        <Label htmlFor="automated" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          Automated Trading
        </Label>
      </CardFooter>
    </Card>
  );
};

export default InstrumentSelectorCard;
