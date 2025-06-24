"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import {
  Loader2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

interface MakeOfferFormProps {
  bookId: string;
  sellerId: string;
  currentPrice: number;
  bookTitle: string;
  onOfferSubmitted?: () => void;
}

interface OfferFormData {
  amount: number;
}

interface ExistingOffer {
  _id: string;
  status: string;
  amount: number;
  _createdAt: string;
  isCounterOffer: boolean;
}

export default function MakeOfferForm({
  bookId,
  sellerId,
  currentPrice,
  bookTitle,
  onOfferSubmitted,
}: MakeOfferFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOffers, setExistingOffers] = useState<ExistingOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canMakeOffer, setCanMakeOffer] = useState(true);
  const [offerMessage, setOfferMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<OfferFormData>();

  const watchedAmount = watch("amount");

  // Check existing offers when component mounts
  useEffect(() => {
    const checkExistingOffers = async () => {
      if (!session?.user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/offers/check?bookId=${bookId}&buyerId=${session.user._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setExistingOffers(data.offers || []);

          const pendingOffer = data.offers?.find(
            (offer: ExistingOffer) => offer.status === "pending"
          );
          const declinedOffers =
            data.offers?.filter(
              (offer: ExistingOffer) =>
                offer.status === "declined" && !offer.isCounterOffer
            ) || [];
          const totalOffers = data.offers?.length || 0;

          if (pendingOffer) {
            setCanMakeOffer(false);
            setOfferMessage(
              `You have a pending offer of $${pendingOffer.amount} for this book.`
            );
          } else if (totalOffers >= 2) {
            setCanMakeOffer(false);
            setOfferMessage(
              "You have reached the maximum number of offers for this book (2 total offers)."
            );
          } else if (declinedOffers.length === 1) {
            setCanMakeOffer(true);
            setOfferMessage(
              "Your previous offer was declined. You can make one more offer for this book."
            );
          } else {
            setCanMakeOffer(true);
            setOfferMessage("");
          }
        }
      } catch (error) {
        console.error("Error checking existing offers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingOffers();
  }, [bookId, session?.user?._id]);

  const onSubmit = async (data: OfferFormData) => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to make an offer.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/offer/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
          sellerId,
          amount: data.amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit offer");
      }

      toast({
        title: "Offer submitted successfully! 🎉",
        description:
          "Your offer has been sent to the seller. You'll be notified when they respond.",
      });
      reset();
      onOfferSubmitted?.();

      // Refresh the component to show updated state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit offer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please sign in to make an offer on this book.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (session.user._id === sellerId) {
    return null; // Don't show form to the seller
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking offer status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Make an Offer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Price:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${currentPrice}
            </span>
          </div>
        </div>

        {/* Existing Offers Status */}
        {offerMessage && (
          <Alert variant={canMakeOffer ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{offerMessage}</AlertDescription>
          </Alert>
        )}

        {/* Previous Offers Display */}
        {existingOffers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Your Previous Offers:
            </h4>
            <div className="space-y-2">
              {existingOffers.map((offer) => (
                <div
                  key={offer._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">${offer.amount}</span>
                    <Badge
                      variant="outline"
                      className={
                        offer.status === "pending"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : offer.status === "declined"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : offer.status === "accepted"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {offer.status.charAt(0).toUpperCase() +
                        offer.status.slice(1)}
                      {offer.isCounterOffer && " (Counter)"}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(offer._createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Form */}
        {canMakeOffer ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="amount"
                className="text-sm font-medium text-gray-700"
              >
                Your Offer Amount ($)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={currentPrice}
                placeholder="Enter your offer amount"
                {...register("amount", {
                  required: "Offer amount is required",
                  min: {
                    value: 0.01,
                    message: "Offer must be at least $0.01",
                  },
                  max: {
                    value: currentPrice,
                    message: `Offer cannot exceed current price of $${currentPrice}`,
                  },
                  validate: (value) => {
                    if (value >= currentPrice) {
                      return "Consider buying at full price instead of making an offer";
                    }
                    return true;
                  },
                })}
                className="w-full"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}

              {/* Offer Percentage Display */}
              {watchedAmount && watchedAmount > 0 && (
                <div className="text-sm text-gray-600">
                  This is {Math.round((watchedAmount / currentPrice) * 100)}% of
                  the asking price
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting Offer...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Offer
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              The seller will be notified of your offer and can accept, decline,
              or make a counter offer.
            </p>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">
              You cannot make additional offers for this book at this time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
