
import * as dhanTypes from '@/services/dhanService';
import * as tradingTypes from '@/services/tradingLearning';

/**
 * Converts dhanService UserProfile to tradingLearning UserProfile format
 */
export function adaptUserProfile(profile: dhanTypes.UserProfile): tradingTypes.UserProfile {
  return {
    user_id: profile.clientId || 'unknown',
    user_name: profile.name || 'Unknown User',
    email: profile.email || 'unknown@example.com',
    user_type: profile.accountType || 'normal'
  };
}

/**
 * Converts dhanService Funds to tradingLearning Funds format
 */
export function adaptFunds(funds: dhanTypes.Funds): tradingTypes.Funds {
  return {
    equity: {
      available: {
        cash: funds.availableCash || 0,
        collateral: 0
      },
      utilized: {
        m2m_unrealised: funds.usedMargin || 0
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
    timestamp: new Date(order.timestamp || Date.now()),
    symbol: order.tradingSymbol || 'unknown',
    type: (order.transactionType === 'BUY' || order.transactionType.toLowerCase() === 'buy') ? 'BUY' : 'SELL',
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
