export type CheckoutState =
  | { status: "idle" }
  | { status: "validatingAddress" }
  | { status: "addressError"; message: string }
  | { status: "creatingIntent" }
  | { status: "paymentReady" }
  | { status: "paymentError"; message: string };

export type CheckoutEvent =
  | { type: "SUBMIT" }
  | { type: "ADDRESS_OK" }
  | { type: "ADDRESS_ERROR"; message?: string }
  | { type: "INTENT_OK" }
  | { type: "INTENT_ERROR"; message?: string }
  | { type: "RESET" };

export const initialCheckoutState: CheckoutState = { status: "idle" };

export function checkoutReducer(
  state: CheckoutState,
  event: CheckoutEvent
): CheckoutState {
  switch (state.status) {
    case "idle": {
      if (event.type === "SUBMIT") return { status: "validatingAddress" };
      return state;
    }
    case "validatingAddress": {
      if (event.type === "ADDRESS_OK") return { status: "creatingIntent" };
      if (event.type === "ADDRESS_ERROR")
        return {
          status: "addressError",
          message:
            event.message ||
            "Invalid shipping address. Please check and try again.",
        };
      return state;
    }
    case "addressError": {
      if (event.type === "RESET") return { status: "idle" };
      return state;
    }
    case "creatingIntent": {
      if (event.type === "INTENT_OK") return { status: "paymentReady" };
      if (event.type === "INTENT_ERROR")
        return {
          status: "paymentError",
          message:
            event.message || "Failed to prepare payment. Please try again.",
        };
      return state;
    }
    case "paymentError": {
      if (event.type === "RESET") return { status: "idle" };
      return state;
    }
    case "paymentReady": {
      if (event.type === "RESET") return { status: "idle" };
      return state;
    }
    default:
      return state;
  }
}

export function isBusy(state: CheckoutState): boolean {
  return (
    state.status === "validatingAddress" || state.status === "creatingIntent"
  );
}

export function canSubmit(state: CheckoutState): boolean {
  return state.status === "idle" || state.status === "addressError";
}
