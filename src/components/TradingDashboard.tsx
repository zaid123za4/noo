
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import dhanService, { UserProfile, Funds, Order, Position } from '@/services/dhanService';
import { History, Info, LineChart, BarChart4, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from "@/components/ui/use-toast";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const TradingDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [funds, setFunds] = useState<Funds | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<{ timestamp: Date; message: string; type: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Order form state
  const [orderSymbol, setOrderSymbol] = useState('');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderMethod, setOrderMethod] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [availableStocks, setAvailableStocks] = useState<string[]>([]);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!dhanService.isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Authorization Failed",
        description: "Your Dhan API token is missing or invalid",
      });
      navigate('/');
      return;
    }
    
    // Initial data load
    loadData();
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 60000); // Refresh every minute
    setRefreshInterval(interval);
    
    // Clean up on unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [navigate]);
  
  // Load dashboard data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [profileData, fundsData, positionsData, symbolsData] = await Promise.all([
        dhanService.getProfile(),
        dhanService.getFunds(),
        dhanService.getPositions(),
        dhanService.getAvailableSymbols()
      ]);
      
      // Update state with fetched data
      setProfile(profileData);
      setFunds(fundsData);
      setPositions(positionsData);
      setAvailableStocks(symbolsData.stocks);
      
      // Get orders and logs
      setOrders(dhanService.getOrders());
      setLogs(dhanService.getLogs());
      
      // Set default symbol if needed
      if (!orderSymbol && symbolsData.stocks.length > 0) {
        setOrderSymbol(symbolsData.stocks[0]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Data Load Failed",
        description: "Failed to load your trading data",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!orderSymbol || orderQuantity <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Order",
        description: "Please select a symbol and valid quantity",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // For limit orders, ensure price is provided
      if (orderMethod === 'LIMIT' && (!orderPrice || orderPrice <= 0)) {
        toast({
          variant: "destructive",
          title: "Invalid Price",
          description: "Please enter a valid price for limit orders",
        });
        return;
      }
      
      // Place the order
      await dhanService.placeOrder(
        orderSymbol,
        orderType,
        orderQuantity,
        orderMethod,
        orderMethod === 'LIMIT' ? orderPrice : undefined
      );
      
      // Refresh data after order placement
      loadData();
      
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency (INR)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };
  
  // Handle manual data refresh
  const handleRefresh = () => {
    loadData();
    toast({
      title: "Refreshing Data",
      description: "Fetching latest trading information",
    });
  };
  
  if (loading && !profile && !funds) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-primary animate-pulse">Loading your trading dashboard...</div>
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
            <h1 className="text-2xl font-bold tracking-tight">Dhan Trading Dashboard</h1>
            <p className="text-muted-foreground">
              Your personal trading portal
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* User profile and funds */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
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
                  <span className="text-muted-foreground">Type</span>
                  <span>{profile?.user_type}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
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
                  <span className={`font-mono ${funds && funds.equity.utilized.m2m_unrealised > 0 ? 'text-green-500' : funds && funds.equity.utilized.m2m_unrealised < 0 ? 'text-red-500' : ''}`}>
                    {funds && formatCurrency(funds.equity.utilized.m2m_unrealised)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trading Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Positions</span>
                  <span className="font-mono">{positions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total P&L</span>
                  <span className={`font-mono font-semibold ${getTotalPnL() > 0 ? 'text-green-500' : getTotalPnL() < 0 ? 'text-red-500' : ''}`}>
                    {formatCurrency(getTotalPnL())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Day's Orders</span>
                  <span className="font-mono">{getTodayOrders().length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trading Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Place New Order</CardTitle>
            <CardDescription>
              Execute buy or sell orders for stocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select 
                    value={orderSymbol} 
                    onValueChange={setOrderSymbol}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStocks.map(stock => (
                        <SelectItem key={stock} value={stock}>{stock}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order-type">Order Type</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={orderType === 'BUY' ? 'default' : 'outline'} 
                      className={orderType === 'BUY' ? 'w-full bg-green-500 hover:bg-green-600' : 'w-full'}
                      onClick={() => setOrderType('BUY')}
                    >
                      BUY
                    </Button>
                    <Button
                      type="button"
                      variant={orderType === 'SELL' ? 'default' : 'outline'}
                      className={orderType === 'SELL' ? 'w-full bg-red-500 hover:bg-red-600' : 'w-full'}
                      onClick={() => setOrderType('SELL')}
                    >
                      SELL
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order-method">Order Method</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={orderMethod === 'MARKET' ? 'default' : 'outline'} 
                      className="w-full"
                      onClick={() => setOrderMethod('MARKET')}
                    >
                      MARKET
                    </Button>
                    <Button
                      type="button"
                      variant={orderMethod === 'LIMIT' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setOrderMethod('LIMIT')}
                    >
                      LIMIT
                    </Button>
                  </div>
                </div>
                
                {orderMethod === 'LIMIT' && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.05"
                      min="0"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="pt-6">
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full"
                    disabled={loading || !orderSymbol || orderQuantity <= 0 || (orderMethod === 'LIMIT' && orderPrice <= 0)}
                  >
                    Place {orderType} Order
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main content tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid grid-cols-4 max-w-[600px]">
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span>Positions</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span>Funds</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Logs</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Positions Tab */}
          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Holdings</CardTitle>
                <CardDescription>
                  Your current stock positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No positions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Symbol</th>
                          <th className="text-left py-2">Qty</th>
                          <th className="text-right py-2">Avg Price</th>
                          <th className="text-right py-2">LTP</th>
                          <th className="text-right py-2">P&L</th>
                          <th className="text-right py-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">
                              <div className="flex items-center">
                                <span className="font-medium">{position.tradingSymbol}</span>
                                <Badge variant="outline" className="ml-2 text-xs">{position.exchange}</Badge>
                              </div>
                            </td>
                            <td className="py-2 font-mono">{position.quantity}</td>
                            <td className="py-2 text-right font-mono">₹{position.averagePrice.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono">₹{position.lastPrice.toFixed(2)}</td>
                            <td className={`py-2 text-right font-mono font-semibold ${position.pnl > 0 ? 'text-green-500' : position.pnl < 0 ? 'text-red-500' : ''}`}>
                              {formatCurrency(position.pnl)}
                            </td>
                            <td className={`py-2 text-right font-mono ${position.change > 0 ? 'text-green-500' : position.change < 0 ? 'text-red-500' : ''}`}>
                              {formatPercentage(position.change)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <div>
                    <span className="text-sm text-muted-foreground">Total Positions:</span>
                    <span className="ml-2 font-mono">{positions.length}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total P&L:</span>
                    <span className={`ml-2 font-mono font-semibold ${getTotalPnL() > 0 ? 'text-green-500' : getTotalPnL() < 0 ? 'text-red-500' : ''}`}>
                      {formatCurrency(getTotalPnL())}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order History</CardTitle>
                <CardDescription>
                  Your recent trading activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet</p>
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
                                  ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                  : 'bg-red-500/10 text-red-500 border-red-500/30'
                                }`}
                              >
                                {order.type}
                              </Badge>
                              <span className="font-medium">{order.symbol}</span>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  order.status === 'COMPLETE' 
                                  ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                  : order.status === 'PENDING'
                                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
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
          
          {/* Funds Tab */}
          <TabsContent value="funds">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Funds</CardTitle>
                <CardDescription>
                  Complete breakdown of your trading account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!funds ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No funds data available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Available Funds</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">
                              {formatCurrency(funds.equity.available.cash)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Cash</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">
                              {formatCurrency(funds.equity.available.collateral)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Collateral</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-semibold">
                              {formatCurrency(funds.equity.available.intraday_payin)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Intraday Payin</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Utilized Funds</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Debits</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.debits)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Exposure</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.exposure)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">M2M Realized</p>
                          <div className={`font-mono ${funds.equity.utilized.m2m_realised > 0 ? 'text-green-500' : funds.equity.utilized.m2m_realised < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(funds.equity.utilized.m2m_realised)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">M2M Unrealized</p>
                          <div className={`font-mono ${funds.equity.utilized.m2m_unrealised > 0 ? 'text-green-500' : funds.equity.utilized.m2m_unrealised < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(funds.equity.utilized.m2m_unrealised)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Option Premium</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.option_premium)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payout</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.payout)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">SPAN</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.span)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Holding Sales</p>
                          <div className="font-mono">
                            {formatCurrency(funds.equity.utilized.holding_sales)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
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
                          {log.type === 'success' && <div className="h-4 w-4 text-green-500">✓</div>}
                          {log.type === 'error' && <div className="h-4 w-4 text-red-500">✗</div>}
                          {log.type === 'warning' && <div className="h-4 w-4 text-yellow-500">!</div>}
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
            Dhan Trading Dashboard • Personal Use Only
          </p>
        </div>
      </div>
    </div>
  );
  
  // Helper function to calculate total P&L
  function getTotalPnL(): number {
    return positions.reduce((total, position) => total + position.pnl, 0);
  }
  
  // Helper function to get today's orders
  function getTodayOrders(): Order[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    });
  }
};

export default TradingDashboard;
