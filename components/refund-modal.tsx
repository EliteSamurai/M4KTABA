"use client";

import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (refundReason: string, refundAmount: number) => Promise<void>;
  maxAmount?: number;
  itemTitle?: string;
}

export default function RefundModal({
  isOpen,
  onClose,
  onSubmit,
  maxAmount = 0,
  itemTitle,
}: RefundModalProps) {
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<number>(maxAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!refundReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the refund request.",
        variant: "destructive",
      });
      return;
    }

    if (refundAmount <= 0 || isNaN(refundAmount) || refundAmount > maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Please enter an amount between $0 and $${maxAmount.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(refundReason, refundAmount);
      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted successfully.",
      });
      handleClose();
    } catch (error) {
      if (error instanceof Error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRefundReason("");
    setRefundAmount(maxAmount);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Refund</DialogTitle>
          <DialogDescription>
            {itemTitle
              ? `Request a refund for "${itemTitle}"`
              : "Submit your refund request below"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Refund Details</CardTitle>
              <CardDescription>
                Maximum refund amount: ${maxAmount.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Refund Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="pl-9"
                    disabled
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Refund</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you're requesting a refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
