# Conversion KPI Checks

This release standardizes key funnel events:

- `view_product`
- `add_to_cart`
- `begin_checkout`
- `login_success`
- `purchase_success`

## KPI Targets

- Product view to add-to-cart rate:
  - `add_to_cart / view_product`
- Add-to-cart to checkout start rate:
  - `begin_checkout / add_to_cart`
- Checkout completion rate:
  - `purchase_success / begin_checkout`
- Login recovery rate at intent pages:
  - `login_success` where `callbackUrl` is checkout/product page

## Post-Release Monitoring Window

- Check after 24 hours (sanity check)
- Check after 7 days (stable signal)
- Compare with previous 7-day baseline

## Release Validation Checklist

- Confirm event volume is non-zero for all five events.
- Verify `callbackUrl` appears in `login_success` event payload.
- Verify `purchase_success` payload includes `paymentIntentId`, `orderId`, `itemCount`, and `value`.
- Confirm no spike in checkout errors while conversion rates move.
