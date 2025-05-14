
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";

const AdminPanel: React.FC = () => {
  const [amount, setAmount] = useState<string>('10000');
  const [symbol, setSymbol] = useState<string>('NIFTY50');
  
  const handleAddFunds = () => {
    toast({
      title: "Funds added",
      description: `₹${amount} added to your account`,
    });
  };

  const handleForceSignal = (signal: 'BUY' | 'SELL') => {
    toast({
      title: `Force ${signal} signal`,
      description: `${signal} signal executed for ${symbol}`,
    });
  };

  const handleAdjustPrices = (direction: 'up' | 'down') => {
    toast({
      title: "Market manipulation",
      description: `${symbol} price adjusted ${direction}`,
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <Button variant="outline">Back to App</Button>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>Add unlimited funds to account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddFunds} className="w-full">Add Funds</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Force Signals</CardTitle>
              <CardDescription>Force buy/sell signals for any symbol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input 
                  id="symbol" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button 
                onClick={() => handleForceSignal('BUY')} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Force Buy
              </Button>
              <Button 
                onClick={() => handleForceSignal('SELL')} 
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Force Sell
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Control</CardTitle>
              <CardDescription>Manipulate market prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="market-symbol">Symbol</Label>
                <Input 
                  id="market-symbol" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button 
                onClick={() => handleAdjustPrices('up')} 
                className="flex-1"
              >
                Push Price Up
              </Button>
              <Button 
                onClick={() => handleAdjustPrices('down')} 
                className="flex-1"
              >
                Push Price Down
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
