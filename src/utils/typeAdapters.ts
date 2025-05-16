
import * as dhanTypes from '@/services/dhanService';
import * as tradingTypes from '@/services/tradingLearning';

/**
 * Converts dhanService UserProfile to tradingLearning UserProfile format
 */
export function adaptUserProfile(profile: dhanTypes.UserProfile): tradingTypes.UserProfile {
  return {
    user_id: profile.user_id || 'unknown',
    user_name: profile.name || 'Unknown User',
    email: profile.email || 'unknown@example.com',
    user_type: profile.user_type || 'normal'
  };
}

/**
 * Converts dhanService Funds to tradingLearning Funds format
 */
export function adaptFunds(funds: dhanTypes.Funds): tradingTypes.Funds {
  return {
    equity: {
      available: {
        cash: funds.equity?.available?.cash || 0,
        collateral: funds.equity?.available?.collateral || 0
      },
      utilized: {
        m2m_unrealised: funds.equity?.utilized?.m2m_unrealised || 0
      }
    }
  };
}

/**
 * Converts dhanService Orders to tradingLearning Order format
 */
export function adaptOrders(orders: dhanTypes.Order[]): tradingTypes.Order[] {
  return orders.map(order => ({
    id: order.order_id || String(order.id) || 'unknown',
    timestamp: new Date(order.order_timestamp || Date.now()),
    symbol: order.symbol || 'unknown',
    type: (order.transaction_type === 'BUY' || order.transaction_type === 'buy') ? 'BUY' : 'SELL',
    price: order.price || 0,
    quantity: order.quantity || 0,
    status: order.status === 'COMPLETE' ? 'COMPLETE' : 
            order.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE'
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
