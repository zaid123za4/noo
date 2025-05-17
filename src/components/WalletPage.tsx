
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useDemoMode } from '@/hooks/use-demo-mode';
import dhanService, { WalletTransaction } from '@/services/dhanService';
import { Bitcoin, Wallet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoMode, usingRealMoney, toggleRealMoney } = useDemoMode();
  const [wallet, setWallet] = useState(dhanService.getWalletInfo());
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!dhanService.isAuthenticated()) {
      navigate('/');
      return;
    }

    // Get initial wallet info
    setWallet(dhanService.getWalletInfo());
    setTransactions(dhanService.getWalletTransactions());

    // Update wallet info every 10 seconds
    const intervalId = setInterval(() => {
      setWallet(dhanService.getWalletInfo());
      setTransactions(dhanService.getWalletTransactions());
    }, 10000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleConnectWallet = () => {
    if (dhanService.connectWallet()) {
      setWallet(dhanService.getWalletInfo());
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully"
      });
    }
  };

  const handleDisconnectWallet = () => {
    if (dhanService.disconnectWallet()) {
      setWallet(dhanService.getWalletInfo());
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected"
      });
    }
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit"
      });
      return;
    }

    const transaction = dhanService.depositToWallet(amount);
    if (transaction) {
      setWallet(dhanService.getWalletInfo());
      setTransactions(dhanService.getWalletTransactions());
      setDepositAmount('');
      toast({
        title: "Deposit Successful",
        description: `₹${amount.toLocaleString()} has been added to your wallet`
      });
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw"
      });
      return;
    }

    if (amount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough funds in your wallet"
      });
      return;
    }

    const transaction = dhanService.withdrawFromWallet(amount);
    if (transaction) {
      setWallet(dhanService.getWalletInfo());
      setTransactions(dhanService.getWalletTransactions());
      setWithdrawAmount('');
      toast({
        title: "Withdrawal Successful",
        description: `₹${amount.toLocaleString()} has been withdrawn from your wallet`
      });
    }
  };

  const handleToggleRealMoney = () => {
    if (!wallet.connected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet first to use real money"
      });
      return;
    }
    
    dhanService.setRealMoneyMode(!usingRealMoney);
    toggleRealMoney();
    toast({
      title: usingRealMoney ? "Demo Mode Activated" : "Real Money Mode Activated",
      description: usingRealMoney 
        ? "You are now trading with virtual funds" 
        : "You are now trading with real money!"
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet Dashboard</h1>
          <p className="text-gray-500">Manage your funds and transactions</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Return to Trading
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" /> Wallet
              </CardTitle>
              <Badge variant={wallet.connected ? "default" : "outline"}>
                {wallet.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <CardDescription>
              {wallet.connected 
                ? `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` 
                : "Connect your wallet to trade with real money"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium">Balance</p>
              <p className="text-3xl font-bold">₹{wallet.balance.toLocaleString()}</p>
            </div>
            
            {isDemoMode && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {usingRealMoney 
                    ? "Trading with real money (demo)" 
                    : "Trading with virtual funds"}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {wallet.connected ? (
              <>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDisconnectWallet}
                >
                  Disconnect
                </Button>
                <Button
                  variant={usingRealMoney ? "destructive" : "default"}
                  size="sm"
                  onClick={handleToggleRealMoney}
                >
                  {usingRealMoney ? "Use Virtual Funds" : "Use Real Money"}
                </Button>
              </>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Bitcoin Trading Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5" /> Bitcoin Trading
            </CardTitle>
            <CardDescription>
              AI-powered BTC trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={dhanService.isBitcoinAutoTradingActive() ? "default" : "outline"}>
                    {dhanService.isBitcoinAutoTradingActive() ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Mode</p>
                <Badge variant={usingRealMoney ? "destructive" : "outline"} className="mt-1">
                  {usingRealMoney ? "Real Money" : "Virtual"}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <p className="text-sm font-medium">AI Trading Features</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automated buy/sell decisions</li>
                <li>• Market trend analysis</li>
                <li>• Risk management</li>
                <li>• 24/7 monitoring</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              onClick={() => {
                if (dhanService.isBitcoinAutoTradingActive()) {
                  import('@/services/trading/tradeExecutor').then(module => {
                    module.stopBitcoinAutoTrading();
                  });
                } else {
                  import('@/services/trading/tradeExecutor').then(module => {
                    module.startBitcoinAutoTrading(5);
                  });
                }
              }}
              variant={dhanService.isBitcoinAutoTradingActive() ? "destructive" : "default"}
              className="w-full"
            >
              {dhanService.isBitcoinAutoTradingActive() ? "Stop AI Trading" : "Start AI Trading"}
            </Button>
          </CardFooter>
        </Card>

        {/* Funds Management */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" /> Manage Funds
            </CardTitle>
            <CardDescription>
              Add or remove funds from your wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>
              <TabsContent value="deposit" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="deposit-amount">Amount (₹)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <Button onClick={handleDeposit}>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="withdraw" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Available: ₹{wallet.balance.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={wallet.balance}
                    />
                    <Button onClick={handleWithdraw}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b">
                      <td className="py-3 text-sm">{tx.id}</td>
                      <td className="py-3 text-sm">
                        {tx.timestamp.toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant={
                          tx.type === 'DEPOSIT' ? "default" :
                          tx.type === 'WITHDRAWAL' ? "secondary" :
                          "outline"
                        }>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">₹{tx.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <Badge variant={
                          tx.status === 'COMPLETED' ? "success" :
                          tx.status === 'PENDING' ? "outline" :
                          "destructive"
                        }>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
