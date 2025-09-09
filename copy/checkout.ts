export const checkoutCopy = {
  headings: {
    pageTitle: "Checkout",
    shippingDetails: "Shipping Details",
    payment: "Payment",
  },
  descriptions: {
    pageSubtitle:
      "Complete your purchase by providing shipping details and payment information.",
    shippingHelp: "Enter your shipping address for delivery.",
    paymentHelp: "Complete your purchase securely with Stripe.",
  },
  steps: {
    step1Address: "Step 1 of 3 • Address",
    step2Payment: "Step 2 of 3 • Payment",
    step3Confirm: "Step 3 of 3 • Confirm",
  },
  fields: {
    name: { label: "Full Name", placeholder: "John Doe" },
    street1: { label: "Street Address", placeholder: "123 Main St" },
    street2: { label: "Apartment, suite, etc.", placeholder: "Apt 4B" },
    city: { label: "City", placeholder: "New York" },
    state: { label: "State", placeholder: "NY" },
    zip: {
      label: "ZIP Code",
      help: "Use your 5-digit ZIP (e.g., 10001).",
      placeholder: "10001",
    },
    country: { label: "Country", placeholder: "United States" },
    phone: { label: "Phone", help: "10-digit US number (e.g., 555-555-5555)." },
  },
  cta: {
    validateAndContinue: "Validate & Continue",
    validatingAddress: "Validating address...",
    preparingPayment: "Preparing secure payment...",
  },
  preflight: {
    title: "We updated your cart",
    description:
      "Some prices or quantities changed since you last viewed your cart.",
    accept: "Accept updates",
    dismiss: "Dismiss",
    changeLabels: {
      price: "Price",
      quantity: "Quantity",
      old: "Old",
      new: "New",
    },
  },
  empty: {
    cartTitle: "Your cart is empty",
    cartDesc: "Add some items to your cart to continue shopping.",
    browseProducts: "Browse products",
  },
  cartSummary: {
    yourOrder: "Your Order",
    quantity: "Quantity",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingFree: "Free",
    total: "Total",
  },
  errors: {
    addressInvalid: "Invalid shipping address. Please check and try again.",
    paymentPrepFailed: "Failed to prepare payment. Please try again.",
  },
};


