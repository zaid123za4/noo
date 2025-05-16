
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChartComponent, 
  LineChartComponent, 
  BarChartComponent,
  generateRandomChartData,
  generateRandomLineChartData,
  generateRandomBarChartData
} from './DashboardCharts';

interface AnalyticsTabProps {
  chartData: any[];
  lineChartData: any[];
  barChartData: any[];
  isDemoMode: boolean;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  chartData, 
  lineChartData, 
  barChartData,
  isDemoMode 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Trading Volume</CardTitle>
          <CardDescription>Historical trading volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChartComponent 
            data={chartData}
            isDemoMode={isDemoMode}
            generateRandomData={generateRandomChartData}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
          <CardDescription>Historical price movements</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartComponent 
            data={lineChartData}
            isDemoMode={isDemoMode}
            generateRandomData={generateRandomLineChartData}
          />
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Profit and Loss Analysis</CardTitle>
          <CardDescription>Monthly profit and loss comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChartComponent 
            data={barChartData}
            isDemoMode={isDemoMode}
            generateRandomData={generateRandomBarChartData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
