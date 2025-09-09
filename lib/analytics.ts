type AnalyticsEvent =
  | "checkout_view"
  | "address_validated"
  | "intent_created"
  | "payment_success"
  | "payment_failure";

const isProd =
  typeof process !== "undefined" && process.env.NODE_ENV === "production";

export function track(event: AnalyticsEvent, props?: Record<string, any>) {
  // No-ops in test and development
  if (!isProd) {
    if (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development")
    ) {
      if ((process as any).env?.ANALYTICS_DEBUG === "1") {
        // eslint-disable-next-line no-console
        console.debug("[analytics]", event, props || {});
      }
    }
    return;
  }
  try {
    // Place production analytics SDK calls here (e.g., Segment/GA)
    (window as any)?.__analytics?.track?.(event, props || {});
  } catch (_e) {
    // swallow
  }
}


