
// Dhan API Service

import { toast } from "@/components/ui/use-toast";

// Types for the service
export interface TradePosition {
  symbol: string;
  quantity: number;
  price: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
  pnl: number;
}

export interface UserProfile {
  name: string;
  email: string;
  clientId: string;
  accountType: string;
}

export interface Funds {
  availableCash: number;
  usedMargin: number;
  totalMargin: number;
}

export interface Security {
  tradingSymbol: string;
  identifier: string;
  instrumentType: string;
  optionType?: string;
  strikePrice?: number;
  expiryDate?: string;
}

export interface Order {
  orderId: string;
  tradingSymbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
  status: string;
  timestamp: string;
}

export interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'trade' | 'warning' | 'success';
}

export interface MarketData {
  candle_begin_time: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export interface PredictionResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: Date;
  price: number;
  message: string;
  signalStrength?: number;
}

class DhanService {
  private isLoggedIn = false;
  private accessToken: string | null = null;
  private clientId = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzQ5OTgyMDc0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMjYzNDYzNiJ9.CS7wLP0VXO-vOnr32oINIvlMU4aZVFmYzYmYQhx1HPm6UUoCmdGXbzZhtdtkuVYyl5dKh2Elq5rLQgf_LaoMXw';
  private redirectUri = 'https://noo.lovable.app/callback';
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  private isDemoMode = false;
  private demoFunds: number = 0;
  private profile: UserProfile = {
    name: '',
    email: '',
    clientId: '',
    accountType: ''
  };
  
  constructor() {
    // Load the access token from localStorage when the service is created
    this.accessToken = localStorage.getItem('dhan_access_token');
    this.isLoggedIn = !!this.accessToken;
    
    // Initialize demo data
    if (this.isLoggedIn) {
      this.addLog("Logged in to Dhan service", "info");
    }
  }

  setDemoMode(isDemo: boolean): void {
    this.isDemoMode = isDemo;
  }

  isDemo(): boolean {
    return this.isDemoMode;
  }
  
  addDemoFunds(amount: number): void {
    this.demoFunds = amount;
    this.addLog(`Added ₹${amount.toLocaleString()} in demo funds`, "info");
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      if (tokenResponse && tokenResponse.access_token) {
        this.accessToken = tokenResponse.access_token;
        localStorage.setItem('dhan_access_token', tokenResponse.access_token);
        this.isLoggedIn = true;
        this.addLog("Successfully authenticated with Dhan", "success");
        return true;
      } else {
        console.error('Failed to retrieve access token from Dhan.');
        this.addLog("Failed to retrieve access token from Dhan", "error");
        return false;
      }
    } catch (error) {
      console.error('Error during OAuth callback:', error);
      this.addLog(`Error during OAuth callback: ${(error as Error).message}`, "error");
      return false;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<{ access_token: string } | null> {
    const tokenUrl = 'https://api.dhan.co/oauth/token';
    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('redirect_uri', this.redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('Token exchange failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return { access_token: data.access_token };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn || this.isDemoMode;
  }

  logout(): void {
    this.accessToken = null;
    this.isLoggedIn = false;
    localStorage.removeItem('dhan_access_token');
    this.addLog("Logged out from Dhan service", "info");
  }

  getOAuthUrl(): string {
    return `https://api.dhan.co/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=read,write`;
  }
  
  addLog(message: string, type: 'info' | 'error' | 'trade' | 'warning' | 'success' = 'info'): void {
    const logEntry: TradeLog = {
      timestamp: new Date().toLocaleTimeString(),
      message: message,
      type: type,
    };
    this.tradeLogs.push(logEntry);
    console.log(`[${logEntry.timestamp}] ${message}`);
  }

  getLogs(): TradeLog[] {
    return this.tradeLogs;
  }
  
  getProfile(): UserProfile {
    if (this.isDemoMode) {
      return {
        name: "Demo User",
        email: "demo@example.com",
        clientId: "DEMO123456",
        accountType: "Demo Account"
      };
    }
    
    // Return demo data or fetch from API
    return this.profile;
  }
  
  getFunds(): Funds {
    if (this.isDemoMode) {
      return {
        availableCash: this.demoFunds,
        usedMargin: 0,
        totalMargin: this.demoFunds
      };
    }
    
    // Return actual funds if available
    return {
      availableCash: 0,
      usedMargin: 0,
      totalMargin: 0
    };
  }
  
  getOrders(): Order[] {
    return this.orders;
  }
  
  async getAvailableSymbols(): Promise<{
    stocks: string[],
    cryptos: string[]
  }> {
    // Demo symbols for testing
    return {
      stocks: ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HDFC", "LT", "SBIN"],
      cryptos: ["BTCINR", "ETHINR", "BNBINR", "SOLINR", "DOTUSD", "ADAINR"]
    };
  }
  
  async getCurrentPrice(symbol: string): Promise<number> {
    // In a real implementation, this would fetch from Dhan API
    // For demo purposes, generate a random price between 90-110% of base values
    const baseValues: Record<string, number> = {
      "NIFTY": 22500,
      "BANKNIFTY": 48000,
      "RELIANCE": 2800,
      "TCS": 3900,
      "BTCINR": 5500000,
      "ETHINR": 260000
    };
    
    const baseValue = baseValues[symbol] || 1000;
    const randomFactor = 0.9 + (Math.random() * 0.2); // 90-110%
    return baseValue * randomFactor;
  }

  async getSecurityInfo(tradingSymbol: string): Promise<Security | null> {
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return null;
    }

    if (this.isDemoMode) {
      // Return demo data for testing
      return {
        tradingSymbol: tradingSymbol,
        identifier: `DEMO_ID_${tradingSymbol}`,
        instrumentType: tradingSymbol === "BTCINR" || tradingSymbol === "ETHINR" ? "CRYPTO" : "EQUITY",
        optionType: undefined,
        strikePrice: undefined,
        expiryDate: undefined,
      };
    }

    const url = `https://api.dhan.co/instruments/${tradingSymbol}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch security info for ${tradingSymbol}:`, response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return {
        tradingSymbol: data.tradingSymbol,
        identifier: data.identifier,
        instrumentType: data.instrumentType,
        optionType: data.optionType,
        strikePrice: data.strikePrice,
        expiryDate: data.expiryDate,
      };
    } catch (error) {
      console.error('Error fetching security info:', error);
      return null;
    }
  }

  async getMargin(): Promise<Funds | null> {
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return null;
    }
    
    if (this.isDemoMode) {
      return {
        availableCash: this.demoFunds,
        usedMargin: 0,
        totalMargin: this.demoFunds
      };
    }

    const url = 'https://api.dhan.co/api/v1/user/margin';

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch margin:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return {
        availableCash: data.availableCash,
        usedMargin: data.usedMargin,
        totalMargin: data.netAvailableMargin,
      };
    } catch (error) {
      console.error('Error fetching margin:', error);
      return null;
    }
  }

  async placeOrder(
    tradingSymbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    orderType: 'MARKET' | 'LIMIT',
    price?: number
  ): Promise<Order | null> {
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return null;
    }

    if (this.isDemoMode) {
      // Create mock order for demo mode
      const currentPrice = await this.getCurrentPrice(tradingSymbol);
      const orderId = `DEMO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const order: Order = {
        orderId: orderId,
        tradingSymbol: tradingSymbol,
        transactionType: side,
        quantity: quantity,
        orderType: orderType,
        price: orderType === 'MARKET' ? currentPrice : price,
        status: 'EXECUTED',
        timestamp: new Date().toISOString(),
      };
      
      // Update demo funds
      if (side === 'BUY') {
        const totalCost = quantity * (orderType === 'MARKET' ? currentPrice : (price || currentPrice));
        this.demoFunds -= totalCost;
      } else {
        const totalValue = quantity * (orderType === 'MARKET' ? currentPrice : (price || currentPrice));
        this.demoFunds += totalValue;
      }
      
      this.orders.push(order);
      this.addLog(`Demo order placed: ${side} ${quantity} ${tradingSymbol} at ${orderType} ${price ? price : 'market'} price`, "trade");
      return order;
    }

    const url = 'https://api.dhan.co/api/v1/trading/orders';
    const payload = {
      tradingSymbol: tradingSymbol,
      transactionType: side,
      quantity: quantity,
      orderType: orderType,
      productType: 'INTRADAY',
      price: orderType === 'LIMIT' ? price : null,
      source: 'WEB',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Failed to place order:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        toast({
          variant: "destructive",
          title: "Order placement failed",
          description: `Could not place order with Dhan. ${errorData.message || 'Please check console for details.'}`,
        });
        return null;
      }

      const data = await response.json();
      const order: Order = {
        orderId: data.orderId,
        tradingSymbol: data.tradingSymbol,
        transactionType: data.transactionType,
        quantity: data.quantity,
        orderType: data.orderType,
        price: data.price,
        status: data.status,
        timestamp: new Date().toISOString(),
      };
      this.orders.push(order);
      this.addLog(`Order placed: ${side} ${quantity} ${tradingSymbol} at ${orderType} ${price ? price : 'market'}`, "trade");
      return order;
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        variant: "destructive",
        title: "Order placement failed",
        description: "Could not place order with Dhan. Please try again.",
      });
      return null;
    }
  }

  async getOrderBook(): Promise<Order[]> {
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return [];
    }
    
    if (this.isDemoMode) {
      return this.orders;
    }

    const url = 'https://api.dhan.co/api/v1/trading/orders';

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch order book:', response.status, response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order book:', error);
      return [];
    }
  }

  async getPositions(): Promise<TradePosition[]> {
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return [];
    }
    
    if (this.isDemoMode) {
      // Generate demo positions based on orders
      const positions: Record<string, TradePosition> = {};
      
      for (const order of this.orders) {
        const symbol = order.tradingSymbol;
        
        if (!positions[symbol]) {
          positions[symbol] = {
            symbol: symbol,
            quantity: 0,
            price: 0,
            side: 'BUY', // default
            timestamp: new Date().toISOString(),
            pnl: 0
          };
        }
        
        // Update position
        if (order.transactionType === 'BUY') {
          positions[symbol].quantity += order.quantity;
          positions[symbol].side = 'BUY';
        } else {
          positions[symbol].quantity -= order.quantity;
          positions[symbol].side = positions[symbol].quantity > 0 ? 'BUY' : 'SELL';
        }
        
        // Set average price
        if (positions[symbol].quantity !== 0) {
          positions[symbol].price = order.price || await this.getCurrentPrice(symbol);
        }
        
        // Calculate PnL
        const currentPrice = await this.getCurrentPrice(symbol);
        if (positions[symbol].side === 'BUY') {
          positions[symbol].pnl = (currentPrice - positions[symbol].price) * positions[symbol].quantity;
        } else {
          positions[symbol].pnl = (positions[symbol].price - currentPrice) * Math.abs(positions[symbol].quantity);
        }
      }
      
      // Return only non-zero positions
      return Object.values(positions).filter(p => p.quantity !== 0);
    }

    const url = 'https://api.dhan.co/api/v1/trading/positions';

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch positions:', response.status, response.statusText);
        return [];
      }

      const positions = await response.json();
      return positions.map((position: any) => ({
        symbol: position.tradingSymbol,
        quantity: position.quantity,
        price: position.averagePrice,
        side: position.transactionType === 'BUY' ? 'BUY' : 'SELL',
        timestamp: new Date().toISOString(),
        pnl: position.pnl,
      }));
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  async getHistoricalData(
    tradingSymbol: string,
    interval: string,
    startTime: string | Date,
    endTime: string | Date
  ): Promise<MarketData[]> {
    // Convert Date objects to ISO strings if needed
    const fromDate = startTime instanceof Date ? startTime.toISOString() : startTime;
    const toDate = endTime instanceof Date ? endTime.toISOString() : endTime;
    
    if (!this.accessToken && !this.isDemoMode) {
      console.error('Not authenticated');
      return [];
    }
    
    if (this.isDemoMode) {
      // Generate mock historical data
      const basePrice = await this.getCurrentPrice(tradingSymbol);
      const candles: MarketData[] = [];
      
      // Parse dates
      const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;
      const to = typeof toDate === 'string' ? new Date(toDate) : toDate;
      
      // Calculate interval in milliseconds
      let intervalMs = 5 * 60 * 1000; // Default to 5min
      if (interval === '15minute') intervalMs = 15 * 60 * 1000;
      else if (interval === 'hour') intervalMs = 60 * 60 * 1000;
      else if (interval === 'day') intervalMs = 24 * 60 * 60 * 1000;
      
      // Generate candles
      let currentTime = new Date(from);
      let price = basePrice * 0.95; // Start slightly below current price
      const volatility = 0.01; // 1% volatility per candle
      
      while (currentTime < to) {
        // Calculate prices with some randomness
        const change = (Math.random() - 0.5) * 2 * volatility * price;
        const open = price;
        const close = open + change;
        const high = Math.max(open, close) + (Math.random() * volatility * price);
        const low = Math.min(open, close) - (Math.random() * volatility * price);
        const volume = Math.floor(Math.random() * 10000) + 5000;
        
        candles.push({
          candle_begin_time: currentTime.toISOString(),
          open,
          high,
          low,
          close,
          volume
        });
        
        // Set up for next candle
        currentTime = new Date(currentTime.getTime() + intervalMs);
        price = close;
      }
      
      return candles;
    }

    const url = `https://api.dhan.co/api/v1/charts/history/${tradingSymbol}?interval=${interval}&from=${fromDate}&to=${toDate}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch historical data:', response.status, response.statusText);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  getTradeLogs(): TradeLog[] {
    return this.tradeLogs;
  }
}

const dhanService = new DhanService();
export default dhanService;
