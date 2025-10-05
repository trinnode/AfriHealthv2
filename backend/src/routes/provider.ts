import express, { Request, Response, Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { hederaService, contractService } from '../server';
import { ApiResponse } from '../types/api';

const router: Router = express.Router();

/**
 * Get provider dashboard statistics
 * GET /api/provider/stats/:providerAddress
 */
router.get('/stats/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;

    // Validate address format
    if (!providerAddress.match(/^0\.0\.\d+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider address format'
      } as ApiResponse<null>);
    }

    // Get provider statistics from smart contracts
    // This would integrate with multiple facets to get comprehensive stats
    
    const stats = {
      totalPatients: 25,
      activeConsents: 18,
      pendingInvoices: 5,
      totalClaims: 12,
      totalRevenue: 500000, // $5000.00 in cents
      claimApprovalRate: 85,
      averageProcessingTime: 24 // hours
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<typeof stats>);

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider statistics'
    } as ApiResponse<null>);
  }
});

/**
 * Get provider patients
 * GET /api/provider/patients/:providerAddress
 */
router.get('/patients/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;

    // Mock patient data (in production, this would come from contract queries)
    const patients = [
      {
        id: '0.0.12345',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1234567890',
        isVerified: true,
        joinedAt: new Date('2024-01-15'),
        lastActive: new Date('2024-12-01')
      },
      {
        id: '0.0.12346',
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        isVerified: true,
        joinedAt: new Date('2024-02-20'),
        lastActive: new Date('2024-11-28')
      }
    ];

    res.json({
      success: true,
      data: patients
    } as ApiResponse<typeof patients>);

  } catch (error) {
    console.error('Error fetching provider patients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider patients'
    } as ApiResponse<null>);
  }
});

/**
 * Get provider consent requests
 * GET /api/provider/consent-requests/:providerAddress
 */
router.get('/consent-requests/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;

    // Mock consent requests (in production, this would come from ConsentFacet)
    const requests = [
      {
        requestId: '1',
        patient: '0.0.12345',
        provider: providerAddress,
        scopes: ['labs', 'medications'],
        purposeOfUse: 'Routine checkup and medication review',
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'pending',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: requests
    } as ApiResponse<typeof requests>);

  } catch (error) {
    console.error('Error fetching consent requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consent requests'
    } as ApiResponse<null>);
  }
});

/**
 * Create consent request
 * POST /api/provider/consent-requests
 */
router.post('/consent-requests', [
  body('providerAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid provider address format'),
  body('patientAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid patient address format'),
  body('scopes').isArray().withMessage('Scopes must be an array'),
  body('purposeOfUse').isString().notEmpty().withMessage('Purpose of use is required'),
  body('expiresAt').isNumeric().withMessage('Expiration date must be a timestamp')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { providerAddress, patientAddress, scopes, purposeOfUse, expiresAt } = req.body;

    // Create consent request through ConsentFacet
    const result = await contractService.createConsentRequest(
      patientAddress,
      providerAddress,
      scopes,
      expiresAt,
      purposeOfUse
    );

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId?.toString(),
        message: 'Consent request created successfully'
      }
    } as ApiResponse<{ transactionId: string; message: string }>);

  } catch (error) {
    console.error('Error creating consent request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consent request'
    } as ApiResponse<null>);
  }
});

/**
 * Get provider invoices
 * GET /api/provider/invoices/:providerAddress
 */
router.get('/invoices/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;

    // Mock invoice data (in production, this would come from BillingFacet)
    const invoices = [
      {
        invoiceId: '1',
        patient: '0.0.12345',
        provider: providerAddress,
        lineItems: [
          {
            itemId: '1',
            description: 'General Consultation',
            code: '99213',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
            category: 'consultation'
          }
        ],
        totalAmount: 15000,
        currency: 'USD',
        status: 'pending_approval',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      data: invoices
    } as ApiResponse<typeof invoices>);

  } catch (error) {
    console.error('Error fetching provider invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider invoices'
    } as ApiResponse<null>);
  }
});

/**
 * Create invoice
 * POST /api/provider/invoices
 */
router.post('/invoices', [
  body('providerAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid provider address format'),
  body('patientAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid patient address format'),
  body('lineItems').isArray().withMessage('Line items must be an array'),
  body('currency').isString().notEmpty().withMessage('Currency is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { providerAddress, patientAddress, lineItems, currency, expiresAt, notes } = req.body;

    // Create invoice through BillingFacet
    const result = await contractService.createInvoice(
      patientAddress,
      providerAddress,
      lineItems,
      currency,
      expiresAt
    );

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId?.toString(),
        message: 'Invoice created successfully'
      }
    } as ApiResponse<{ transactionId: string; message: string }>);

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    } as ApiResponse<null>);
  }
});

/**
 * Get provider claims
 * GET /api/provider/claims/:providerAddress
 */
router.get('/claims/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;

    // Mock claims data (in production, this would come from InsurancePoolFacet)
    const claims = [
      {
        claimId: '1',
        patient: '0.0.12345',
        provider: providerAddress,
        amountRequested: 15000,
        amountApproved: 13500,
        diagnosis: 'Hypertension Management',
        procedureCodes: ['99213', '85025'],
        status: 'approved',
        submittedAt: new Date(),
        processedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: claims
    } as ApiResponse<typeof claims>);

  } catch (error) {
    console.error('Error fetching provider claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider claims'
    } as ApiResponse<null>);
  }
});

/**
 * Submit insurance claim
 * POST /api/provider/claims
 */
router.post('/claims', [
  body('providerAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid provider address format'),
  body('patientAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid patient address format'),
  body('amountRequested').isNumeric().withMessage('Amount must be numeric'),
  body('diagnosis').isString().notEmpty().withMessage('Diagnosis is required'),
  body('procedureCodes').isArray().withMessage('Procedure codes must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      } as ApiResponse<null>);
    }

    const { providerAddress, patientAddress, amountRequested, diagnosis, procedureCodes } = req.body;

    // Submit claim through InsurancePoolFacet
    const result = await contractService.submitInsuranceClaim(
      patientAddress,
      amountRequested,
      diagnosis,
      procedureCodes
    );

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId?.toString(),
        message: 'Insurance claim submitted successfully'
      }
    } as ApiResponse<{ transactionId: string; message: string }>);

  } catch (error) {
    console.error('Error submitting insurance claim:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit insurance claim'
    } as ApiResponse<null>);
  }
});

/**
 * Get provider analytics
 * GET /api/provider/analytics/:providerAddress
 */
router.get('/analytics/:providerAddress', async (req: Request, res: Response) => {
  try {
    const { providerAddress } = req.params;
    const { range = '90d' } = req.query;

    // Mock analytics data (in production, this would be calculated from contract data)
    const analytics = {
      totalPatients: 25,
      totalInvoices: 45,
      totalRevenue: 500000,
      averageClaimAmount: 12500,
      claimApprovalRate: 85,
      monthlyTrends: [
        { month: 'Oct 2024', patients: 20, revenue: 40000, claims: 8 },
        { month: 'Nov 2024', patients: 22, revenue: 45000, claims: 10 },
        { month: 'Dec 2024', patients: 25, revenue: 50000, claims: 12 }
      ],
      topProcedures: [
        { code: '99213', description: 'Office Visit', count: 15, revenue: 22500 },
        { code: '85025', description: 'CBC', count: 8, revenue: 8000 },
        { code: '99214', description: 'Extended Visit', count: 6, revenue: 10800 }
      ],
      patientSatisfaction: 92,
      averageProcessingTime: 24
    };

    res.json({
      success: true,
      data: analytics
    } as ApiResponse<typeof analytics>);

  } catch (error) {
    console.error('Error fetching provider analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider analytics'
    } as ApiResponse<null>);
  }
});

export default router;
