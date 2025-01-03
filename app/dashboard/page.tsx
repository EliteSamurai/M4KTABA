"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { OverviewCards } from "@/components/overview-cards";
import { TransactionsTable } from "@/components/transactions-table";
import { PayoutsList } from "@/components/payouts-list";
import { BalanceData, Transaction, Payout } from "@/types/stripe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

export default function StripeDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    balance: BalanceData;
    volume: { current: number; previous: number; currency: string };
    transactions: Transaction[];
    payouts: Payout[];
  } | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stripeAccountId = session?.user.stripeAccountId;

        // Fetch data with the stripeAccountId as a query parameter
        const response = await fetch(
          `/api/stripe/dashboard?stripeAccountId=${stripeAccountId}`
        );
        const result = await response.json();
        console.log(result);

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch dashboard data");
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user.stripeAccountId]);

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-8 py-6 min-h-screen">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your payment activity
        </p>
      </div>

      <OverviewCards balance={data.balance} volume={data.volume} />

      <div className="grid gap-8 md:grid-cols-7">
        <div className="md:col-span-4">
          <TransactionsTable transactions={data.transactions} />
        </div>
        <div className="md:col-span-3">
          <PayoutsList payouts={data.payouts} />
        </div>
      </div>
    </div>
  );
}
