import { describe, it, expect } from 'vitest';
import { 
  ifscSchema, 
  requiredPhoneSchema, 
  productSchema,
  gstSchema
} from './validations';

describe('IFSC Code Validation', () => {
  it('should accept valid IFSC codes', () => {
    expect(ifscSchema.safeParse('SBIN0001234').success).toBe(true);
    expect(ifscSchema.safeParse('ICIC0123456').success).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(ifscSchema.safeParse('ABCD123').success).toBe(false); // too short
    expect(ifscSchema.safeParse('SBIN1001234').success).toBe(false); // 5th character not zero
  });

  it('should auto-convert lowercase to uppercase internally', () => {
    const result = ifscSchema.safeParse('sbin0001234');
    expect(result.success).toBe(true);
    expect(result.data).toBe('SBIN0001234');
  });
});

describe('Mobile Phone Validation', () => {
  it('should accept valid 10-digit Indian numbers', () => {
    expect(requiredPhoneSchema.safeParse('9876543210').success).toBe(true);
    expect(requiredPhoneSchema.safeParse('6123456789').success).toBe(true);
  });

  it('should reject short or malformed numbers', () => {
    expect(requiredPhoneSchema.safeParse('12345').success).toBe(false);
    expect(requiredPhoneSchema.safeParse('5876543210').success).toBe(false); // doesn't start with 6-9
  });
});

describe('GSTIN Format Validation', () => {
  it('should accept standard 15-digit GST pattern', () => {
    // Sample standard format: 22AAAAA0000A1Z5
    expect(gstSchema.safeParse('22AAAAA0000A1Z5').success).toBe(true);
  });

  it('should accept empty strings as optional', () => {
    expect(gstSchema.safeParse('').success).toBe(true);
  });

  it('should fail invalid pattern sequences', () => {
    expect(gstSchema.safeParse('INVALID').success).toBe(false);
  });
});

describe('Product Schema Coercion', () => {
  it('should successfully coerce string inputs to valid numbers', () => {
    const rawProduct = {
      name: 'Test Gadget',
      sku: 'SKU001',
      categoryId: 'cat1',
      unit: 'pcs',
      salePrice: '499.99',
      purchasePrice: '250',
      currentStock: '50',
      reorderLevel: '10'
    };

    const result = productSchema.safeParse(rawProduct);
    expect(result.success).toBe(true);
    expect(result.data.salePrice).toBe(499.99);
    expect(result.data.currentStock).toBe(50);
  });

  it('should fail on negative financial numbers', () => {
    const rawProduct = {
      name: 'Test Gadget',
      sku: 'SKU001',
      categoryId: 'cat1',
      unit: 'pcs',
      salePrice: '-10',
      purchasePrice: '250',
      currentStock: '50',
      reorderLevel: '10'
    };
    expect(productSchema.safeParse(rawProduct).success).toBe(false);
  });
});
