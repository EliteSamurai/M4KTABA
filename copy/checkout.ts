export const checkoutCopy = {
  headings: {
    pageTitle: 'Checkout',
    shippingDetails: 'Shipping Details',
    payment: 'Payment',
  },
  descriptions: {
    pageSubtitle:
      'Complete your purchase securely. We never charge platform fees - 100% goes to sellers.',
    shippingHelp: 'Enter your shipping address. Shipping starts at $3.99 for domestic orders.',
    paymentHelp: 'Pay securely with Stripe. Your payment is protected.',
  },
  steps: {
    step1Address: 'Step 1 of 3 • Address',
    step2Payment: 'Step 2 of 3 • Payment',
    step3Confirm: 'Step 3 of 3 • Confirm',
  },
  fields: {
    email: {
      label: 'Email',
      placeholder: 'you@example.com',
      help: 'We’ll send your receipt and delivery updates here.',
    },
    name: { label: 'Full Name', placeholder: 'John Doe' },
    street1: { label: 'Street Address', placeholder: '123 Main St' },
    street2: { label: 'Apartment, suite, etc.', placeholder: 'Apt 4B' },
    city: { label: 'City', placeholder: 'New York' },
    state: { label: 'State', placeholder: 'NY' },
    zip: {
      label: 'ZIP Code',
      help: 'Use your 5-digit ZIP (e.g., 10001).',
      placeholder: '10001',
    },
    country: { label: 'Country', placeholder: 'United States' },
    phone: { label: 'Phone', help: '10-digit US number (e.g., 555-555-5555).' },
  },
  cta: {
    validateAndContinue: 'Validate & Continue',
    validatingAddress: 'Validating address...',
    preparingPayment: 'Preparing secure payment...',
  },
  preflight: {
    title: 'We updated your cart',
    description:
      'Some prices or quantities changed since you last viewed your cart.',
    accept: 'Accept updates',
    dismiss: 'Dismiss',
    changeLabels: {
      price: 'Price',
      quantity: 'Quantity',
      old: 'Old',
      new: 'New',
    },
  },
  empty: {
    cartTitle: 'Your cart is empty',
    cartDesc: 'Add some items to your cart to continue shopping.',
    browseProducts: 'Browse products',
  },
  cartSummary: {
    yourOrder: 'Your Order',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shippingFree: 'FREE',
    shippingCalculated: 'Calculated based on seller location',
    total: 'Total',
    platformFee: 'Platform Fee',
    platformFeeZero: '$0.00',
    platformFeeTooltip: "We don't charge platform fees! Sellers receive the full amount. Only payment processor fees apply.",
  },
  shipping: {
    domestic: {
      label: 'Domestic Shipping',
      emoji: '🏠',
      description: 'Fast delivery within the same country',
    },
    regional: {
      label: 'Regional Shipping',
      emoji: '📦',
      description: 'Delivery to nearby countries',
    },
    international: {
      label: 'International Shipping',
      emoji: '✈️',
      description: 'Worldwide delivery',
    },
    freeShipping: {
      qualified: '✓ Free Shipping',
      almostThere: 'Add {amount} more for free shipping!',
      threshold: 'Free shipping on orders over {amount}',
    },
    multiSeller: {
      discount: 'Multi-seller discount applied',
      separate: 'Items will ship separately from each seller',
      tooltip: 'Each seller ships from their location. You saved {amount} on additional shipping!',
    },
  },
  errors: {
    addressInvalid: 'Invalid shipping address. Please check and try again.',
    paymentPrepFailed: 'Failed to prepare payment. Please try again.',
  },
};
