"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Package, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface OrderStatusProps {
  order: {
    _id: string;
    status: "pending" | "paid" | "shipped" | "delivered" | "disputed";
    buyer: {
      _id: string;
      name: string;
      email: string;
    };
    items: Array<{
      _id: string;
      title: string;
      price: number;
      quantity: number;
      seller: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
    shippingDetails: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    total: number;
    createdAt: string;
    updatedAt: string;
  };
}

const statusConfig = {
  pending: {
    label: "Pending Payment",
    description: "Waiting for payment to be processed",
    icon: Package,
    color: "text-yellow-500",
  },
  paid: {
    label: "Payment Received",
    description: "Payment has been received, waiting for seller to ship",
    icon: Package,
    color: "text-blue-500",
  },
  shipped: {
    label: "Shipped",
    description: "Your order has been shipped",
    icon: Package,
    color: "text-purple-500",
  },
  delivered: {
    label: "Delivered",
    description: "Order has been delivered",
    icon: CheckCircle,
    color: "text-green-500",
  },
  disputed: {
    label: "Issue Reported",
    description: "An issue has been reported with this order",
    icon: AlertCircle,
    color: "text-red-500",
  },
};

export function OrderStatus({ order }: OrderStatusProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isBuyer = session?.user?._id === order.buyer._id;
  const isSeller = order.items.some(
    (item) => item.seller._id === session?.user?._id
  );

  const handleStatusUpdate = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon
            className={`h-5 w-5 ${statusConfig[order.status].color}`}
          />
          {statusConfig[order.status].label}
        </CardTitle>
        <CardDescription>
          {statusConfig[order.status].description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Order Details</h3>
            <ul className="mt-2 space-y-2">
              {order.items.map((item) => (
                <li key={item._id} className="text-sm">
                  {item.title} - Quantity: {item.quantity} - $
                  {item.price.toFixed(2)}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-medium">Total: ${order.total.toFixed(2)}</p>
          </div>

          <div>
            <h3 className="font-medium">Shipping Details</h3>
            <address className="mt-2 text-sm not-italic">
              {order.shippingDetails.name}
              <br />
              {order.shippingDetails.street1}
              {order.shippingDetails.street2 && (
                <>
                  <br />
                  {order.shippingDetails.street2}
                </>
              )}
              <br />
              {order.shippingDetails.city}, {order.shippingDetails.state}{" "}
              {order.shippingDetails.zip}
              <br />
              {order.shippingDetails.country}
            </address>
          </div>

          {isSeller && order.status === "paid" && (
            <Button
              onClick={() => handleStatusUpdate("mark_shipped")}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Mark as Shipped"
              )}
            </Button>
          )}

          {isBuyer && order.status === "shipped" && (
            <div className="space-y-2">
              <Button
                onClick={() => handleStatusUpdate("mark_delivered")}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Delivery"
                )}
              </Button>
              <Button
                onClick={() => handleStatusUpdate("report_issue")}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Report Issue"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
