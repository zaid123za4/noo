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

interface Security {
  tradingSymbol: string;
  identifier: string;
  instrumentType: string;
  optionType?: string;
  strikePrice?: number;
  expiryDate?: string;
}

interface Margin {
  availableCash: number;
  usedMargin: number;
  totalMargin: number;
}

interface Order {
  orderId: string;
  tradingSymbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
  status: string;
  timestamp: string;
}

interface TradeLog {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'trade';
}

interface HistoricalDataItem {
  candle_begin_time: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

class DhanService {
  private isLoggedIn = false;
  private accessToken: string | null = null;
  private clientId = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzQ5OTgyMDc0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMjYzNDYzNiJ9.CS7wLP0VXO-vOnr32oINIvlMU4aZVFmYzYmYQhx1HPm6UUoCmdGXbzZhtdtkuVYyl5dKh2Elq5rLQgf_LaoMXw';
  private redirectUri = 'https://noo.lovable.app/callback';
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  private isDemoMode = false;
  
  constructor() {
    // Load the access token from localStorage when the service is created
    this.accessToken = localStorage.getItem('dhan_access_token');
    this.isLoggedIn = !!this.accessToken;
  }

  setDemoMode(isDemo: boolean): void {
    this.isDemoMode = isDemo;
  }

  isDemo(): boolean {
    return this.isDemoMode;
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      if (tokenResponse && tokenResponse.access_token) {
        this.accessToken = tokenResponse.access_token;
        localStorage.setItem('dhan_access_token', tokenResponse.access_token);
        this.isLoggedIn = true;
        return true;
      } else {
        console.error('Failed to retrieve access token from Dhan.');
        return false;
      }
    } catch (error) {
      console.error('Error during OAuth callback:', error);
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
    return this.isLoggedIn;
  }

  logout(): void {
    this.accessToken = null;
    this.isLoggedIn = false;
    localStorage.removeItem('dhan_access_token');
  }

  getOAuthUrl(): string {
    return `https://api.dhan.co/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=read,write`;
  }

  async getSecurityInfo(tradingSymbol: string): Promise<Security | null> {
    if (!this.accessToken) {
      console.error('Not authenticated');
      return null;
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

  async getMargin(): Promise<Margin | null> {
    if (!this.accessToken) {
      console.error('Not authenticated');
      return null;
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
    if (!this.accessToken) {
      console.error('Not authenticated');
      return null;
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
      this.logTrade(`Order placed: ${side} ${quantity} ${tradingSymbol} at ${orderType} ${price ? price : 'market'}`);
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
    if (!this.accessToken) {
      console.error('Not authenticated');
      return [];
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
    if (!this.accessToken) {
      console.error('Not authenticated');
      return [];
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
    startTime: string,
    endTime: string
  ): Promise<HistoricalDataItem[]> {
    if (!this.accessToken) {
      console.error('Not authenticated');
      return [];
    }

    const url = `https://api.dhan.co/api/v1/charts/history/${tradingSymbol}?interval=${interval}&from=${startTime}&to=${endTime}`;

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

  logTrade(message: string, type: 'info' | 'error' | 'trade' = 'info'): void {
    const logEntry: TradeLog = {
      timestamp: new Date().toLocaleTimeString(),
      message: message,
      type: type,
    };
    this.tradeLogs.push(logEntry);
    console.log(`[${logEntry.timestamp}] ${message}`);
  }

  getTradeLogs(): TradeLog[] {
    return this.tradeLogs;
  }
}

const dhanService = new DhanService();
export default dhanService;
