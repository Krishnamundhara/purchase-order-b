import { z } from 'zod';

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().date(),
  order_number: z.string().min(1, 'Order number is required'),
  party_name: z.string().min(1, 'Party name is required'),
  broker: z.string().optional(),
  mill: z.string().optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  bags: z.number().int().positive('Bags must be a positive integer').optional(),
  product: z.string().optional(),
  rate: z.number().positive('Rate must be positive').optional(),
  terms_and_conditions: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const CreatePurchaseOrderSchema = PurchaseOrderSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreatePurchaseOrder = z.infer<typeof CreatePurchaseOrderSchema>;
