import { Router, Request, Response } from 'express';
import { pool } from '../db/connection.js';

const router = Router();

// GET /api/company - Get company profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM company_profile WHERE id = 1');
    
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const profile = result.rows[0];
    res.json({ 
      success: true, 
      data: {
        companyName: profile.company_name,
        companyLogo: profile.company_logo,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        gstNumber: profile.gst_number,
        bankName: profile.bank_name,
        bankAccountNumber: profile.bank_account_number,
        ifscCode: profile.ifsc_code,
        branchName: profile.branch_name,
      }
    });
  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch company profile' });
  }
});

// POST /api/company - Create or update company profile
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyLogo,
      address,
      phone,
      email,
      gstNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      branchName,
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    // Check if profile exists
    const checkResult = await pool.query('SELECT id FROM company_profile WHERE id = 1');

    let result;
    if (checkResult.rows.length === 0) {
      // Insert new profile
      result = await pool.query(
        `INSERT INTO company_profile 
        (id, company_name, company_logo, address, phone, email, gst_number, 
         bank_name, bank_account_number, ifsc_code, branch_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
        RETURNING *`,
        [
          1,
          companyName,
          companyLogo || null,
          address || null,
          phone || null,
          email || null,
          gstNumber || null,
          bankName || null,
          bankAccountNumber || null,
          ifscCode || null,
          branchName || null,
        ]
      );
    } else {
      // Update existing profile
      result = await pool.query(
        `UPDATE company_profile 
        SET company_name = $1, company_logo = $2, address = $3, phone = $4, 
            email = $5, gst_number = $6, bank_name = $7, bank_account_number = $8, 
            ifsc_code = $9, branch_name = $10, updated_at = now()
        WHERE id = 1
        RETURNING *`,
        [
          companyName,
          companyLogo || null,
          address || null,
          phone || null,
          email || null,
          gstNumber || null,
          bankName || null,
          bankAccountNumber || null,
          ifscCode || null,
          branchName || null,
        ]
      );
    }

    const profile = result.rows[0];
    res.json({
      success: true,
      message: 'Company profile saved successfully',
      data: {
        companyName: profile.company_name,
        companyLogo: profile.company_logo,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        gstNumber: profile.gst_number,
        bankName: profile.bank_name,
        bankAccountNumber: profile.bank_account_number,
        ifscCode: profile.ifsc_code,
        branchName: profile.branch_name,
      }
    });
  } catch (err) {
    console.error('Error saving company profile:', err);
    res.status(500).json({ success: false, error: 'Failed to save company profile' });
  }
});

export default router;
