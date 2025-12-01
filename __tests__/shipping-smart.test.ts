import {
  getShippingTier,
  calculateShipping,
  calculateMultiSellerShipping,
  qualifiesForFreeShipping,
  isSameRegion,
  isGCC,
  getRegion,
  FREE_SHIPPING_THRESHOLDS,
} from '../lib/shipping-smart';

describe('Shipping Calculator', () => {
  describe('getRegion', () => {
    it('should identify GCC countries', () => {
      expect(getRegion('AE')).toBe('middleEast');
      expect(getRegion('SA')).toBe('middleEast');
      expect(getRegion('QA')).toBe('middleEast');
    });

    it('should identify North American countries', () => {
      expect(getRegion('US')).toBe('northAmerica');
      expect(getRegion('CA')).toBe('northAmerica');
      expect(getRegion('MX')).toBe('northAmerica');
    });

    it('should identify European countries', () => {
      expect(getRegion('GB')).toBe('europe');
      expect(getRegion('DE')).toBe('europe');
      expect(getRegion('FR')).toBe('europe');
    });

    it('should return null for unknown countries', () => {
      expect(getRegion('XX')).toBeNull();
    });
  });

  describe('isSameRegion', () => {
    it('should return true for countries in same region', () => {
      expect(isSameRegion('US', 'CA')).toBe(true);
      expect(isSameRegion('GB', 'DE')).toBe(true);
      expect(isSameRegion('AE', 'SA')).toBe(true);
    });

    it('should return false for countries in different regions', () => {
      expect(isSameRegion('US', 'GB')).toBe(false);
      expect(isSameRegion('AE', 'US')).toBe(false);
    });
  });

  describe('isGCC', () => {
    it('should return true for GCC countries', () => {
      expect(isGCC('AE', 'SA')).toBe(true);
      expect(isGCC('QA', 'KW')).toBe(true);
    });

    it('should return false for non-GCC countries', () => {
      expect(isGCC('AE', 'US')).toBe(false);
      expect(isGCC('JO', 'SA')).toBe(false); // Jordan is Middle East but not GCC
    });
  });

  describe('getShippingTier', () => {
    it('should return domestic for same country', () => {
      expect(getShippingTier('US', 'US')).toBe('domestic');
      expect(getShippingTier('AE', 'AE')).toBe('domestic');
    });

    it('should return regional for same region', () => {
      expect(getShippingTier('US', 'CA')).toBe('regional');
      expect(getShippingTier('GB', 'DE')).toBe('regional');
      expect(getShippingTier('AE', 'SA')).toBe('regional');
    });

    it('should return international for different regions', () => {
      expect(getShippingTier('US', 'GB')).toBe('international');
      expect(getShippingTier('AE', 'US')).toBe('international');
      expect(getShippingTier('JP', 'BR')).toBe('international');
    });
  });

  describe('calculateShipping', () => {
    it('should calculate domestic shipping correctly', () => {
      const shipping = calculateShipping('US', 'US', 1);
      expect(shipping.tier).toBe('domestic');
      expect(shipping.buyerPays).toBe(3.99);
      expect(shipping.sellerPays).toBe(0);
      expect(shipping.platformSubsidy).toBe(1.50);
      expect(shipping.actualCost).toBe(5.49);
    });

    it('should calculate regional shipping correctly', () => {
      const shipping = calculateShipping('US', 'CA', 1);
      expect(shipping.tier).toBe('regional');
      expect(shipping.buyerPays).toBe(7.99);
      expect(shipping.sellerPays).toBe(1.00);
      expect(shipping.platformSubsidy).toBe(2.00);
    });

    it('should calculate international shipping correctly', () => {
      const shipping = calculateShipping('US', 'GB', 1);
      expect(shipping.tier).toBe('international');
      expect(shipping.buyerPays).toBe(14.99);
      expect(shipping.sellerPays).toBe(4.00);
      expect(shipping.platformSubsidy).toBe(0);
    });

    it('should apply GCC express rates', () => {
      const shipping = calculateShipping('AE', 'SA', 1);
      expect(shipping.tier).toBe('regional');
      expect(shipping.buyerPays).toBe(4.99);
      expect(shipping.sellerPays).toBe(0);
      expect(shipping.platformSubsidy).toBe(2.50);
      expect(shipping.note).toContain('GCC Express');
    });

    it('should add per-item fees for multiple items', () => {
      const shipping = calculateShipping('US', 'US', 3);
      // Base $3.99 + 2 additional items × $1.50 = $6.99
      expect(shipping.buyerPays).toBe(6.99);
    });
  });

  describe('qualifiesForFreeShipping', () => {
    it('should qualify for domestic free shipping at threshold', () => {
      expect(qualifiesForFreeShipping(35.00, 'domestic')).toBe(true);
      expect(qualifiesForFreeShipping(40.00, 'domestic')).toBe(true);
    });

    it('should not qualify below threshold', () => {
      expect(qualifiesForFreeShipping(34.99, 'domestic')).toBe(false);
    });

    it('should use correct thresholds per tier', () => {
      expect(FREE_SHIPPING_THRESHOLDS.domestic).toBe(35.00);
      expect(FREE_SHIPPING_THRESHOLDS.regional).toBe(50.00);
      expect(FREE_SHIPPING_THRESHOLDS.international).toBe(75.00);
    });
  });

  describe('calculateMultiSellerShipping', () => {
    it('should calculate shipping for single seller', () => {
      const sellers = [
        {
          sellerId: 'seller1',
          sellerCountry: 'US',
          itemCount: 2,
          subtotal: 20.00, // Below free shipping threshold of $35
        },
      ];

      const result = calculateMultiSellerShipping(sellers, 'US');
      
      expect(result.sellers).toHaveLength(1);
      expect(result.sellers[0].shipping.tier).toBe('domestic');
      expect(result.totalBuyerPays).toBe(5.49); // $3.99 base + 1 additional item × $1.50
    });

    it('should apply 25% discount to additional sellers', () => {
      const sellers = [
        {
          sellerId: 'seller1',
          sellerCountry: 'US',
          itemCount: 1,
          subtotal: 20.00,
        },
        {
          sellerId: 'seller2',
          sellerCountry: 'CA',
          itemCount: 1,
          subtotal: 25.00,
        },
      ];

      const result = calculateMultiSellerShipping(sellers, 'US');
      
      expect(result.sellers).toHaveLength(2);
      
      // First seller: full price
      expect(result.sellers[0].shipping.buyerPays).toBe(3.99);
      
      // Second seller: 25% discount
      // Regional US->CA = $7.99, with 25% discount = $5.99
      expect(result.sellers[1].shipping.buyerPays).toBeCloseTo(5.99, 2);
      
      // Discount should be tracked
      expect(result.multiSellerDiscount).toBeGreaterThan(0);
    });

    it('should apply free shipping when threshold met', () => {
      const sellers = [
        {
          sellerId: 'seller1',
          sellerCountry: 'US',
          itemCount: 2,
          subtotal: 50.00, // Above $35 threshold
        },
      ];

      const result = calculateMultiSellerShipping(sellers, 'US');
      
      expect(result.sellers[0].qualifiesForFree).toBe(true);
      expect(result.sellers[0].shipping.buyerPays).toBe(0);
      expect(result.totalBuyerPays).toBe(0);
    });

    it('should calculate complex multi-seller scenarios', () => {
      const sellers = [
        {
          sellerId: 'seller1',
          sellerCountry: 'US',
          itemCount: 2,
          subtotal: 40.00, // Qualifies for free domestic shipping
        },
        {
          sellerId: 'seller2',
          sellerCountry: 'GB',
          itemCount: 1,
          subtotal: 25.00, // Does not qualify, international
        },
        {
          sellerId: 'seller3',
          sellerCountry: 'CA',
          itemCount: 1,
          subtotal: 15.00, // Does not qualify, regional
        },
      ];

      const result = calculateMultiSellerShipping(sellers, 'US');
      
      expect(result.sellers).toHaveLength(3);
      
      // Seller 1: Free (domestic, over threshold)
      expect(result.sellers[0].qualifiesForFree).toBe(true);
      expect(result.sellers[0].shipping.buyerPays).toBe(0);
      
      // Seller 2: International, with multi-seller discount
      expect(result.sellers[1].shipping.tier).toBe('international');
      expect(result.sellers[1].shipping.buyerPays).toBeCloseTo(14.99 * 0.75, 2);
      
      // Seller 3: Regional, with multi-seller discount
      expect(result.sellers[2].shipping.tier).toBe('regional');
      expect(result.sellers[2].shipping.buyerPays).toBeCloseTo(7.99 * 0.75, 2);
      
      // Total should be sum of all shipping costs
      const expectedTotal = 0 + (14.99 * 0.75) + (7.99 * 0.75);
      expect(result.totalBuyerPays).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive country codes', () => {
      expect(getShippingTier('us', 'US')).toBe('domestic');
      expect(getShippingTier('Us', 'uS')).toBe('domestic');
    });

    it('should handle zero items gracefully', () => {
      const shipping = calculateShipping('US', 'US', 0);
      expect(shipping.buyerPays).toBe(3.99); // Base rate
    });

    it('should handle unknown countries as international', () => {
      const shipping = calculateShipping('XX', 'YY', 1);
      expect(shipping.tier).toBe('international'); // Unknown countries default to international
    });
  });
});

