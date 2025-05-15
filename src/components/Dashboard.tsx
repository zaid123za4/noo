import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import dhanService, { UserProfile, Funds, Order, PredictionResult } from '@/services/dhanService';
import { ArrowDown, ArrowUp, Clock, History, Info, AlertTriangle, Brain, PauseCircle, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  autoTradeExecutor, 
  runTradingStrategy, 
  runAllSymbolsStrategy, 
  stopCurrentTrade,
  executeManualTrade,
  getSignalStrength,
  getCurrentPosition,
  getChartProvider,
  isMarketOpen,
  isCrypto,
  getTradingViewSymbol
} from '@/services/trading';
import { useNavigate } from 'react-router-dom';
import InstrumentSelector from './InstrumentSelector';
import { getSymbolPerformance, getRecentPredictions } from '@/services/tradingLearning';
import { useTradingMode } from '@/hooks/use-trading-mode';
import { useDemoMode } from '@/hooks/use-demo-mode';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from "@/components/ui/use-toast";

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDemoMode = useDemoMode();
  
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
  const [symbolPerformance, setSymbolPerformance] = useState<{
    successRate: number;
    totalTrades: number;
    profitLossTotal: number;
    adjustmentFactor: number;
  } | null>(null);
  const [activeTrade, setActiveTrade] = useState<{
    symbol: string;
    position: 'BUY' | 'SELL';
    entryPrice: number;
    quantity: number;
    timestamp: Date;
  } | null>(null);
  const [signalStrength, setSignalStrength] = useState<number>(50);
  const [chartProvider, setChartProvider] = useState<string>('NSE');
  const [showMarketClosedWarning, setShowMarketClosedWarning] = useState<boolean>(false);
  const [isCurrentMarketOpen, setIsCurrentMarketOpen] = useState<boolean>(false);
  
  const { mode: tradingMode, toggleTradingMode, isAutoMode, isManualMode } = useTradingMode({
    symbol: selectedSymbol,
    onModeChange: (mode) => {
      if (mode === 'manual') {
        stopAutoTrading();
      } else {
        startAutoTrading();
      }
    }
  });
  
  // Check if user is logged in or in demo mode
  useEffect(() => {
    if (!dhanService.isAuthenticated() && !isDemoMode) {
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
  }, [navigate, isDemoMode]);
  
  useEffect(() => {
    // Reload prediction when selected symbol changes
    if (selectedSymbol) {
      loadPredictionForSymbol(selectedSymbol);
      // Update chart provider based on symbol
      setChartProvider(getChartProvider(selectedSymbol));
    }
  }, [selectedSymbol]);
  
  useEffect(() => {
    // Load performance data when selected symbol changes
    if (selectedSymbol) {
      const performance = getSymbolPerformance(selectedSymbol);
      setSymbolPerformance(performance);
      
      // Get the current signal strength
      const currentSignalStrength = getSignalStrength(selectedSymbol);
      setSignalStrength(currentSignalStrength);
      
      // Check current position
      const currentPosition = getCurrentPosition(selectedSymbol);
      if (currentPosition) {
        // We have an active position for this symbol
        // In a real system, we would fetch more details here
        setActiveTrade({
          symbol: selectedSymbol,
          position: currentPosition,
          entryPrice: 0, // This would be fetched from the service
          quantity: tradeQuantity,
          timestamp: new Date()
        });
      } else {
        setActiveTrade(null);
      }
    }
  }, [selectedSymbol, logs]); // Re-run when logs update as they indicate new trades
  
  // Update active trade information based on orders
  useEffect(() => {
    // Find the most recent active order (if any)
    const latestOrder = [...orders]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .find(order => order.status === 'ACTIVE');
    
    if (latestOrder) {
      setActiveTrade({
        symbol: latestOrder.symbol,
        position: latestOrder.type as 'BUY' | 'SELL',
        entryPrice: latestOrder.price,
        quantity: latestOrder.quantity,
        timestamp: latestOrder.timestamp
      });
    } else if (!getCurrentPosition(selectedSymbol)) {
      setActiveTrade(null);
    }
  }, [orders, selectedSymbol]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const profileData = await dhanService.getProfile();
      const fundsData = await dhanService.getFunds();
      const orderData = dhanService.getOrders();
      const logData = dhanService.getLogs();
      
      setProfile(profileData);
      setFunds(fundsData);
      setOrders(orderData);
      setLogs(logData);
      
      if (selectedSymbol) {
        await loadPredictionForSymbol(selectedSymbol);
      }
      
      // Check market hours
      const marketOpen = isCrypto(selectedSymbol) || isMarketOpen();
      setIsCurrentMarketOpen(marketOpen);
      setShowMarketClosedWarning(!marketOpen && !isCrypto(selectedSymbol));
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
      
      // Update signal strength
      if (prediction.signalStrength !== undefined) {
        setSignalStrength(prediction.signalStrength);
      }
    } catch (error) {
      console.error(`Error getting prediction for ${symbol}:`, error);
      toast({
        title: 'Prediction Error',
        description: `Failed to load prediction for ${symbol}`,
        variant: 'destructive',
      });
    }
  };
  
  const startAutoTrading = () => {
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
  };
  
  const stopAutoTrading = () => {
    // Stop auto trading
    if (autoTradeInterval) clearInterval(autoTradeInterval);
    setAutoTradeIntervalState(null);
    setAutoTradeActive(false);
    
    toast({
      title: 'Auto Trading Stopped',
      description: 'The auto trading system is now paused. Current positions are maintained.',
    });
  };
  
  const toggleAutoTrade = () => {
    if (autoTradeActive) {
      stopAutoTrading();
      toggleTradingMode(); // Switch to manual mode
    } else {
      startAutoTrading();
      toggleTradingMode(); // Switch to auto mode
    }
  };
  
  // Handle manual trade execution
  const handleManualTradeExecution = async (action: 'BUY' | 'SELL') => {
    try {
      const success = await executeManualTrade(
        selectedSymbol,
        action,
        tradeQuantity
      );
      
      if (success) {
        // Refresh data
        loadData();
        
        toast({
          title: 'Trade Executed',
          description: `${action} order for ${selectedSymbol} placed successfully.`,
        });
      } else {
        toast({
          title: 'Trade Failed',
          description: `Failed to place ${action} order. Check if market is open.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Trade Failed',
        description: `Failed to place ${action} order: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };
  
  // New function to stop current trade
  const handleStopCurrentTrade = async () => {
    if (!activeTrade) return;
    
    try {
      // Call the stopCurrentTrade function with the active trade details
      await stopCurrentTrade(
        activeTrade.symbol,
        activeTrade.position,
        activeTrade.quantity
      );
      
      toast({
        title: 'Trade Closed',
        description: `${activeTrade.position === 'BUY' ? 'Sell' : 'Buy'} order placed to close position for ${activeTrade.symbol}.`,
      });
      
      // Refresh data
      loadData();
    } catch (error) {
      toast({
        title: 'Failed to Close Trade',
        description: `Error: ${(error as Error).message}`,
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
    const exchange = getChartProvider(symbol);
    const tvSymbol = getTradingViewSymbol(symbol);
    
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${exchange}%3A${tvSymbol}&interval=5&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22MASimple%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&studies_overrides=%5B%7B%22id%22%3A%22MASimple%40tv-basicstudies%22%2C%22inputs%22%3A%7B%22length%22%3A20%2C%22color%22%3A%22rgb%2830%2C%20201%2C%20220%29%22%7D%7D%2C%7B%22id%22%3A%22MASimple%40tv-basicstudies_1%22%2C%22inputs%22%3A%7B%22length%22%3A50%2C%22color%22%3A%22rgb%28241%2C%20158%2C%2077%29%22%7D%7D%5D&utm_source=app.lovable.dev&utm_medium=widget&utm_campaign=chart`;
  };
  
  // Add a useEffect to periodically check market hours
  useEffect(() => {
    // Function to check market hours
    const checkMarketHours = () => {
      // For the currently selected symbol
      const marketOpen = isCrypto(selectedSymbol) || isMarketOpen();
      setIsCurrentMarketOpen(marketOpen);
      setShowMarketClosedWarning(!marketOpen && !isCrypto(selectedSymbol));
    };
    
    // Check immediately and set up interval
    checkMarketHours();
    const marketCheckInterval = setInterval(checkMarketHours, 60000); // Check every minute
    
    return () => clearInterval(marketCheckInterval);
  }, [selectedSymbol]);
  
  const renderTradeButtons = () => {
    const isSymbolTradeable = isCrypto(selectedSymbol) || isCurrentMarketOpen;
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button 
          variant="outline" 
          className="border-trade-buy text-trade-buy hover:bg-trade-buy/10"
          onClick={() => handleManualTradeExecution('BUY')}
          disabled={!isSymbolTradeable}
        >
          Buy {selectedSymbol}
        </Button>
        <Button 
          variant="outline" 
          className="border-trade-sell text-trade-sell hover:bg-trade-sell/10"
          onClick={() => handleManualTradeExecution('SELL')}
          disabled={!isSymbolTradeable}
        >
          Sell {selectedSymbol}
        </Button>
        {!isSymbolTradeable && !isCrypto(selectedSymbol) && (
          <div className="col-span-2 mt-2">
            <p className="text-xs text-red-400">
              Market is closed. Trading available between 9:15 AM and 3:30 PM on weekdays.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  const renderChart = () => {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{selectedSymbol} Chart</CardTitle>
          {latestPrediction && (
            <Badge variant="outline" className={`${
              latestPrediction.action === 'BUY' 
                ? 'bg-trade-buy/10 text-trade-buy border-trade-buy/30' 
                : latestPrediction.action === 'SELL'
                  ? 'bg-trade-sell/10 text-trade-sell border-trade-sell/30'
                  : 'bg-muted/10 text-muted-foreground border-border'
              }`}>
              {latestPrediction.action} signal • {(latestPrediction.confidence * 100).toFixed(1)}% confidence
            </Badge>
          )}
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="tradingview-widget-container w-full h-full">
            <AspectRatio ratio={16/9} className="bg-muted/30">
              <iframe 
                src={getTradingViewUrl(selectedSymbol)}
                title={`${selectedSymbol} Chart`}
                className="w-full h-full"
                frameBorder="0"
                allowTransparency={true}
                onError={(e) => {
                  console.error("Chart loading error", e);
                  toast({
                    title: "Chart Error",
                    description: `Failed to load chart for ${selectedSymbol}`,
                    variant: "destructive",
                  });
                }}
              />
            </AspectRatio>
          </div>
        </CardContent>
        {latestPrediction && (
          <CardFooter className={`px-4 py-2 text-xs ${
            latestPrediction.action === 'BUY' 
              ? 'text-trade-buy' 
              : latestPrediction.action === 'SELL'
                ? 'text-trade-sell'
                : 'text-muted-foreground'
            }`}>
            {latestPrediction.message}
          </CardFooter>
        )}
      </Card>
    );
  };
  
  const renderManualTradingCard = () => {
    const isSymbolTradeable = isCrypto(selectedSymbol) || isCurrentMarketOpen;
    
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Manual Trading</CardTitle>
          <CardDescription>Execute trades manually based on your own analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Market Orders</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="w-full bg-trade-buy hover:bg-trade-buy/80"
                  onClick={() => handleManualTradeExecution('BUY')}
                  disabled={!isSymbolTradeable}
                >
                  BUY {selectedSymbol}
                </Button>
                <Button 
                  className="w-full bg-trade-sell hover:bg-trade-sell/80"
                  onClick={() => handleManualTradeExecution('SELL')}
                  disabled={!isSymbolTradeable}
                >
                  SELL {selectedSymbol}
                </Button>
              </div>
              
              {!isSymbolTradeable && !isCrypto(selectedSymbol) && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-xs text-red-400 font-medium">
                    Market is closed for {selectedSymbol}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trading available between 9:15 AM and 3:30 PM on weekdays
                  </p>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Order Details</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-mono">{selectedSymbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-mono">{tradeQuantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Order Type:</span>
                  <span className="font-mono">MARKET</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Market Status:</span>
                  <Badge variant={isSymbolTradeable ? "outline" : "destructive"} className="font-mono">
                    {isSymbolTradeable ? "OPEN" : "CLOSED"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Current Signal</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">AI Recommendation:</span>
                  <span className={`font-semibold ${
                    latestPrediction?.action === 'BUY' ? 'text-trade-buy' : 
                    latestPrediction?.action === 'SELL' ? 'text-trade-sell' : 
                    'text-muted-foreground'
                  }`}>
                    {latestPrediction?.action || 'NONE'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-mono">
                    {latestPrediction ? `${(latestPrediction.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Signal Strength:</span>
                  <span className="font-mono">{signalStrength}%</span>
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-xs text-muted-foreground">
                  <p>
                    {signalStrength > 70 ? 'Strong buy signal detected. Consider taking a long position.' : 
                     signalStrength > 60 ? 'Moderate buy signal. The trend appears bullish.' :
                     signalStrength < 30 ? 'Strong sell signal detected. Consider taking a short position.' :
                     signalStrength < 40 ? 'Moderate sell signal. The trend appears bearish.' :
                     'Neutral signal. The market is showing no clear direction.'}
                  </p>
                </div>
              </div>
              
              {activeTrade && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleStopCurrentTrade}
                    disabled={!isSymbolTradeable && !isCrypto(selectedSymbol)}
                  >
                    Close {activeTrade.position} position for {activeTrade.symbol}
                  </Button>
                  {!isSymbolTradeable && !isCrypto(selectedSymbol) && (
                    <p className="text-xs text-red-400 mt-1">
                      Cannot close position when market is closed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Dhan Auto Trader</h1>
              {isDemoMode && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                  Demo Mode
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isDemoMode ? 'Practice trading with virtual funds' : 'AI-powered trading system for Dhan'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={autoTradeActive ? "destructive" : "default"}
              onClick={toggleAutoTrade}
            >
              {autoTradeActive ? 'Stop Auto Trading' : 'Start Auto Trading'}
            </Button>
            {activeTrade && (
              <Button 
                variant="outline" 
                onClick={handleStopCurrentTrade}
                className="flex gap-2 items-center"
              >
                <StopCircle className="h-4 w-4" />
                Close Current Position
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              if (isDemoMode) {
                // Just navigate to home, demo mode will be reset
                navigate('/');
              } else {
                // Regular logout
                dhanService.logout();
                navigate('/');
              }
            }}>
              Logout
            </Button>
          </div>
        </div>
        
        {/* Market closed warning */}
        {showMarketClosedWarning && (
          <Card className="border-border/50 bg-destructive/10 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-destructive font-medium">Market is currently closed for {selectedSymbol}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Indian stock market trading hours are from 9:15 AM to 3:30 PM IST, Monday to Friday.
                You can still view signals and predictions, but trades can only be executed during market hours.
                {isCrypto(selectedSymbol) ? " Cryptocurrency trading is available 24/7." : ""}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Demo Mode Info Card */}
        {isDemoMode && (
          <Card className="border-border/50 bg-amber-500/10 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-500" />
                <p className="text-amber-500 font-medium">Demo Trading Active</p>
              </div>
              <p className="text-sm mt-2">
                You're using a demo account with virtual funds. All trades are simulated and won't affect real money.
                This is a safe environment to practice and learn trading strategies.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Active Trade Card (new) */}
        {activeTrade && (
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Position
              </CardTitle>
              <Badge variant="outline" className={`${
                activeTrade.position === 'BUY' 
                  ? 'bg-trade-buy/10 text-trade-buy border-trade-buy/30' 
                  : 'bg-trade-sell/10 text-trade-sell border-trade-sell/30'
              }`}>
                {activeTrade.position}
              </Badge>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Symbol</div>
                  <div className="font-mono font-bold">{activeTrade.symbol}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Entry Price</div>
                  <div className="font-mono">₹{activeTrade.entryPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Quantity</div>
                  <div className="font-mono">{activeTrade.quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="font-mono font-semibold">{formatCurrency(activeTrade.entryPrice * activeTrade.quantity)}</div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleStopCurrentTrade}
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>Close Position</span>
                  </Button>
                  <Badge variant={tradingMode === 'auto' ? 'default' : 'outline'} className="flex items-center gap-1">
                    {tradingMode === 'auto' ? (
                      <>
                        <span>AI Trading</span>
                        <PauseCircle className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Manual Mode</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* User profile and funds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Profile
                {isDemoMode && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                    Demo
                  </Badge>
                )}
              </CardTitle>
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
                  <span>{profile?.user_type} {isDemoMode && "(Demo)"}</span>
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
                    <span className="text-muted-foreground">Signal Strength</span>
                    <span className={`font-mono ${
                      signalStrength > 60 ? 'text-trade-buy' : 
                      signalStrength < 40 ? 'text-trade-sell' : 
                      'text-trade-neutral'
                    }`}>
                      {signalStrength}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-mono">₹{latestPrediction.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Status</span>
                    <Badge variant={isCurrentMarketOpen || isCrypto(selectedSymbol) ? "outline" : "destructive"} className="font-mono">
                      {isCurrentMarketOpen || isCrypto(selectedSymbol) ? "OPEN" : "CLOSED"}
                    </Badge>
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
              
              {/* Manual trade buttons - use the function */}
              {renderTradeButtons()}
            </CardContent>
          </Card>
        </div>
        
        {/* Signal Strength Indicator */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Signal Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
              <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-2 ${
                    signalStrength > 60 ? 'bg-trade-buy' : 
                    signalStrength < 40 ? 'bg-trade-sell' : 
                    'bg-muted-foreground'
                  }`}
                  style={{ width: `${signalStrength}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Strong Sell</span>
                <span>Hold</span>
                <span>Strong Buy</span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-muted">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs uppercase text-muted-foreground">Bearish Signal</div>
                    <div className={`text-lg font-semibold ${signalStrength < 40 ? 'text-trade-sell' : 'text-muted-foreground/50'}`}>
                      {100 - signalStrength}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs uppercase text-muted-foreground">Current Signal</div>
                    <div className={`text-lg font-semibold ${
                      signalStrength > 60 ? 'text-trade-buy' : 
                      signalStrength < 40 ? 'text-trade-sell' : 
                      'text-muted-foreground'
                    }`}>
                      {signalStrength > 60 ? 'BUY' : signalStrength < 40 ? 'SELL' : 'NEUTRAL'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs uppercase text-muted-foreground">Bullish Signal</div>
                    <div className={`text-lg font-semibold ${signalStrength > 60 ? 'text-trade-buy' : 'text-muted-foreground/50'}`}>
                      {signalStrength}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
                  predictionData={latestPrediction}
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
                    disabled={isAutoMode}
                  />
                  <label htmlFor="tradeAll" className={isAutoMode ? "text-muted-foreground" : ""}>
                    Trade all available instruments
                  </label>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Badge variant={isManualMode ? "outline" : "default"} className="flex items-center gap-1">
                    {isManualMode ? "Manual Trading" : "AI Trading"}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleTradingMode()}
                    className="flex items-center gap-1"
                  >
                    {isManualMode ? "Enable AI Trading" : "Switch to Manual"}
                  </Button>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md mt-4">
                  <p className="text-xs text-muted-foreground">
                    {isAutoMode
                      ? "AI Trading is active. The system will automatically place trades based on signals. Current trades will continue until completion or manual closure."
                      : "Manual Trading is active. You control when to execute trades, but can still view AI predictions."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Learning Performance Card */}
        <Card className="border-border/50 bg-card/95 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Learning Performance
            </CardTitle>
            {symbolPerformance && (
              <Badge variant="outline" className={`${
                symbolPerformance.successRate > 0.6 
                  ? 'bg-trade-buy/10 text-trade-buy border-trade-buy/30' 
                  : symbolPerformance.successRate > 0.4
                    ? 'bg-muted/10 text-muted-foreground border-border'
                    : 'bg-trade-sell/10 text-trade-sell border-trade-sell/30'
                }`}>
                {(symbolPerformance.successRate * 100).toFixed(1)}% success rate
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {symbolPerformance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Learning Statistics</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Completed Trades</span>
                      <span className="font-medium">{symbolPerformance.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className={`font-medium ${
                        symbolPerformance.successRate > 0.6 ? 'text-trade-buy' : 
                        symbolPerformance.successRate > 0.4 ? 'text-muted-foreground' : 'text-trade-sell'
                      }`}>
                        {(symbolPerformance.successRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Profit/Loss</span>
                      <span className={`font-medium ${
                        symbolPerformance.profitLossTotal > 0 ? 'text-trade-buy' : 
                        symbolPerformance.profitLossTotal < 0 ? 'text-trade-sell' : 'text-muted-foreground'
                      }`}>
                        ₹{symbolPerformance.profitLossTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence Adjustment</span>
                      <span className={`font-medium ${
                        symbolPerformance.adjustmentFactor > 1.05 ? 'text-trade-buy' : 
                        symbolPerformance.adjustmentFactor < 0.95 ? 'text-trade-sell' : 'text-muted-foreground'
                      }`}>
                        ×{symbolPerformance.adjustmentFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Performance Impact</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-sm">Confidence Adjustment</span>
                      <div className="w-full bg-background rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            symbolPerformance.adjustmentFactor > 1 ? 'bg-trade-buy' : 'bg-trade-sell'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, symbolPerformance.adjustmentFactor * 50))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span>0.5×</span>
                        <span className={symbolPerformance.adjustmentFactor > 1 ? 'text-trade-buy' : 'text-trade-sell'}>
                          {symbolPerformance.adjustmentFactor.toFixed(2)}×
                        </span>
                        <span>1.5×</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      {symbolPerformance.totalTrades > 0 ? (
                        symbolPerformance.successRate > 0.6 ? (
                          <p>The AI has learned that its predictions for {selectedSymbol} are reliable and has increased confidence in its trading signals.</p>
                        ) : symbolPerformance.successRate > 0.4 ? (
                          <p>The AI is still learning the optimal trading patterns for {selectedSymbol} and making moderate adjustments to its strategy.</p>
                        ) : (
                          <p>The AI has detected that its predictions for {selectedSymbol} need refinement and is being more cautious with trading signals.</p>
                        )
                      ) : (
                        <p>The AI has not yet gathered enough data for {selectedSymbol} to make significant learning adjustments.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No performance data available yet for {selectedSymbol}</p>
                <p className="text-xs text-muted-foreground mt-2">Performance metrics will appear after completing a few trades</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chart with embedded prediction */}
        {renderChart()}
        
        {/* Manual Trading Card */}
        {renderManualTradingCard()}
        
        {/* Tabs for orders and logs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-[600px]">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Trade History</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>System Logs</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>AI Learning</span>
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
          
          <TabsContent value="learning">
            <Card className="border-border/50 bg-card/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">AI Learning Process</CardTitle>
                <CardDescription>
                  How the AI improves trading accuracy over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-2 border-muted-foreground/30 pl-4 pb-2">
                    <h3 className="font-medium mb-2">Dynamic Strategy Optimization</h3>
                    <p className="text-sm text-muted-foreground">
                      The AI constantly monitors market volatility and trading patterns to optimize strategy parameters like SMA periods.
                      In high volatility markets, it uses shorter periods for faster responses, while in stable markets, it uses longer periods to avoid false signals.
                    </p>
                  </div>
                  
                  <div className="border-l-2 border-muted-foreground/30 pl-4 pb-2">
                    <h3 className="font-medium mb-2">Success-Based Confidence Adjustment</h3>
                    <p className="text-sm text-muted-foreground">
                      Every trade outcome is recorded and analyzed to adjust the confidence levels of future predictions.
                      Instruments with consistently successful predictions receive higher confidence scores, while those with poor performance are given lower confidence.
                    </p>
                  </div>
                  
                  <div className="border-l-2 border-muted-foreground/30 pl-4 pb-2">
                    <h3 className="font-medium mb-2">Symbol-Specific Learning</h3>
                    <p className="text-sm text-muted-foreground">
                      The AI maintains separate learning models for each trading instrument, recognizing that different stocks and cryptocurrencies behave differently in various market conditions.
                    </p>
                  </div>
                  
                  <div className="border-l-2 border-muted-foreground/30 pl-4 pb-2">
                    <h3 className="font-medium mb-2">Market Hours Intelligence</h3>
                    <p className="text-sm text-muted-foreground">
                      The system recognizes market trading hours for each asset class. Stock trading follows exchange hours (9:15 AM to 3:30 PM IST for Indian markets),
                      while cryptocurrency trading is available 24/7. Signals are still calculated during closed hours but trades are only executed when markets are open.
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-md mt-2">
                    <p className="text-xs text-muted-foreground">
                      The learning system requires a minimum of 5 completed trades before making significant adjustments to the trading strategy.
                      Performance metrics and adjustments are updated in real-time as new trade outcomes are recorded.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            {isAutoMode ? "AI Trading Mode" : "Manual Trading Mode"} • 
            {isDemoMode ? " Demo Account with Virtual Funds" : " Real trades will affect your Dhan balance"} • 
            Dhan Auto Trader
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
