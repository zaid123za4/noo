
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import zerodhaService, { UserProfile, Funds, Order, PredictionResult } from '@/services/zerodhaService';
import { ArrowDown, ArrowUp, Clock, DollarSign, History, LineChart, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { autoTradeExecutor, runTradingStrategy, runAllSymbolsStrategy } from '@/services/tradingStrategy';
import { useNavigate } from 'react-router-dom';
import InstrumentSelector from './InstrumentSelector';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [funds, setFunds] = useState<Funds | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<{ timestamp: Date; message: string; type: string; }[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoTradeActive, setAutoTradeActive] = useState(false);
  const [autoTradeInterval, setAutoTradeIntervalState] = useState<NodeJS.Timeout | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeAllSymbols, setTradeAllSymbols] = useState(false);
  
  // Check if user is logged in
  useEffect(() => {
    if (!zerodhaService.isAuthenticated()) {
      navigate('/');
      return;
    }
    
    loadData();
    
    // Start periodic data refresh
    const refreshInterval = setInterval(loadData, 10000);
    
    // Clean up
    return () => {
      clearInterval(refreshInterval);
      if (autoTradeInterval) clearInterval(autoTradeInterval);
    };
  }, [navigate]);
  
  useEffect(() => {
    // Reload prediction when selected symbol changes
    if (selectedSymbol) {
      loadPredictionForSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const profileData = await zerodhaService.getProfile();
      const fundsData = await zerodhaService.getFunds();
      const orderData = zerodhaService.getOrders();
      const logData = zerodhaService.getLogs();
      
      setProfile(profileData);
      setFunds(fundsData);
      setOrders(orderData);
      setLogs(logData);
      
      if (selectedSymbol) {
        await loadPredictionForSymbol(selectedSymbol);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadPredictionForSymbol = async (symbol: string) => {
    try {
      // Run the trading strategy to get the latest prediction
      const prediction = await runTradingStrategy(symbol);
      setLatestPrediction(prediction);
    } catch (error) {
      console.error(`Error getting prediction for ${symbol}:`, error);
      toast({
        title: 'Prediction Error',
        description: `Failed to load prediction for ${symbol}`,
        variant: 'destructive',
      });
    }
  };
  
  const toggleAutoTrade = () => {
    if (autoTradeActive) {
      // Stop auto trading
      if (autoTradeInterval) clearInterval(autoTradeInterval);
      setAutoTradeIntervalState(null);
      setAutoTradeActive(false);
      toast({
        title: 'Auto Trading Stopped',
        description: 'The auto trading system is now paused.',
      });
    } else {
      // Start auto trading
      const interval = setInterval(async () => {
        if (tradeAllSymbols) {
          await runAllSymbolsStrategy();
        } else {
          await autoTradeExecutor(selectedSymbol, tradeQuantity);
        }
        loadData(); // Refresh data after each trading attempt
      }, 30000); // Run every 30 seconds
      
      setAutoTradeIntervalState(interval);
      setAutoTradeActive(true);
      
      toast({
        title: 'Auto Trading Started',
        description: tradeAllSymbols 
          ? 'The system will check all symbols for trade signals every 30 seconds.'
          : `The system will check ${selectedSymbol} for trade signals every 30 seconds.`,
      });
      
      // Run once immediately
      if (tradeAllSymbols) {
        runAllSymbolsStrategy();
      } else {
        autoTradeExecutor(selectedSymbol, tradeQuantity);
      }
    }
  };
  
  // Handle manual trade execution
  const executeManualTrade = async () => {
    if (!latestPrediction || latestPrediction.action === 'HOLD') return;
    
    try {
      await zerodhaService.placeOrder(
        selectedSymbol,
        latestPrediction.action as 'BUY' | 'SELL', // We already checked it's not 'HOLD'
        tradeQuantity,
        'MARKET'
      );
      
      // Refresh data
      loadData();
      
      toast({
        title: 'Trade Executed',
        description: `${latestPrediction.action} order for ${selectedSymbol} placed successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Trade Failed',
        description: `Failed to place ${latestPrediction.action} order: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };
  
  // Function to format a number as INR
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Generate TradingView chart URL based on selected symbol
  const getTradingViewUrl = (symbol: string): string => {
    let exchange = 'NSE';
    let tvSymbol = symbol;
    
    // Handle crypto symbols
    if (symbol.startsWith('CRYPTO_')) {
      exchange = 'BINANCE';
      tvSymbol = symbol.replace('CRYPTO_', '') + 'USDT';
    }
    
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${exchange}%3A${tvSymbol}&interval=5&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&studies_overrides=%5B%7B%22id%22%3A%22MASimple%40tv-basicstudies%22%2C%22inputs%22%3A%7B%22length%22%3A20%2C%22color%22%3A%22rgb%2830%2C%20201%2C%20220%29%22%7D%7D%2C%7B%22id%22%3A%22MASimple%40tv-basicstudies_1%22%2C%22inputs%22%3A%7B%22length%22%3A50%2C%22color%22%3A%22rgb%28241%2C%20158%2C%2077%29%22%7D%7D%5D&utm_source=app.lovable.dev&utm_medium=widget&utm_campaign=chart`;
  };
  
  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-primary animate-pulse-slow">Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Zerodha Auto Trader</h1>
            <p className="text-muted-foreground">
              AI-powered trading system for Zerodha
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={autoTradeActive ? "destructive" : "default"}
              onClick={toggleAutoTrade}
            >
              {autoTradeActive ? 'Stop Auto Trading' : 'Start Auto Trading'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Logout
            </Button>
          </div>
        </div>
        
        {/* User profile and funds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono">{profile?.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{profile?.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono">{profile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{profile?.user_type}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Account Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash Available</span>
                  <span className="font-mono">{funds && formatCurrency(funds.equity.available.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collateral</span>
                  <span className="font-mono">{funds && formatCurrency(funds.equity.available.collateral)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">M2M Unrealized</span>
                  <span className={`font-mono ${funds && funds.equity.utilized.m2m_unrealised > 0 ? 'text-trade-buy' : funds && funds.equity.utilized.m2m_unrealised < 0 ? 'text-trade-sell' : ''}`}>
                    {funds && formatCurrency(funds.equity.utilized.m2m_unrealised)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Latest Signal</CardTitle>
            </CardHeader>
            <CardContent>
              {latestPrediction ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol</span>
                    <span className="font-mono font-bold">{selectedSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Action</span>
                    <span className={`font-mono font-bold ${
                      latestPrediction.action === 'BUY' 
                        ? 'text-trade-buy' 
                        : latestPrediction.action === 'SELL'
                          ? 'text-trade-sell'
                          : 'text-trade-neutral'
                    }`}>
                      {latestPrediction.action}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className={`font-mono ${latestPrediction.confidence >= 0.7 ? 'text-trade-buy' : 'text-trade-neutral'}`}>
                      {(latestPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-mono">₹{latestPrediction.price.toFixed(2)}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">{latestPrediction.message}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <span className="text-muted-foreground">No signals yet</span>
                </div>
              )}
              {latestPrediction && latestPrediction.confidence < 0.7 && latestPrediction.action !== 'HOLD' && (
                <div className="mt-3">
                  <Button variant="outline" className="w-full" onClick={executeManualTrade}>
                    Execute Manual Trade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Instrument Selector and Settings */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Trading Settings</CardTitle>
            <CardDescription>Select instrument and quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Instrument</h3>
                <InstrumentSelector
                  onSymbolSelect={setSelectedSymbol}
                  selectedSymbol={selectedSymbol}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Trade Quantity</h3>
                  <input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="tradeAll" 
                    checked={tradeAllSymbols}
                    onChange={(e) => setTradeAllSymbols(e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="tradeAll">
                    Trade all available instruments
                  </label>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md mt-4">
                  <p className="text-xs text-muted-foreground">
                    When auto-trading is enabled, real trades will be executed from your Zerodha account based on the strategy signals.
                    Profits and losses will directly affect your actual Zerodha balance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Chart */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">{selectedSymbol} Chart</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <div className="tradingview-widget-container w-full h-full">
              <iframe 
                src={getTradingViewUrl(selectedSymbol)}
                title={`${selectedSymbol} Chart`}
                className="w-full h-full"
                frameBorder="0"
                // Use lowercase for HTML attribute to avoid React warning
                allowTransparency={true}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for orders and logs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-2 max-w-[400px]">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Trade History</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>System Logs</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card className="border-border/50 bg-card/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Trade History</CardTitle>
                <CardDescription>
                  Recent trading activity and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border-b border-border/50 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`${
                                  order.type === 'BUY' 
                                  ? 'bg-trade-buy/10 text-trade-buy border-trade-buy/30' 
                                  : 'bg-trade-sell/10 text-trade-sell border-trade-sell/30'
                                }`}
                              >
                                {order.type}
                              </Badge>
                              <span className="font-medium">{order.symbol}</span>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  order.status === 'COMPLETE' 
                                  ? 'bg-trade-buy/10 text-trade-buy border-trade-buy/30' 
                                  : 'bg-destructive/10 text-destructive border-destructive/30'
                                }`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            
                            <div className="mt-1 flex items-center space-x-3">
                              <span className="text-xs text-muted-foreground">
                                {order.timestamp.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {order.id}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-mono">₹{order.price.toFixed(2)} × {order.quantity}</div>
                            <div className="font-mono font-semibold mt-1">
                              {formatCurrency(order.price * order.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card className="border-border/50 bg-card/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">System Logs</CardTitle>
                <CardDescription>
                  Activity and diagnostic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="flex border-b border-border/30 pb-2 last:border-0">
                        <div className="mr-3 flex-shrink-0 pt-0.5">
                          {log.type === 'info' && <Info className="h-4 w-4 text-blue-400" />}
                          {log.type === 'success' && <ArrowUp className="h-4 w-4 text-trade-buy" />}
                          {log.type === 'error' && <ArrowDown className="h-4 w-4 text-trade-sell" />}
                          {log.type === 'warning' && <AlertTriangle className="h-4 w-4 text-trade-neutral" />}
                        </div>
                        <div>
                          <div className="text-sm">{log.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Live Trading Mode • Zerodha Auto Trader • Real trades will affect your Zerodha balance
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
