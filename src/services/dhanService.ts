
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

export interface WalletInfo {
  address: string;
  balance: number;
  transactions: WalletTransaction[];
  connected: boolean;
}

export interface WalletTransaction {
  id: string;
  timestamp: Date;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
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
  aiInitiated?: boolean;
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

// Dhan Service for API interaction
class DhanService {
  private isLoggedIn = false;
  private accessToken: string | null = null;
  private clientId = 'YOUR_CLIENT_ID'; // Replace with your actual client ID
  private redirectUri = 'https://mytradingapp.com/callback'; // Replace with your actual redirect URI
  private tradeLogs: TradeLog[] = [];
  private orders: Order[] = [];
  private isDemoMode = false;
  private isUsingRealMoney = false;
  private wallet: WalletInfo = {
    address: '0x89e51fA8C39B10000f57DcDAf41c3Fa4C0768e26',
    balance: 0,
    transactions: [],
    connected: false
  };
  
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

  // Set demo mode and funds
  addDemoFunds(amount: number): void {
    this.isDemoMode = true;
    this.isLoggedIn = true; // Auto-login in demo mode
    this.mockFunds.equity.available.cash = amount;
    this.addLog(`Demo mode activated with ₹${amount.toLocaleString()} virtual funds`, 'success');
    
    // In demo mode, let's create a special demo user profile
    this.mockProfile = {
      user_id: 'DEMO123',
      user_name: 'Demo User',
      email: 'demo@tradingapp.com',
      user_type: 'demo',
      broker: 'DHAN',
      exchanges: ['NSE', 'BSE', 'MCX'],
      products: ['CNC', 'NRML', 'MIS'],
      order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M'],
      avatar_url: null
    };
    
    // Also initialize the wallet with demo funds
    this.wallet.balance = amount / 10; // 10% of demo funds in wallet
    this.wallet.connected = true;
    
    this.addLog(`Demo wallet initialized with ₹${this.wallet.balance.toLocaleString()}`, 'success');
  }
  
  // Set real money mode
  setRealMoneyMode(enabled: boolean): void {
    this.isUsingRealMoney = enabled;
    
    if (enabled) {
      this.addLog('Real money trading activated. Using actual funds for trades.', 'warning');
      
      // Connect wallet when using real money
      this.wallet.connected = true;
      
      // In a real app, this would fetch actual wallet balance
      // For demo, we'll just set a random amount
      if (this.wallet.balance === 0) {
        this.wallet.balance = Math.floor(Math.random() * 50000) + 10000;
      }
    } else {
      this.addLog('Switched to virtual trading. No real funds will be used.', 'info');
    }
  }
  
  // Check if using real money
  isUsingRealFunds(): boolean {
    return this.isUsingRealMoney;
  }
  
  // Get wallet info
  getWalletInfo(): WalletInfo {
    return {...this.wallet};
  }
  
  // Add funds to wallet
  depositToWallet(amount: number): WalletTransaction {
    this.wallet.balance += amount;
    
    const transaction: WalletTransaction = {
      id: `TX${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date(),
      type: 'DEPOSIT',
      amount: amount,
      status: 'COMPLETED',
      description: `Deposit to trading wallet`
    };
    
    this.wallet.transactions.push(transaction);
    this.addLog(`₹${amount.toLocaleString()} deposited to wallet`, 'success');
    
    return transaction;
  }
  
  // Withdraw funds from wallet
  withdrawFromWallet(amount: number): WalletTransaction | null {
    if (amount > this.wallet.balance) {
      this.addLog(`Withdrawal failed: Insufficient balance`, 'error');
      return null;
    }
    
    this.wallet.balance -= amount;
    
    const transaction: WalletTransaction = {
      id: `TX${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date(),
      type: 'WITHDRAWAL',
      amount: amount,
      status: 'COMPLETED',
      description: `Withdrawal from trading wallet`
    };
    
    this.wallet.transactions.push(transaction);
    this.addLog(`₹${amount.toLocaleString()} withdrawn from wallet`, 'success');
    
    return transaction;
  }
  
  // Connect wallet
  connectWallet(): boolean {
    if (this.wallet.connected) {
      this.addLog('Wallet already connected', 'info');
      return true;
    }
    
    // In a real app, this would open a wallet connection dialog
    this.wallet.connected = true;
    
    // For demo purposes, set a random balance if not already set
    if (this.wallet.balance === 0) {
      this.wallet.balance = Math.floor(Math.random() * 50000) + 10000;
    }
    
    this.addLog('Wallet connected successfully', 'success');
    return true;
  }
  
  // Disconnect wallet
  disconnectWallet(): boolean {
    if (!this.wallet.connected) {
      this.addLog('No wallet is connected', 'info');
      return true;
    }
    
    this.wallet.connected = false;
    
    // Turn off real money trading when wallet is disconnected
    if (this.isUsingRealMoney) {
      this.isUsingRealMoney = false;
      this.addLog('Real money trading disabled due to wallet disconnection', 'warning');
    }
    
    this.addLog('Wallet disconnected', 'success');
    return true;
  }
  
  // Get wallet transaction history
  getWalletTransactions(): WalletTransaction[] {
    return [...this.wallet.transactions].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  // Check if in demo mode
  isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  // Get OAuth URL for login
  getOAuthUrl(): string {
    return `https://api.dhan.co/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=read,write`;
  }
  
  // Handle the callback from Dhan OAuth with authorization code
  async handleCallback(code: string): Promise<boolean> {
    // If we're in demo mode, we're already "logged in"
    if (this.isDemoMode) {
      return true;
    }

    try {
      // In a real implementation, this would exchange the authorization code for an access token
      // by making a server-side request to Dhan's token endpoint
      
      // For demo purposes, we're simulating a successful token exchange
      this.accessToken = 'mock_access_token_' + Math.random().toString(36).substring(7);
      this.isLoggedIn = true;
      this.addLog('Successfully logged in to Dhan', 'success');
      
      // Store the token in localStorage for persistence
      localStorage.setItem('dhan_access_token', this.accessToken);
      
      // Fetch initial user data after successful login
      await this.getProfile();
      await this.getFunds();
      
      return true;
    } catch (error) {
      this.addLog('Failed to log in to Dhan', 'error');
      return false;
    }
  }
  
  // Logout
  logout(): void {
    this.isLoggedIn = false;
    this.accessToken = null;
    this.isDemoMode = false;
    this.isUsingRealMoney = false;
    this.wallet.connected = false;
    localStorage.removeItem('dhan_access_token');
    this.addLog('Logged out from Dhan', 'info');
  }
  
  // Check if user is logged in
  isAuthenticated(): boolean {
    // If we're in demo mode, we're always "authenticated"
    if (this.isDemoMode) {
      return true;
    }
    
    // Check if we're already logged in
    if (this.isLoggedIn) {
      return true;
    }
    
    // Check if we have a stored token
    const storedToken = localStorage.getItem('dhan_access_token');
    if (storedToken) {
      this.accessToken = storedToken;
      this.isLoggedIn = true;
      return true;
    }
    
    return false;
  }
  
  // Get user profile
  async getProfile(): Promise<UserProfile> {
    if (!this.isAuthenticated()) {
      throw new Error('Not logged in');
    }
    
    // In a real app, this would fetch profile from Dhan API
    this.addLog('Fetched user profile', 'info');
    return this.mockProfile;
  }
  
  // Get user funds
  async getFunds(): Promise<Funds> {
    if (!this.isLoggedIn && !this.isDemoMode) {
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
    
    // Special handling for Bitcoin
    let basePrice = symbol === 'CRYPTO_BTC' ? 
      3500000 : // ~$42K in INR
      symbol === 'NIFTY' ? 
        19500 : // Starting NIFTY price
        500; // Generic stock price
    
    let lastClose = basePrice;
    
    // Create data points with 5 minute intervals
    const startTime = from.getTime();
    const endTime = to.getTime();
    const intervalMs = interval === '5minute' ? 5 * 60 * 1000 : 60 * 60 * 1000;
    
    // For Bitcoin, make price movements more volatile
    const volatilityFactor = symbol === 'CRYPTO_BTC' ? 3 : 1;
    
    for (let time = startTime; time <= endTime; time += intervalMs) {
      // Simulate some price movement
      const change = ((Math.random() * 40) - 20) * volatilityFactor;
      const open = lastClose;
      const close = open + change;
      const high = Math.max(open, close) + (Math.random() * 15) * volatilityFactor;
      const low = Math.min(open, close) - (Math.random() * 15) * volatilityFactor;
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
    aiInitiated: boolean = false,
    price?: number
  ): Promise<Order> {
    if (!this.isLoggedIn && !this.isDemoMode) {
      throw new Error('Not logged in');
    }
    
    // Generate a random order ID
    const orderId = `ORD${Math.floor(Math.random() * 100000)}`;
    
    // Get current price (simulated)
    const currentPrice = symbol === 'NIFTY' 
      ? 19500 + (Math.random() * 100) - 50
      : symbol === 'CRYPTO_BTC'
        ? 3500000 + (Math.random() * 100000) - 50000
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
      status: Math.random() > 0.1 ? 'COMPLETE' : 'REJECTED', // 90% success rate
      aiInitiated
    };
    
    // Add to orders list
    this.orders.push(order);
    
    // Log the order
    const logType = order.status === 'COMPLETE' ? 'success' : 'error';
    this.addLog(
      `${order.status}: ${order.type} ${order.quantity} ${order.symbol} @ ₹${order.price.toFixed(2)}${aiInitiated ? ' (AI Initiated)' : ''}`,
      logType
    );
    
    // Update funds if order is successful
    if (order.status === 'COMPLETE') {
      const orderValue = order.quantity * order.price;
      
      // If using real money, use the wallet balance
      if (this.isUsingRealMoney && this.wallet.connected) {
        if (order.type === 'BUY') {
          if (this.wallet.balance >= orderValue) {
            this.wallet.balance -= orderValue;
            
            // Create wallet transaction
            const transaction: WalletTransaction = {
              id: `TX${Math.floor(Math.random() * 1000000)}`,
              timestamp: new Date(),
              type: 'TRADE',
              amount: orderValue,
              status: 'COMPLETED',
              description: `${order.type} ${order.quantity} ${order.symbol} @ ₹${order.price.toFixed(2)}`
            };
            this.wallet.transactions.push(transaction);
          } else {
            order.status = 'REJECTED';
            this.addLog(`Order rejected: Insufficient wallet balance`, 'error');
            toast({
              variant: "destructive",
              title: "Order Rejected",
              description: `Insufficient wallet balance for ${order.id}`,
            });
            return order;
          }
        } else {
          // For selling, add to wallet balance
          this.wallet.balance += orderValue;
          
          // Create wallet transaction
          const transaction: WalletTransaction = {
            id: `TX${Math.floor(Math.random() * 1000000)}`,
            timestamp: new Date(),
            type: 'TRADE',
            amount: orderValue,
            status: 'COMPLETED',
            description: `${order.type} ${order.quantity} ${order.symbol} @ ₹${order.price.toFixed(2)}`
          };
          this.wallet.transactions.push(transaction);
        }
      } else {
        // Using virtual money in account
        if (order.type === 'BUY') {
          this.mockFunds.equity.available.cash -= orderValue;
        } else {
          this.mockFunds.equity.available.cash += orderValue;
        }
      }
      
      toast({
        title: aiInitiated ? "AI Order Executed" : "Order Executed",
        description: `${order.id} executed successfully`,
      });
    } else {
      toast({
        variant: "destructive",
        title: aiInitiated ? "AI Order Rejected" : "Order Rejected",
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
  
  // Get AI-initiated orders
  getAIOrders(): Order[] {
    return [...this.orders]
      .filter(order => order.aiInitiated === true)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
      : symbol === 'CRYPTO_BTC'
        ? 3500000 + (Math.random() * 100000) - 50000 
      : symbol.startsWith('CRYPTO_') 
        ? 10 + (Math.random() * 50000)
        : 500 + (Math.random() * 1000);
  }
}

// Create a singleton instance
const dhanService = new DhanService();
export default dhanService;
