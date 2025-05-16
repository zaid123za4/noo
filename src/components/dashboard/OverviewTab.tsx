
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PredictionResult, Funds } from '@/services/tradingLearning';

interface OverviewTabProps {
  funds: Funds;
  predictionData: PredictionResult | null;
  selectedSymbol: string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ funds, predictionData, selectedSymbol }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Balance</CardTitle>
            <CardDescription>Current balance in your trading account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{funds.equity.available.cash.toFixed(2)}</div>
            <Progress value={65} className="mt-2" />
            <p className="text-muted-foreground text-sm">65% of target reached</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
            <CardDescription>Summary of your active trading positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Positions</div>
            <p className="text-muted-foreground text-sm">+1.25% today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Profit/Loss</CardTitle>
            <CardDescription>Realized profit and loss for today's trades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+₹1,542.00</div>
            <p className="text-muted-foreground text-sm">Based on completed trades</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Prediction Data Card */}
      {predictionData && (
        <Card>
          <CardHeader>
            <CardTitle>Strategy Prediction</CardTitle>
            <CardDescription>Based on SMA Crossover</CardDescription>
          </CardHeader>
          <CardContent>
            <p><strong>Symbol:</strong> {selectedSymbol}</p>
            <p><strong>Action:</strong> {predictionData.action}</p>
            <p><strong>Confidence:</strong> {(predictionData.confidence * 100).toFixed(1)}%</p>
            <p><strong>Price:</strong> ₹{predictionData.price.toFixed(2)}</p>
            <p><strong>Signal Strength:</strong> {predictionData.signalStrength}%</p>
            <p><strong>Message:</strong> {predictionData.message}</p>
          </CardContent>
          <CardFooter>
            <p className="text-muted-foreground text-sm">
              Last updated: {predictionData.timestamp.toLocaleTimeString()}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default OverviewTab;
