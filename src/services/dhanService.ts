
// Dhan API Service
// In a real implementation, this would connect to the Dhan API

import { toast } from "@/components/ui/use-toast";

export interface UserProfile {
  user_id: string;
  user_name: string;
  email: string;
  user_type: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  avatar_url: string | null;
}

export interface Funds {
  equity: {
    available: {
      cash: number;
      collateral: number;
      intraday_payin: number;
    };
    utilized: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
    };
  };
}

export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Order {
  id: string;
  timestamp: Date;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'COMPLETE' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'ACTIVE';
  pnl?: number;
}

export interface PredictionResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: Date;
  price: number;
  message: string;
}

interface TradeLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// Dhan Service for API interaction
class DhanService {
  private isLoggedIn = false;
  private accessToken: string | null = null;
  private apiKey: string = '';
  private apiSecret: string = '';
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  
  // Mock data for demonstration
  private mockProfile: UserProfile = {
    user_id: 'DH1234',
    user_name: 'Demo User',
    email: 'demo@example.com',
    user_type: 'individual',
    broker: 'DHAN',
    exchanges: ['NSE', 'BSE', 'MCX'],
    products: ['CNC', 'NRML', 'MIS'],
    order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
    avatar_url: null
  };
  
  private mockFunds: Funds = {
    equity: {
      available: {
        cash: 50000,
        collateral: 0,
        intraday_payin: 0,
      },
      utilized: {
        debits: 0,
        exposure: 0,
        m2m_realised: 0,
        m2m_unrealised: 0,
        option_premium: 0,
        payout: 0,
        span: 0,
        holding_sales: 0,
        turnover: 0,
      },
    },
  };

  // Set user credentials
  setCredentials(apiKey: string, apiSecret: string): void {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    localStorage.setItem('dhan_api_key', apiKey);
    localStorage.setItem('dhan_api_secret', apiSecret);
  }
  
  // Check for stored credentials
  loadStoredCredentials(): boolean {
    const storedApiKey = localStorage.getItem('dhan_api_key');
    const storedApiSecret = localStorage.getItem('dhan_api_secret');
    
    if (storedApiKey && storedApiSecret) {
      this.apiKey = storedApiKey;
      this.apiSecret = storedApiSecret;
      return true;
    }
    
    return false;
  }
  
  // Login function - in a real app, this would redirect to Dhan login
  async login(): Promise<string> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API credentials not set');
    }
    
    // In a real app, this would redirect to the Dhan OAuth page
    // or use the API credentials to authenticate
    this.addLog('Initiating Dhan login process', 'info');
    return `https://api.dhan.co/login?api_key=${this.apiKey}&v=1`;
  }
  
  // Handle the callback from Dhan OAuth
  async handleCallback(requestToken: string): Promise<boolean> {
    try {
      // In a real implementation, this would exchange the request token for an access token
      this.accessToken = 'mock_access_token_' + Math.random().toString(36).substring(7);
      this.isLoggedIn = true;
      this.addLog('Successfully logged in to Dhan', 'success');
      
      // Fetch initial user data after successful login
      await this.getProfile();
      await this.getFunds();
      
      return true;
    } catch (error) {
      this.addLog('Failed to log in to Dhan', 'error');
      return false;
    }
  }
  
  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
  
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    if (!this.isLoggedIn) {
      // Try to load credentials and auto-login
      if (this.loadStoredCredentials()) {
        try {
          await this.login();
          await this.handleCallback('auto_login_token');
        } catch (error) {
          throw new Error('Not logged in');
        }
      } else {
        throw new Error('Not logged in');
      }
    }
    
    // In a real app, this would fetch profile from Dhan API
    this.addLog('Fetched user profile', 'info');
    return this.mockProfile;
  }
  
  // Get user funds
  async getFunds(): Promise<Funds> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in');
    }
    
    // In a real app, this would fetch funds from Dhan API
    // Simulate some random market movements
    const randomChange = (Math.random() * 1000) - 500;
    this.mockFunds.equity.available.cash += randomChange;
    
    // Sometimes show unrealized profit/loss
    this.mockFunds.equity.utilized.m2m_unrealised = randomChange;
    
    this.addLog('Fetched user funds', 'info');
    return this.mockFunds;
  }
  
  // Get historical price data for a symbol
  async getHistoricalData(
    symbol: string, 
    interval: string,
    from: Date,
    to: Date
  ): Promise<MarketData[]> {
    // Generate random OHLCV data for demonstration
    const data: MarketData[] = [];
    let basePrice = 19500; // Starting NIFTY price
    let lastClose = basePrice;
    
    // Create data points with 5 minute intervals
    const startTime = from.getTime();
    const endTime = to.getTime();
    const intervalMs = interval === '5minute' ? 5 * 60 * 1000 : 60 * 60 * 1000;
    
    for (let time = startTime; time <= endTime; time += intervalMs) {
      // Simulate some price movement
      const change = (Math.random() * 40) - 20;
      const open = lastClose;
      const close = open + change;
      const high = Math.max(open, close) + (Math.random() * 15);
      const low = Math.min(open, close) - (Math.random() * 15);
      const volume = Math.floor(Math.random() * 10000) + 5000;
      
      data.push({
        timestamp: new Date(time),
        open,
        high,
        low,
        close,
        volume
      });
      
      lastClose = close;
    }
    
    this.addLog(`Fetched historical data for ${symbol}`, 'info');
    return data;
  }
  
  // Place an order
  async placeOrder(
    symbol: string,
    transactionType: 'BUY' | 'SELL',
    quantity: number,
    orderType: 'MARKET' | 'LIMIT' = 'MARKET',
    price?: number
  ): Promise<Order> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in');
    }
    
    // Generate a random order ID
    const orderId = `ORD${Math.floor(Math.random() * 100000)}`;
    
    // Get current price (simulated)
    const currentPrice = symbol === 'NIFTY' 
      ? 19500 + (Math.random() * 100) - 50
      : symbol.startsWith('CRYPTO_') 
        ? 10 + (Math.random() * 50000)
        : 500 + (Math.random() * 1000);
    
    // Create the order
    const order: Order = {
      id: orderId,
      timestamp: new Date(),
      symbol,
      type: transactionType,
      quantity,
      price: price || currentPrice,
      status: Math.random() > 0.1 ? 'COMPLETE' : 'REJECTED' // 90% success rate
    };
    
    // Add to orders list
    this.orders.push(order);
    
    // Log the order
    const logType = order.status === 'COMPLETE' ? 'success' : 'error';
    this.addLog(
      `${order.status}: ${order.type} ${order.quantity} ${order.symbol} @ ₹${order.price.toFixed(2)}`,
      logType
    );
    
    // Update funds if order is successful
    if (order.status === 'COMPLETE') {
      const orderValue = order.quantity * order.price;
      if (order.type === 'BUY') {
        this.mockFunds.equity.available.cash -= orderValue;
      } else {
        this.mockFunds.equity.available.cash += orderValue;
      }
      toast({
        title: "Order Executed",
        description: `${order.id} executed successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Order Rejected",
        description: `${order.id} was rejected`,
      });
    }
    
    return order;
  }
  
  // Get trade history
  getOrders(): Order[] {
    return [...this.orders].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  // Add a log entry
  addLog(message: string, type: 'info' | 'success' | 'error' | 'warning'): void {
    this.tradeLogs.push({
      timestamp: new Date(),
      message,
      type
    });
    
    // Log to console as well
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
  
  // Get logs
  getLogs(): TradeLog[] {
    return [...this.tradeLogs].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  // Logout
  logout(): void {
    this.isLoggedIn = false;
    this.accessToken = null;
    this.apiKey = '';
    this.apiSecret = '';
    localStorage.removeItem('dhan_api_key');
    localStorage.removeItem('dhan_api_secret');
    this.addLog('Logged out from Dhan', 'info');
  }
  
  // Get available symbols
  async getAvailableSymbols(): Promise<{stocks: string[], cryptos: string[]}> {
    // Mock data for available tradable instruments
    return {
      stocks: [
        'NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 
        'ICICIBANK', 'SBIN', 'BHARTIARTL', 'HDFCBANK',
        'WIPRO', 'AXISBANK', 'KOTAKBANK', 'ITC', 'LT', 'MARUTI',
        'TATASTEEL', 'HINDUNILVR', 'BAJFINANCE', 'ASIANPAINT'
      ],
      cryptos: [
        'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_BNB', 'CRYPTO_SOL', 
        'CRYPTO_XRP', 'CRYPTO_ADA', 'CRYPTO_DOGE', 'CRYPTO_DOT',
        'CRYPTO_AVAX', 'CRYPTO_MATIC'
      ]
    };
  }
  
  // Get current price for a symbol
  async getCurrentPrice(symbol: string): Promise<number> {
    // Simulate getting the current price
    return symbol === 'NIFTY' 
      ? 19500 + (Math.random() * 100) - 50
      : symbol.startsWith('CRYPTO_') 
        ? 10 + (Math.random() * 50000)
        : 500 + (Math.random() * 1000);
  }
}

// Create a singleton instance
const dhanService = new DhanService();
export default dhanService;
