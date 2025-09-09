export type ShippingData = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  zip: string;
  state: string;
  country: string;
};

export async function validateAddressClient(
  shippingData: ShippingData,
  signal?: AbortSignal
): Promise<{ isValid: boolean }> {
  const base =
    typeof window !== "undefined" && (window as any).location?.origin
      ? (window as any).location.origin
      : "http://localhost";
  const response = await fetch(`${base}/api/validate-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shippingData),
    signal,
  });
  const result = await response.json();
  return { isValid: Boolean(result?.isValid) };
}
