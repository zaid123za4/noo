
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDemoMode } from '@/hooks/use-demo-mode';
import { useTradingMode } from '@/hooks/use-trading-mode';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useTradingStrategy } from '@/hooks/use-trading-strategy';
import { 
  mockChartData, 
  mockLineChartData, 
  mockBarChartData 
} from './dashboard/DashboardCharts';
import InstrumentSelectorCard from './dashboard/InstrumentSelectorCard';
import OverviewTab from './dashboard/OverviewTab';
import AnalyticsTab from './dashboard/AnalyticsTab';
import AccountTab from './dashboard/AccountTab';
import LogsTab from './dashboard/LogsTab';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { isAutoMode, toggleTradingMode } = useTradingMode();
  
  // Get user data and trade information
  const { 
    isLoggedIn, 
    userProfile, 
    funds, 
    orders, 
    logs 
  } = useDashboardData();
  
  // Trading strategy state management
  const {
    selectedSymbol,
    predictionData,
    strategyRunning,
    handleSymbolSelect,
    handleRunStrategy
  } = useTradingStrategy();
  
  // Chart data state
  const [chartData] = useState(mockChartData);
  const [lineChartData] = useState(mockLineChartData);
  const [barChartData] = useState(mockBarChartData);
  
  // Handle login button click
  const handleLoginClick = () => {
    navigate('/login');
  };
  
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
      <InstrumentSelectorCard
        onSymbolSelect={handleSymbolSelect}
        selectedSymbol={selectedSymbol}
        predictionData={predictionData}
        handleRunStrategy={handleRunStrategy}
        strategyRunning={strategyRunning}
        isAutoMode={isAutoMode}
        toggleTradingMode={toggleTradingMode}
      />
      
      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab 
            funds={funds}
            predictionData={predictionData}
            selectedSymbol={selectedSymbol}
          />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsTab
            chartData={chartData}
            lineChartData={lineChartData}
            barChartData={barChartData}
            isDemoMode={isDemoMode}
          />
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account">
          <AccountTab
            userProfile={userProfile}
            funds={funds}
            orders={orders}
          />
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs">
          <LogsTab logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
