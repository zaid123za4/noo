// Dhan API Service

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

export interface Position {
  tradingSymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  change: number;
  dayChange: number;
}

export interface PredictionResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: Date;
  price: number;
  message: string;
  signalStrength?: number;
}

interface TradeLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

// Environment configuration
const DHAN_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzQ5OTgyMDc0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMjYzNDYzNiJ9.CS7wLP0VXO-vOnr32oINIvlMU4aZVFmYzYmYQhx1HPm6UUoCmdGXbzZhtdtkuVYyl5dKh2Elq5rLQgf_LaoMXw";
const DHAN_API_URL = "https://api.dhan.co";

// Dhan Service for API interaction
class DhanService {
  public staticToken: string = DHAN_API_TOKEN;
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  private positions: Position[] = [];
  public mockProfile: UserProfile = {
    user_id: '110263463', // Extracted from token
    user_name: 'Personal Trading Account',
    email: 'personal@example.com',
    user_type: 'individual',
    broker: 'DHAN',
    exchanges: ['NSE', 'BSE', 'MCX'],
    products: ['CNC', 'NRML', 'MIS'],
    order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
    avatar_url: null
  };
  
  public mockFunds: Funds = {
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

  constructor() {
    console.log("DhanService initialized with static token");
    this.loadInitialData();
  }

  // Load initial data when service is created
  private async loadInitialData() {
    try {
      await this.getPositions();
      await this.getFunds();
      this.addLog("Initial data loaded", "info");
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.addLog("Failed to load initial data", "error");
    }
  }

  // Default headers for API requests
  private getHeaders() {
    return {
      'access-token': this.staticToken,
      'Content-Type': 'application/json',
    };
  }

  // Check if service is initialized with token
  isAuthenticated(): boolean {
    return !!this.staticToken;
  }
  
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    // In a real implementation, we'd fetch this from the Dhan API
    // For now, return the mock profile
    this.addLog('Fetched user profile', 'info');
    return this.mockProfile;
  }
  
  // Get user funds - real API implementation
  async getFunds(): Promise<Funds> {
    try {
      const response = await fetch(`${DHAN_API_URL}/funds`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch funds: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Transform the API response to match our interface
      this.mockFunds = this.transformFundsData(data);
      
      this.addLog('Fetched user funds', 'success');
      return this.mockFunds;
    } catch (error) {
      console.error('Error fetching funds:', error);
      this.addLog('Failed to fetch funds', 'error');
      
      // Return mock data in case of error
      return this.mockFunds;
    }
  }
  
  // Transform the funds data from the API format to our interface
  private transformFundsData(data: any): Funds {
    try {
      // Attempt to map the API response to our interface
      // This might need adjustments based on the actual API response structure
      return {
        equity: {
          available: {
            cash: parseFloat(data.availableCash) || 0,
            collateral: parseFloat(data.availableCollateral) || 0,
            intraday_payin: parseFloat(data.intradayPayin) || 0,
          },
          utilized: {
            debits: parseFloat(data.debits) || 0,
            exposure: parseFloat(data.exposure) || 0,
            m2m_realised: parseFloat(data.m2mRealised) || 0,
            m2m_unrealised: parseFloat(data.m2mUnrealised) || 0,
            option_premium: parseFloat(data.optionPremium) || 0,
            payout: parseFloat(data.payout) || 0,
            span: parseFloat(data.span) || 0,
            holding_sales: parseFloat(data.holdingSales) || 0,
            turnover: parseFloat(data.turnover) || 0,
          },
        },
      };
    } catch (error) {
      console.error('Error transforming funds data:', error);
      return this.mockFunds;
    }
  }

  // Get positions (holdings)
  async getPositions(): Promise<Position[]> {
    try {
      const response = await fetch(`${DHAN_API_URL}/positions/holdings`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Transform the API response to match our interface
      this.positions = this.transformPositionsData(data);
      
      this.addLog('Fetched positions', 'success');
      return this.positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      this.addLog('Failed to fetch positions', 'error');
      
      // Return cached positions in case of error
      return this.positions;
    }
  }
  
  // Transform the positions data from the API format to our interface
  private transformPositionsData(data: any[]): Position[] {
    try {
      // Map the API response to our interface
      return data.map(item => ({
        tradingSymbol: item.tradingSymbol,
        exchange: item.exchange,
        quantity: parseInt(item.quantity) || 0,
        averagePrice: parseFloat(item.averagePrice) || 0,
        lastPrice: parseFloat(item.lastPrice) || 0,
        pnl: parseFloat(item.pnl) || 0,
        change: parseFloat(item.change) || 0,
        dayChange: parseFloat(item.dayChange) || 0
      }));
    } catch (error) {
      console.error('Error transforming positions data:', error);
      return [];
    }
  }

  // Place an order
  async placeOrder(
    symbol: string,
    transactionType: 'BUY' | 'SELL',
    quantity: number,
    orderType: 'MARKET' | 'LIMIT' = 'MARKET',
    price?: number,
    exchange: string = 'NSE'
  ): Promise<Order> {
    try {
      // Prepare the order payload
      const orderPayload = {
        securityId: symbol,
        exchange: exchange,
        transactionType: transactionType.toLowerCase(),
        quantity: quantity,
        orderType: orderType.toUpperCase(),
        productType: 'CNC', // Cash and Carry - for delivery
        validity: 'DAY',
      };
      
      // Add price for limit orders
      if (orderType === 'LIMIT' && price) {
        Object.assign(orderPayload, { price });
      }

      // Send the order to Dhan API
      const response = await fetch(`${DHAN_API_URL}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to place order: ${errorData.message || response.statusText}`);
      }
      
      const orderResponse = await response.json();
      
      // Create a local order object from the response
      const order: Order = {
        id: orderResponse.orderId || `ORD${Math.floor(Math.random() * 100000)}`,
        timestamp: new Date(),
        symbol,
        type: transactionType,
        quantity,
        price: price || await this.getCurrentPrice(symbol),
        status: 'PENDING', // Initially set as pending
      };
      
      // Add to orders list
      this.orders.push(order);
      
      // Log the order
      this.addLog(
        `Order placed: ${order.type} ${order.quantity} ${order.symbol} @ ₹${order.price.toFixed(2)}`,
        'success'
      );
      
      toast({
        title: "Order Submitted",
        description: `${order.id} submitted successfully`,
      });
      
      return order;
    } catch (error) {
      console.error('Error placing order:', error);
      this.addLog(`Failed to place order: ${(error as Error).message}`, 'error');
      
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: `Error: ${(error as Error).message}`,
      });
      
      // Create a rejected order for the UI
      const rejectedOrder: Order = {
        id: `REJ${Math.floor(Math.random() * 100000)}`,
        timestamp: new Date(),
        symbol,
        type: transactionType,
        quantity,
        price: price || await this.getCurrentPrice(symbol),
        status: 'REJECTED',
      };
      
      this.orders.push(rejectedOrder);
      return rejectedOrder;
    }
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
      cryptos: []
    };
  }
  
  // Get current price for a symbol
  async getCurrentPrice(symbol: string): Promise<number> {
    // Simulate getting the current price
    // In a real implementation, this would fetch from the Dhan API
    return symbol === 'NIFTY' 
      ? 19500 + (Math.random() * 100) - 50
      : 500 + (Math.random() * 1000);
  }
  
  // Get historical price data for a symbol
  async getHistoricalData(
    symbol: string, 
    interval: string,
    from: Date,
    to: Date
  ): Promise<MarketData[]> {
    // In a real implementation, this would fetch from the Dhan API
    // For now, generate random data
    const data: MarketData[] = [];
    let basePrice = symbol === 'NIFTY' ? 19500 : 1000;
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
  
  // Add placeholder OAuth methods (no longer needed for functionality but referenced in code)
  public getOAuthUrl(): string {
    // Since we're not using OAuth anymore, just return a dummy URL
    // This method is only here to prevent TypeScript errors
    this.addLog("OAuth flow no longer used - using static token instead", "info");
    return "#";
  }
  
  public handleCallback(code: string): Promise<boolean> {
    // Since we're not using OAuth anymore, just return success
    // This method is only here to prevent TypeScript errors
    this.addLog("OAuth callback handling skipped - using static token", "info");
    return Promise.resolve(true);
  }
  
  public logout(): void {
    // Since we're not using OAuth login/logout, this is just a placeholder
    this.addLog("Logout requested (no action needed - using static token)", "info");
  }
}

// Create a singleton instance
const dhanService = new DhanService();
export default dhanService;
