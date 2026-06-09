import { z } from 'zod';

// Zod v4 changed .email() to use a stricter regex AND changed .or() resolution —
// valid emails like foo@gmail.com were incorrectly rejected. Use .refine() instead.
const emailOrEmpty = z
  .string()
  .refine(
    (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Invalid email address' }
  )
  .default('');

const emailRequired = z
  .string()
  .min(1, 'Email is required')
  .refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Invalid email address' }
  );

export const LeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required').max(200),
  company: z.string().max(200).default(''),
  phone: z.string().max(20).default(''),
  email: emailRequired,
  source: z.string().default('Manual'),
  status: z.enum(['Hot', 'Warm', 'Cold', 'Converted', 'Lost', 'Rejected']).default('Warm'),
  stage: z.string().default('new'),
  budget: z.string().default(''), // manual free text entry
  requirement: z.string().default(''),
  deal_value: z.number().min(0).default(0),
  won_amount: z.number().min(0).default(0),
  notes: z.string().max(5000).default(''),
  assigned_to: z.number().nullable().default(null),
  lost_reason: z.string().max(500).default(''),
  lead_score: z.number().default(0),
  next_followup: z.string().nullable().default(null),
}).superRefine((data, ctx) => {
  if ((data.status === 'Lost' || data.status === 'Rejected') && !data.lost_reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reason for rejection is required',
      path: ['lost_reason'],
    });
  }
});

export const TaskSchema = z.object({
  description: z.string().min(1, 'Description is required').max(1000),
  lead_id: z.number().nullable().default(null),
  assigned_to: z.number().nullable().default(null),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  type: z.enum(['task', 'followup', 'call']).default('task'),
});

export const TeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailRequired,
  phone: z.string().max(20).default(''),
  role: z.string().default('Sales rep'),
  status: z.enum(['Active', 'Away', 'Offline']).default('Active'),
  avatar_url: z.string().default(''),
});

export const SettingsSchema = z.object({
  company_name: z.string().max(200).default(''),
  owner_name: z.string().max(100).default(''),
  owner_role: z.string().max(100).default(''),
  industry: z.string().max(100).default(''),
  whatsapp: z.string().max(20).default(''),
  email: emailOrEmpty,
  logo_url: z.string().default(''),
  auto_assign: z.string().default(''),
  wa_template: z.string().max(2000).default('Hi {{name}}, Thank you for your interest in {{company}}. We received your inquiry regarding {{requirement}}...'),
  requirement_options: z.array(z.string()).default([]),
  budget_options: z.array(z.string()).default([]),
  lead_sources: z.array(z.string()).default([]),
});

export const QuotationItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

export const QuotationSchema = z.object({
  lead_id: z.number().nullable().default(null),
  quotation_no: z.string().min(1, 'Quotation number is required'),
  items: z.array(QuotationItemSchema).min(1, 'Add at least one item'),
  subtotal: z.number().min(0).default(0),
  gst_percent: z.number().default(18),
  gst_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().max(2000).default(''),
  valid_until: z.string().default(''),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']).default('Draft'),
});
