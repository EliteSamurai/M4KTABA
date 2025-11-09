/**
 * Enhanced Checkout Tests
 * Tests for payment method selection, progress tracking, and fee transparency
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { CheckoutProgress } from '@/components/CheckoutProgress';
import { CartSummary } from '@/app/checkout/cart-summary';

describe('Enhanced Checkout Components', () => {
  describe('PaymentMethodSelector', () => {
    it('renders both Stripe and PayPal options', () => {
      const mockOnChange = jest.fn();

      render(
        <PaymentMethodSelector
          value="stripe"
          onChange={mockOnChange}
          paypalEnabled={true}
        />
      );

      expect(
        screen.getByText('Credit / Debit Card')
      ).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
    });

    it('calls onChange when payment method is selected', () => {
      const mockOnChange = jest.fn();

      render(
        <PaymentMethodSelector
          value="stripe"
          onChange={mockOnChange}
          paypalEnabled={true}
        />
      );

      const paypalOption = screen.getByLabelText('PayPal');
      fireEvent.click(paypalOption);

      expect(mockOnChange).toHaveBeenCalledWith('paypal');
    });

    it('hides PayPal when disabled', () => {
      const mockOnChange = jest.fn();

      render(
        <PaymentMethodSelector
          value="stripe"
          onChange={mockOnChange}
          paypalEnabled={false}
        />
      );

      expect(
        screen.getByText('Credit / Debit Card')
      ).toBeInTheDocument();
      expect(screen.queryByText('PayPal')).not.toBeInTheDocument();
    });
  });

  describe('CheckoutProgress', () => {
    it('renders all checkout steps', () => {
      render(<CheckoutProgress currentStep="shipping" />);

      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('highlights current step', () => {
      render(<CheckoutProgress currentStep="payment" />);

      const paymentStep = screen.getByText('Payment');
      expect(paymentStep).toHaveClass('text-primary');
    });

    it('shows completed steps', () => {
      render(<CheckoutProgress currentStep="review" />);

      // Cart, Shipping, and Payment should be marked as completed
      const completedLabels = screen.getAllByText('(Completed)');
      expect(completedLabels.length).toBe(3);
    });
  });

  describe('CartSummary - No Platform Fee', () => {
    const mockCart = [
      {
        id: '1',
        title: 'Test Book 1',
        price: 29.99,
        quantity: 2,
        user: { _id: 'seller1' },
      },
      {
        id: '2',
        title: 'Test Book 2',
        price: 19.99,
        quantity: 1,
        user: { _id: 'seller2' },
      },
    ];

    it('displays zero platform fee', () => {
      render(<CartSummary cart={mockCart} shippingCost={10} currency="USD" />);

      expect(screen.getByText('Platform Fee')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('shows "No Platform Fees" badge', () => {
      render(<CartSummary cart={mockCart} shippingCost={10} currency="USD" />);

      expect(screen.getByText('No Platform Fees')).toBeInTheDocument();
    });

    it('displays fee transparency notice', () => {
      render(<CartSummary cart={mockCart} shippingCost={10} currency="USD" />);

      expect(
        screen.getByText(/100% goes to sellers/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/no-fee marketplace/i)
      ).toBeInTheDocument();
    });

    it('calculates correct total without platform fee', () => {
      render(<CartSummary cart={mockCart} shippingCost={10} currency="USD" />);

      // Subtotal: (29.99 * 2) + (19.99 * 1) = 79.97
      // Shipping: 10.00
      // Platform Fee: 0.00
      // Total: 89.97

      expect(screen.getByText('$79.97')).toBeInTheDocument(); // subtotal
      expect(screen.getByText('$89.97')).toBeInTheDocument(); // total
    });

    it('formats currency correctly', () => {
      render(<CartSummary cart={mockCart} shippingCost={10} currency="EUR" />);

      // Should use EUR formatting
      const prices = screen.getAllByText(/€/);
      expect(prices.length).toBeGreaterThan(0);
    });
  });

  describe('Fee Transparency', () => {
    it('shows processor fee information', () => {
      const mockCart = [
        {
          id: '1',
          title: 'Test Book',
          price: 50.0,
          quantity: 1,
          user: { _id: 'seller1' },
        },
      ];

      render(<CartSummary cart={mockCart} shippingCost={0} currency="USD" />);

      // Should mention payment processor fees
      expect(
        screen.getByText(/payment processing fees/i)
      ).toBeInTheDocument();
    });
  });
});

