
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeLog } from '@/services/tradingLearning';

interface LogsTabProps {
  logs: TradeLog[];
}

const LogsTab: React.FC<LogsTabProps> = ({ logs }) => {
  return (
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
  );
};

export default LogsTab;
