import express from 'express';
import { dataService } from '../services/dataService.js';

const router = express.Router();

// List customers with search
router.get('/', async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const customers = await dataService.getCustomers(search, Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// Create customer
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, company, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone are required' });
    }
    const customer = await dataService.createCustomer({
      name,
      phone,
      email,
      company,
      notes,
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// Get single customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await dataService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

// Update customer
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await dataService.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Archive customer
router.delete('/:id', async (req, res, next) => {
  try {
    const archived = await dataService.archiveCustomer(req.params.id);
    if (!archived) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer archived successfully' });
  } catch (err) {
    next(err);
  }
});

// Get call history for customer
router.get('/:id/call-logs', async (req, res, next) => {
  try {
    const logs = await dataService.getCustomerCallLogs(req.params.id);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
