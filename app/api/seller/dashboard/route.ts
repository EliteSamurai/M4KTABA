import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const timeRange = searchParams.get('timeRange') || '30d';

  if (!userId || userId !== session.user._id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // TODO: Fetch real data from database
    // For now, return mock data structure
    
    const transactions = await fetchTransactions(userId, timeRange);
    const metrics = await calculateMetrics(transactions);

    return NextResponse.json({
      transactions,
      metrics,
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching seller dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function fetchTransactions(userId: string, timeRange: string) {
  // TODO: Implement database query
  // This would query your Sanity database for orders where seller matches userId
  
  /*
  const { readClient } = await import('@/studio-m4ktaba/client');
  
  const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  
  const orders = await readClient.fetch(`
    *[_type == "order" && seller._ref == $userId && _createdAt >= $startDate] | order(_createdAt desc) {
      _id,
      orderId,
      _createdAt,
      amount,
      currency,
      status,
      paymentMethod,
      platformFee,
      processorFee,
      netAmount,
      buyer->{email}
    }
  `, { userId, startDate: startDate.toISOString() });
  
  return orders;
  */
  
  return [];
}

async function calculateMetrics(transactions: any[]) {
  // Calculate metrics from transactions
  const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOrders = transactions.length;
  const completedOrders = transactions.filter(t => t.status === 'completed').length;
  const refundedOrders = transactions.filter(t => t.status === 'refunded').length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Pending payouts = completed orders that haven't been paid out yet
  const pendingPayouts = transactions
    .filter(t => t.status === 'completed' && !t.paidOut)
    .reduce((sum, t) => sum + (t.netAmount || 0), 0);

  return {
    totalSales,
    totalOrders,
    completedOrders,
    refundedOrders,
    averageOrderValue,
    pendingPayouts,
  };
}

