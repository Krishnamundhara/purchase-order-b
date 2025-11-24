import { Router, Request, Response } from 'express';
import { pool } from '../db/connection.js';
import { CreatePurchaseOrderSchema, PurchaseOrderSchema } from '../types/index.js';

const router = Router();

// GET /api/purchase-orders - List all purchase orders with search and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q = '', page = '1', limit = '10' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT * FROM purchase_orders
      WHERE order_number ILIKE $1 OR party_name ILIKE $1
      ORDER BY date DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM purchase_orders
      WHERE order_number ILIKE $1 OR party_name ILIKE $1
    `;

    const searchTerm = `%${q}%`;

    const result = await pool.query(query, [searchTerm, limit, offset]);
    const countResult = await pool.query(countQuery, [searchTerm]);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase orders' });
  }
});

// GET /api/purchase-orders/:id - Get single purchase order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching purchase order:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase order' });
  }
});

// POST /api/purchase-orders - Create new purchase order
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = CreatePurchaseOrderSchema.parse(req.body);

    const insertQuery = `
      INSERT INTO purchase_orders
      (date, order_number, party_name, broker, mill, weight, bags, product, rate, terms_and_conditions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      validated.date,
      validated.order_number,
      validated.party_name,
      validated.broker || null,
      validated.mill || null,
      validated.weight || null,
      validated.bags || null,
      validated.product || null,
      validated.rate || null,
      validated.terms_and_conditions || null,
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error('Error creating purchase order:', err);

    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Order number already exists',
      });
    }

    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create purchase order',
    });
  }
});

// PUT /api/purchase-orders/:id - Update purchase order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validated = CreatePurchaseOrderSchema.parse(req.body);

    const updateQuery = `
      UPDATE purchase_orders
      SET
        date = $1,
        order_number = $2,
        party_name = $3,
        broker = $4,
        mill = $5,
        weight = $6,
        bags = $7,
        product = $8,
        rate = $9,
        terms_and_conditions = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      validated.date,
      validated.order_number,
      validated.party_name,
      validated.broker || null,
      validated.mill || null,
      validated.weight || null,
      validated.bags || null,
      validated.product || null,
      validated.rate || null,
      validated.terms_and_conditions || null,
      id,
    ];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    console.error('Error updating purchase order:', err);

    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Order number already exists',
      });
    }

    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update purchase order',
    });
  }
});

// DELETE /api/purchase-orders/:id - Delete purchase order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }

    res.json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (err) {
    console.error('Error deleting purchase order:', err);
    res.status(500).json({ success: false, error: 'Failed to delete purchase order' });
  }
});

// POST /api/purchase-orders/:id/pdf - Download PDF with company data
// REMOVED: PDF generation is now handled on the frontend
// Users download PDF directly from the preview using html2pdf.js

// GET /api/purchase-orders/:id/pdf - Download PDF (legacy, without company data)
// REMOVED: PDF generation is now handled on the frontend
// Users download PDF directly from the preview using html2pdf.js

export default router;
