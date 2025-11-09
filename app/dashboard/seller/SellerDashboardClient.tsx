'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SellerDashboardClientProps {
  userId: string;
}

interface Transaction {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded';
  paymentMethod: 'stripe' | 'paypal';
  platformFee: number; // Always 0
  processorFee: number;
  netAmount: number;
  buyer: string;
}

interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingPayouts: number;
  completedOrders: number;
  refundedOrders: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function SellerDashboardClient({ userId }: SellerDashboardClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [userId, timeRange]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/seller/dashboard?userId=${userId}&timeRange=${timeRange}`
      );
      const data = await response.json();
      
      setTransactions(data.transactions || []);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockMetrics: SalesMetrics = {
    totalSales: 12450.50,
    totalOrders: 87,
    averageOrderValue: 143.11,
    pendingPayouts: 1250.00,
    completedOrders: 82,
    refundedOrders: 5,
  };

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      orderId: 'm4k-001',
      date: '2025-11-09',
      amount: 59.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'stripe',
      platformFee: 0,
      processorFee: 2.04,
      netAmount: 57.95,
      buyer: 'john@example.com',
    },
    {
      id: '2',
      orderId: 'm4k-002',
      date: '2025-11-08',
      amount: 89.99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'paypal',
      platformFee: 0,
      processorFee: 2.91,
      netAmount: 87.08,
      buyer: 'jane@example.com',
    },
  ];

  const salesByDay = [
    { date: '11/3', sales: 450 },
    { date: '11/4', sales: 380 },
    { date: '11/5', sales: 620 },
    { date: '11/6', sales: 540 },
    { date: '11/7', sales: 710 },
    { date: '11/8', sales: 890 },
    { date: '11/9', sales: 1200 },
  ];

  const salesByMethod = [
    { name: 'Stripe', value: 7200, percentage: 58 },
    { name: 'PayPal', value: 5250, percentage: 42 },
  ];

  const salesByCurrency = [
    { currency: 'USD', sales: 8900, orders: 67 },
    { currency: 'EUR', sales: 2100, orders: 12 },
    { currency: 'GBP', sales: 1450, orders: 8 },
  ];

  const displayMetrics = metrics || mockMetrics;
  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your sales, view analytics, and manage payouts
        </p>
        <Badge className="mt-2 bg-green-100 text-green-800">
          0% Platform Fees - You Keep 100%
        </Badge>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {range === 'all' ? 'All Time' : range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.totalSales, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayMetrics.completedOrders} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.averageOrderValue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+5.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.pendingPayouts, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Daily sales over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Payment Method</CardTitle>
                <CardDescription>Distribution of payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByMethod}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesByMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Fee Transparency */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Fee Breakdown - 100% Transparent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Platform Fee</p>
                  <p className="text-2xl font-bold text-green-600">$0.00 (0%)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You keep 100% of sales!
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Processor Fees</p>
                  <p className="text-2xl font-bold">
                    ${((displayMetrics.totalSales * 0.029) + (displayMetrics.totalOrders * 0.30)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stripe/PayPal fees only
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Net Earnings</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      displayMetrics.totalSales -
                        (displayMetrics.totalSales * 0.029 + displayMetrics.totalOrders * 0.30),
                      'USD'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After processor fees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                View all your sales from Stripe and PayPal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        transaction.paymentMethod === 'stripe'
                          ? 'bg-blue-100'
                          : 'bg-[#FFC439]/20'
                      }`}>
                        {transaction.paymentMethod === 'stripe' ? (
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        ) : (
                          <span className="text-xs font-bold">PP</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.buyer} • {transaction.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Platform: $0.00</span>
                        <span>•</span>
                        <span>Fee: ${transaction.processorFee.toFixed(2)}</span>
                      </div>
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Net: {formatCurrency(transaction.netAmount, transaction.currency)}
                      </p>
                    </div>

                    <Badge
                      variant={
                        transaction.status === 'completed'
                          ? 'default'
                          : transaction.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales by Currency */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Currency</CardTitle>
                <CardDescription>International sales breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByCurrency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Current order statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Completed</span>
                  </div>
                  <span className="font-bold">{displayMetrics.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending</span>
                  </div>
                  <span className="font-bold">
                    {displayMetrics.totalOrders - displayMetrics.completedOrders - displayMetrics.refundedOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>Refunded</span>
                  </div>
                  <span className="font-bold">{displayMetrics.refundedOrders}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

