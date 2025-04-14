"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ArrowRight,
  ExternalLink,
  Info as InfoCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CartItem } from "@/types/shipping-types";
import { ReviewModal } from "@/components/review-modal";
import { useToast } from "@/hooks/use-toast";
import RefundModal from "@/components/refund-modal";

interface Order {
  _id: string;
  _createdAt: string;
  status: string;
  cart: CartItem[];
}

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(
    null
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [maxRefundAmount, setMaxRefundAmount] = useState<number>(0);
  const [itemTitle, setItemTitle] = useState<string>("");
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!session?.user?.stripeAccountId) {
        console.warn(
          "Stripe account ID is missing. Skipping order history fetch."
        );
        return;
      }

      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch order history");
        }
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while fetching orders.");
        }
      }
    };

    fetchOrderHistory();
  }, [session?.user?.stripeAccountId]);

  const handleLeaveReview = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (rating === null) {
      toast({
        title: "Error",
        description: "Please select a rating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);

    if (reviewText && reviewText.trim().length > 500) {
      toast({
        title: "Warning",
        description: "Review text should be under 500 characters.",
        variant: "destructive",
      });
      return;
    }

    const reviewPayload = {
      score: rating,
      review: reviewText,
    };

    try {
      const response = await fetch(`/api/sellers/${selectedSellerId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewPayload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Review submitted successfully!",
          variant: "default",
        });
        setRating(null);
        setReviewText("");
        setIsReviewModalOpen(false);
        setIsSubmittingReview(false);
      } else {
        toast({
          title: "Error",
          description: `Failed to submit review: ${data.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "An error occurred while submitting the review.",
        variant: "destructive",
      });
    }
  };

  const handleRefundClick = (
    orderId: string,
    cartItemId: string,
    maxAmount: number,
    title: string
  ) => {
    setSelectedOrderId(orderId);
    setSelectedCartItemId(cartItemId);
    setMaxRefundAmount(maxAmount);
    setItemTitle(title);
    setIsRefundModalOpen(true);
  };

  const handleRefundRequest = async (
    refundReason: string,
    refundAmount: number
  ) => {
    if (!selectedOrderId || !selectedCartItemId) return;

    try {
      const response = await fetch(
        `/api/orders/${selectedOrderId}/request-refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: selectedOrderId,
            cartItemId: selectedCartItemId,
            refundReason,
            refundAmount,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Refund Requested",
          description:
            "Your refund request has been submitted successfully. Be sure to check your junk email.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting refund:", error);
      toast({
        title: "Error",
        description: "Failed to submit refund request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStripeButtonClick = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/account-link", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to get Stripe link");

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Could not retrieve Stripe link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.search.includes("onboarding=success")) {
      toast({
        title: "Success",
        description: "Stripe account created successfully!",
      });
    }
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          You must be logged in to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Billing Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your billing information and view your payment history.
          </p>
        </div>

        <div className="mt-8 grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Stripe Account
              </CardTitle>
              <CardDescription>
                Connect your Stripe account to start accepting payments.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleStripeButtonClick}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {session?.user?.stripeAccountId
                  ? "View Stripe Dashboard"
                  : "Connect Stripe Account"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Order History
              </h2>
              <p className="text-sm text-muted-foreground">
                View and manage your previous orders
              </p>
            </div>
          </div>
          <Separator className="my-4" />

          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        Order #{order._id.slice(-8)}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(order._createdAt), "PPP")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "pending"
                            ? "secondary"
                            : order.status === "refunded"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-1">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="items">
                      <AccordionTrigger className="text-sm">
                        View Order Items
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="w-[100px] text-right">
                                Quantity
                              </TableHead>
                              <TableHead className="w-[100px] text-right">
                                Price
                              </TableHead>
                              <TableHead className="w-[200px] text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.cart.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {item.title}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${item.price.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (item?.user?._id) {
                                          handleLeaveReview(item.user._id);
                                        } else {
                                          console.error("User ID is missing");
                                        }
                                      }}
                                    >
                                      Rate Seller
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleRefundClick(
                                          order._id,
                                          item.id,
                                          item.price,
                                          item.title
                                        )
                                      }
                                    >
                                      Refund
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 flex justify-between border-t pt-4">
                          <span className="text-sm font-medium">Total</span>
                          <span className="text-sm font-medium">
                            $
                            {order.cart
                              .reduce(
                                (acc, item) => acc + item.price * item.quantity,
                                0
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.length === 0 && (
            <Card>
              <CardContent className="flex min-h-[120px] pt-5 flex-col items-center justify-center space-y-2 text-center">
                <div className="text-sm text-muted-foreground">
                  No orders found
                </div>
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground"
                >
                  <Link href="/all">Start shopping</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        sellerId={selectedSellerId}
        rating={rating}
        setRating={setRating}
        reviewText={reviewText}
        setReviewText={setReviewText}
        onSubmit={handleSubmitReview}
      />

      {isRefundModalOpen && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          onSubmit={handleRefundRequest}
          maxAmount={maxRefundAmount}
          itemTitle={itemTitle}
        />
      )}
    </div>
  );
}
