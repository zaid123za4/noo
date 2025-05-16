
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile, Funds, Order } from '@/services/tradingLearning';

interface AccountTabProps {
  userProfile: UserProfile;
  funds: Funds;
  orders: Order[];
}

const AccountTab: React.FC<AccountTabProps> = ({ userProfile, funds, orders }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>User ID:</strong> {userProfile.user_id}</p>
          <p><strong>Name:</strong> {userProfile.user_name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>User Type:</strong> {userProfile.user_type}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Funds Information</CardTitle>
          <CardDescription>Details about your available funds</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>Available Cash:</strong> ₹{funds.equity.available.cash.toFixed(2)}</p>
          <p><strong>Available Collateral:</strong> ₹{funds.equity.available.collateral.toFixed(2)}</p>
          <p><strong>Utilized M2M Unrealised:</strong> ₹{funds.equity.utilized.m2m_unrealised.toFixed(2)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your recent trading orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <ul className="list-disc pl-5">
              {orders.map(order => (
                <li key={order.id}>
                  {order.type} {order.symbol} - ₹{order.price.toFixed(2)} ({order.status})
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent orders found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;
