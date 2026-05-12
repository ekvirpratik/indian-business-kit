import { z } from 'zod';

// Common Patterns
const phoneRegex = /^[6-9]\d{9}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// GSTIN Pattern: 2 digits, 5 chars, 4 digits, 1 char, 1 alpha-num, 'Z', 1 alpha-num
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const phoneSchema = z.string()
  .refine(val => val === '' || phoneRegex.test(val), {
    message: "Please enter a valid 10-digit Indian mobile number (starts with 6-9)"
  });

export const requiredPhoneSchema = z.string()
  .regex(phoneRegex, "Invalid mobile number. Must be 10 digits starting with 6-9.");

export const emailSchema = z.string()
  .refine(val => val === '' || z.string().email().safeParse(val).success, {
    message: "Please enter a valid email address"
  });

export const ifscSchema = z.string()
  .toUpperCase()
  .regex(ifscRegex, "Invalid IFSC Format (e.g. SBIN0001234). Must be 11 alphanumeric characters with 5th character as '0'.");

export const gstSchema = z.string()
  .toUpperCase()
  .refine(val => val === '' || gstRegex.test(val), {
    message: "Invalid GSTIN Format."
  });

export const businessInfoSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  proprietor: z.string().min(2, "Proprietor name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(phoneRegex, "Phone must be 10 digits starting with 6-9"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  gst: z.string().toUpperCase().refine(val => val === '' || gstRegex.test(val), "Invalid GSTIN Format").optional(),
  openingCashBalance: z.coerce.number().min(0, "Cannot be negative").default(0),
  openingBankBalance: z.coerce.number().min(0, "Cannot be negative").default(0),
  termsAndConditions: z.string().optional(),
  whatsappTemplate: z.string().optional(),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(9, "Must be at least 9 digits").max(18, "Max 18 digits").regex(/^\d+$/, "Must contain only numbers"),
  ifscCode: z.string().toUpperCase().regex(ifscRegex, "Invalid IFSC (e.g., ABCD0123456). 5th char must be zero."),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  phone: z.string().refine(val => val === '' || phoneRegex.test(val), "Invalid 10-digit phone number"),
  email: z.string().refine(val => val === '' || z.string().email().safeParse(val).success, "Invalid email address"),
  address: z.string().optional(),
  category: z.string().min(1, "Category selection required"),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().refine(val => val === '' || phoneRegex.test(val), "Invalid 10-digit phone number"),
  email: z.string().refine(val => val === '' || z.string().email().safeParse(val).success, "Invalid email address"),
  address: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(1, "SKU code is required"),
  categoryId: z.string().min(1, "Category selection is required"),
  unit: z.string().min(1, "Unit is required"),
  salePrice: z.coerce.number().min(0, "Cannot be negative"),
  purchasePrice: z.coerce.number().min(0, "Cannot be negative"),
  currentStock: z.coerce.number().min(0, "Cannot be negative"),
  reorderLevel: z.coerce.number().min(0, "Cannot be negative"),
});
export const setupWizardSchema = z.object({
  businessName: z.string().min(2, "Business name required"),
  ownerName: z.string().min(2, "Owner name required"),
  phone: z.string().regex(phoneRegex, "10-digit mobile number required"),
  address: z.string().optional(),
  openingCashBalance: z.coerce.number().min(0).default(0),
  openingBankBalance: z.coerce.number().min(0).default(0),
});

export const expenseSchema = z.object({
  title: z.string().min(2, "Expense title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional()
});
