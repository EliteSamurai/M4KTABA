const messages: Record<string, string> = {
  card_declined:
    "Your bank declined the card. Try another card or contact bank.",
  incorrect_cvc: "The security code is incorrect.",
  expired_card: "This card is expired.",
  insufficient_funds: "Insufficient funds. Try another payment method.",
  processing_error: "A processing error occurred. Please try again.",
};

export function mapStripeError(code?: string, fallback?: string): string {
  if (!code) return fallback || "Payment could not be completed.";
  return messages[code] || fallback || "Payment could not be completed.";
}
