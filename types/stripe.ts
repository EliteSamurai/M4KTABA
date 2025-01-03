export interface Transaction {
    id: string
    amount: number
    status: 'succeeded' | 'pending' | 'failed'
    created: number
    customer: {
      name: string
      email: string
    }
    payment_method: string
    currency: string
  }
  
  export interface Payout {
    id: string
    amount: number
    status: 'paid' | 'pending' | 'failed'
    arrival_date: number
    currency: string
  }
  
  export interface BalanceData {
    available: number
    pending: number
    currency: string
  }
  