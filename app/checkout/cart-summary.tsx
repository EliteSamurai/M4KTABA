import { CartItem } from "@/types/shipping-types";

interface CartSummaryProps {
  cart: CartItem[];
}

export function CartSummary({ cart }: CartSummaryProps) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  return (
    <div className="bg-white p-6 rounded-lg shadow relative">
      <h2 className="text-2xl font-bold mb-6">Your Order</h2>
      <div className="space-y-4">
        {cart.map((item, index) => (
          <div key={index} className="flex gap-4">
            {/* Image Section */}
            {/* <div className="w-24 h-24 relative hidden sm:block">
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.title}
            className="object-cover rounded"
            width={96}
            height={96}
          />
        </div> */}
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
              <p className="font-medium">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Totals Section */}
      <div className="mt-6 pb-2 space-y-2 border-t-2">
        <div className="pt-2 flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
