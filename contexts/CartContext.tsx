"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { CartItem } from "@/types/shipping-types";
import { getSession, signOut } from "next-auth/react";

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (id: string) => boolean;
  handleLogout: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchCart = async () => {
      const session = await getSession();
      
      if (session?.user?.cart) {
        setCart(session.user.cart);
      }
    };

    fetchCart();
  }, []);

  const syncCartWithBackend = async (updatedCart: CartItem[]) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: updatedCart }),
      });

      if (!response.ok) {
        console.error("Error syncing cart:", await response.text()); // Debugging: check response
      } else {
        console.log(updatedCart);
        
        console.log("Cart synced successfully");
      }
    } catch (error) {
      console.error("Failed to sync cart with backend", error);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      const updatedCart = existingItem
        ? prevCart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          )
        : [...prevCart, item];
      syncCartWithBackend(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== id);
      syncCartWithBackend(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    syncCartWithBackend([]);
  };

  const handleLogout = async () => {
    setCart([]);
    await signOut();
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.length; // Counts only unique items
  };

  const isInCart = (id: string) => {
    return cart.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
        handleLogout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
