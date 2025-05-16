
import * as dhanTypes from '@/services/dhanService';
import * as tradingTypes from '@/services/tradingLearning';

/**
 * Converts dhanService UserProfile to tradingLearning UserProfile format
 */
export function adaptUserProfile(profile: dhanTypes.UserProfile): tradingTypes.UserProfile {
  return {
    user_id: profile.userId || 'unknown',
    user_name: profile.name || 'Unknown User',
    email: profile.email || 'unknown@example.com',
    user_type: profile.userType || 'normal'
  };
}

/**
 * Converts dhanService Funds to tradingLearning Funds format
 */
export function adaptFunds(funds: dhanTypes.Funds): tradingTypes.Funds {
  return {
    equity: {
      available: {
        cash: funds.available?.cash || 0,
        collateral: funds.available?.collateral || 0
      },
      utilized: {
        m2m_unrealised: funds.utilized?.m2m_unrealised || 0
      }
    }
  };
}

/**
 * Converts dhanService Orders to tradingLearning Order format
 */
export function adaptOrders(orders: dhanTypes.Order[]): tradingTypes.Order[] {
  return orders.map(order => ({
    id: order.orderId || String(Math.random()) || 'unknown',
    timestamp: new Date(order.orderTimestamp || Date.now()),
    symbol: order.instrumentKey || 'unknown',
    type: (order.transactionType === 'BUY' || order.transactionType === 'buy') ? 'BUY' : 'SELL',
    price: order.price || 0,
    quantity: order.quantity || 0,
    status: order.status === 'COMPLETE' ? 'COMPLETE' : 
            order.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE'
  }));
}

/**
 * Adapts TradeLog from dhanService format to tradingLearning format
 */
export function adaptTradeLogs(logs: dhanTypes.TradeLog[]): tradingTypes.TradeLog[] {
  return logs.map(log => ({
    timestamp: new Date(log.timestamp || Date.now()),
    message: log.message || 'Unknown log message',
    type: log.type || 'info'
  }));
}

/**
 * Determines if an error is an instance of Error
 */
export function isErrorInstance(error: any): error is Error {
  return error instanceof Error || 
         (typeof error === 'object' && 
          error !== null && 
          'message' in error);
}
