import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { SellerDashboardClient } from './SellerDashboardClient';

export const metadata = {
  title: 'Seller Dashboard | M4KTABA',
  description: 'Manage your sales, view analytics, and track payouts',
};

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/seller');
  }

  return (
    <div className="container mx-auto py-8">
      <SellerDashboardClient userId={session.user._id as string} />
    </div>
  );
}

