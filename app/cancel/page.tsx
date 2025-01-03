import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="container">
      <h1>Payment Canceled</h1>
      <p>
        Your payment has been canceled. You can return to your cart and try
        again.
      </p>
      <Link href="/" className="button">
        Go Home
      </Link>
    </div>
  );
}
