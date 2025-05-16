import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/components/ui/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import { BarChart, Bar, Cell, Legend } from 'recharts';
import { useDemoMode } from '@/hooks/use-demo-mode';
import dhanService from '@/services/dhanService';
import InstrumentSelector from '@/components/InstrumentSelector';
import { PredictionResult, UserProfile, Funds, Order, TradeLog } from '@/services/tradingLearning';
import { runTradingStrategy } from '@/services/trading/tradingStrategy';
import { useTradingMode } from '@/hooks/use-trading-mode';
import { adaptUserProfile, adaptFunds, adaptOrders, adaptTradeLogs, isErrorInstance } from '@/utils/typeAdapters';

// Style constants
const DATA_COLOR = '#8884d8';
const GRID_COLOR = '#f5f5f5';
const CHART_HEIGHT = 300;

// Mock data for charts (if needed for demo mode)
const mockChartData = [
  { name: 'Day 1', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Day 2', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Day 3', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Day 4', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Day 5', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Day 6', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Day 7', uv: 3490, pv: 4300, amt: 2100 },
];

const mockLineChartData = [
  { name: 'Day 1', value: 2400 },
  { name: 'Day 2', value: 1398 },
  { name: 'Day 3', value: 9800 },
  { name: 'Day 4', value: 3908 },
  { name: 'Day 5', value: 4800 },
  { name: 'Day 6', value: 3800 },
  { name: 'Day 7', value: 4300 },
];

const mockBarChartData = [
  { name: 'Jan', profit: 2400, loss: 100 },
  { name: 'Feb', profit: 1398, loss: 200 },
  { name: 'Mar', profit: 9800, loss: 300 },
  { name: 'Apr', profit: 3908, loss: 400 },
  { name: 'May', profit: 4800, loss: 500 },
  { name: 'Jun', profit: 3800, loss: 600 },
  { name: 'Jul', profit: 4300, loss: 700 },
];

// Main Dashboard component
const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { mode, isAutoMode, toggleTradingMode } = useTradingMode();
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  const [strategyRunning, setStrategyRunning] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: '',
    user_name: '',
    email: '',
    user_type: ''
  });
  
  const [funds, setFunds] = useState<Funds>({
    equity: {
      available: {
        cash: 0,
        collateral: 0
      },
      utilized: {
        m2m_unrealised: 0
      }
    }
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  
  // Chart data state
  const [chartData, setChartData] = useState(mockChartData);
  const [lineChartData, setLineChartData] = useState(mockLineChartData);
  const [barChartData, setBarChartData] = useState(mockBarChartData);
  
  // Function to generate random chart data (for demo mode)
  const generateRandomChartData = (count: number) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Day ${i + 1}`,
        uv: Math.floor(Math.random() * 5000),
        pv: Math.floor(Math.random() * 5000),
        amt: Math.floor(Math.random() * 3000),
      });
    }
    return data;
  };
  
  // Function to generate random line chart data (for demo mode)
  const generateRandomLineChartData = (count: number) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 10000),
      });
    }
    return data;
  };
  
  // Function to generate random bar chart data (for demo mode)
  const generateRandomBarChartData = (count: number) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Month ${i + 1}`,
        profit: Math.floor(Math.random() * 10000),
        loss: Math.floor(Math.random() * 1000),
      });
    }
    return data;
  };
  
  // Effect to check login status and fetch user data
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check if user is logged in
        const loggedIn = await Promise.resolve(dhanService.isAuthenticated());
        setIsLoggedIn(!!loggedIn);
        
        if (loggedIn) {
          // Get user profile, funds, orders
          const profile = await dhanService.getProfile();
          const userFunds = await dhanService.getFunds();
          const userOrders = await dhanService.getOrders();
          const tradingLogs = await dhanService.getLogs();
          
          // Use our adapter functions to ensure type compatibility
          setUserProfile(adaptUserProfile(profile));
          setFunds(adaptFunds(userFunds));
          setOrders(adaptOrders(userOrders));
          setLogs(adaptTradeLogs(tradingLogs));
        }
      } catch (error) {
        if (isErrorInstance(error)) {
          console.error('Error checking login status:', error.message);
        } else {
          console.error('Unknown error checking login status');
        }
        
        // Show toast notification for error
        toast({
          title: "Authentication Error",
          description: "Could not verify login status. Please try again or log in.",
          variant: "destructive"
        });
      }
    };
    
    checkLoginStatus();
  }, [toast]);
  
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
  
  // Handle login button click
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  // Render functions for charts
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={isDemoMode ? generateRandomChartData(7) : chartData}
                 margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="pv" stroke={DATA_COLOR} fill={DATA_COLOR} />
      </AreaChart>
    </ResponsiveContainer>
  );
  
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={isDemoMode ? generateRandomLineChartData(7) : lineChartData}
                 margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke={DATA_COLOR} />
      </LineChart>
    </ResponsiveContainer>
  );
  
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={isDemoMode ? generateRandomBarChartData(7) : barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="profit" fill="#82ca9d" />
        <Bar dataKey="loss" fill="#e45649" />
      </BarChart>
    </ResponsiveContainer>
  );
  
  return (
    <div className="container mx-auto p-4">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">Market analysis and automated trading</p>
        </div>
        {!isLoggedIn && (
          <Button onClick={handleLoginClick} variant="outline">
            Login to Trade
          </Button>
        )}
      </div>
      
      {/* Instrument Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Instrument</CardTitle>
          <CardDescription>Choose an instrument to analyze and trade.</CardDescription>
        </CardHeader>
        <CardContent>
          <InstrumentSelector
            onSymbolSelect={handleSymbolSelect}
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
      
      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Volume</CardTitle>
                <CardDescription>Historical trading volume over time</CardDescription>
              </CardHeader>
              <CardContent>{renderAreaChart()}</CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Price Trends</CardTitle>
                <CardDescription>Historical price movements</CardDescription>
              </CardHeader>
              <CardContent>{renderLineChart()}</CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profit and Loss Analysis</CardTitle>
                <CardDescription>Monthly profit and loss comparison</CardDescription>
              </CardHeader>
              <CardContent>{renderBarChart()}</CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <p><strong>User ID:</strong> {userProfile.user_id}</p>
                <p><strong>Name:</strong> {userProfile.user_name}</p>
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>User Type:</strong> {userProfile.user_type}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Funds Information</CardTitle>
                <CardDescription>Details about your available funds</CardDescription>
              </CardHeader>
              <CardContent>
                <p><strong>Available Cash:</strong> ₹{funds.equity.available.cash.toFixed(2)}</p>
                <p><strong>Available Collateral:</strong> ₹{funds.equity.available.collateral.toFixed(2)}</p>
                <p><strong>Utilized M2M Unrealised:</strong> ₹{funds.equity.utilized.m2m_unrealised.toFixed(2)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your recent trading orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {orders.map(order => (
                      <li key={order.id}>
                        {order.type} {order.symbol} - ₹{order.price.toFixed(2)} ({order.status})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent orders found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Trading Logs</CardTitle>
              <CardDescription>Recent trading activity logs</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <ul className="list-disc pl-5">
                  {logs.map((log, index) => (
                    <li key={index}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message} ({log.type})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No trading logs found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
