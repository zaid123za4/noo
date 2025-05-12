// Mock service for Zerodha API interaction
// In a real implementation, this would connect to the Zerodha API

import { toast } from "sonner";

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
  status: 'COMPLETE' | 'REJECTED' | 'CANCELLED' | 'PENDING';
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

// Mock class for Zerodha API service
class ZerodhaService {
  private isLoggedIn = false;
  private accessToken: string | null = null;
  private apiKey = 'your_zerodha_api_key';
  private apiSecret = 'your_zerodha_api_secret';
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  
  // Mock data for demonstration
  private mockProfile: UserProfile = {
    user_id: 'AB1234',
    user_name: 'Demo User',
    email: 'demo@example.com',
    user_type: 'individual',
    broker: 'ZERODHA',
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
  
  // Login function - in a real app, this would redirect to Zerodha login
  async login(): Promise<string> {
    // In a real app, this would redirect to the Zerodha OAuth page
    return `https://kite.zerodha.com/connect/login?api_key=${this.apiKey}&v=3`;
  }
  
  // Handle the callback from Zerodha OAuth
  async handleCallback(requestToken: string): Promise<boolean> {
    try {
      // In a real implementation, this would exchange the request token for an access token
      this.accessToken = 'mock_access_token_' + Math.random().toString(36).substring(7);
      this.isLoggedIn = true;
      this.addLog('Successfully logged in to Zerodha', 'success');
      return true;
    } catch (error) {
      this.addLog('Failed to log in to Zerodha', 'error');
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
      throw new Error('Not logged in');
    }
    return this.mockProfile;
  }
  
  // Get user funds
  async getFunds(): Promise<Funds> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in');
    }
    
    // Simulate some random market movements
    const randomChange = (Math.random() * 1000) - 500;
    this.mockFunds.equity.available.cash += randomChange;
    
    // Sometimes show unrealized profit/loss
    this.mockFunds.equity.utilized.m2m_unrealised = randomChange;
    
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
      toast.success(`Order ${order.id} executed successfully`);
    } else {
      toast.error(`Order ${order.id} was rejected`);
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
    this.addLog('Logged out from Zerodha', 'info');
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
}

// Create a singleton instance
const zerodhaService = new ZerodhaService();
export default zerodhaService;
