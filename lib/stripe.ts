import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export async function getTransactions(timeframe: 'week' | 'month' | 'year') {
  const now = new Date()
  const startDate = new Date()

  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  const charges = await stripe.charges.list({
    created: {
      gte: Math.floor(startDate.getTime() / 1000),
    },
    limit: 100,
  })

  return charges.data
}

export async function getRevenue(timeframe: 'week' | 'month' | 'year') {
  const transactions = await getTransactions(timeframe)
  return transactions.reduce((acc, charge) => acc + charge.amount, 0) / 100
}