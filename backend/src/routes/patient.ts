import express, { Request, Response, Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { hederaService, contractService } from '../server';
import { ApiResponse } from '../types/api';

const router: Router = express.Router();

/**
 * Get patient dashboard statistics
 * GET /api/patient/stats/:patientAddress
 */
router.get('/stats/:patientAddress', async (req: Request, res: Response) => {
  try {
    const { patientAddress } = req.params;

    // Validate address format
    if (!patientAddress.match(/^0\.0\.\d+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient address format'
      } as ApiResponse<null>);
    }

    // Get patient consents count
    const consentsResult = await contractService.getPatientConsents(patientAddress);
    
    // Get patient invoices count
    const invoicesResult = await contractService.getPatientInvoices(patientAddress);

    // Mock additional stats (in production, these would come from contract queries)
    const stats = {
      totalConsents: 5,
      activeConsents: 3,
      pendingInvoices: 2,
      approvedInvoices: 1,
      totalClaims: 1,
      pendingClaims: 0,
      insuranceCoverage: 10000,
      monthlySpending: 2500
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<typeof stats>);

  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient statistics'
    } as ApiResponse<null>);
  }
});

/**
 * Get patient token balances
 * GET /api/patient/balances/:patientAddress
 */
router.get('/balances/:patientAddress', async (req: Request, res: Response) => {
  try {
    const { patientAddress } = req.params;

    // Validate address format
    if (!patientAddress.match(/^0\.0\.\d+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient address format'
      } as ApiResponse<null>);
    }

    // Query token balances from smart contracts
    // This would integrate with TokenFacet to get actual balances
    
    const balances = {
      platformCredit: 1250, // AHL tokens
      insurancePool: 500,   // Pool shares
      hbar: 15000,          // HBAR in tinybar
      fiatEquivalent: 12550 // USD equivalent
    };

    res.json({
      success: true,
      data: balances
    } as ApiResponse<typeof balances>);

  } catch (error) {
    console.error('Error fetching patient balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient balances'
    } as ApiResponse<null>);
  }
});

/**
 * Get patient consents
 * GET /api/patient/consents/:patientAddress
 */
router.get('/consents/:patientAddress', async (req: Request, res: Response) => {
  try {
    const { patientAddress } = req.params;

    // Get active consents from ConsentFacet
    const consentsResult = await contractService.getPatientConsents(patientAddress);

    // Mock consent data (in production, this would come from contract)
    const consents = [
      {
        requestId: '1',
        patient: patientAddress,
        provider: '0.0.12345',
        scopes: ['labs', 'medications'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        grantedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: consents
    } as ApiResponse<typeof consents>);

  } catch (error) {
    console.error('Error fetching patient consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient consents'
    } as ApiResponse<null>);
  }
});

/**
 * Get patient invoices
 * GET /api/patient/invoices/:patientAddress
 */
router.get('/invoices/:patientAddress', async (req: Request, res: Response) => {
  try {
    const { patientAddress } = req.params;
    const { status } = req.query;

    // Get invoices from BillingFacet
    const invoicesResult = await contractService.getPatientInvoices(patientAddress);

    // Mock invoice data (in production, this would come from contract)
    const invoices = [
      {
        invoiceId: '1',
        patient: patientAddress,
        provider: '0.0.12345',
        lineItems: [
          {
            itemId: '1',
            description: 'General Consultation',
            code: '99213',
            quantity: 1,
            unitPrice: 15000, // $150.00 in cents
            totalPrice: 15000,
            category: 'consultation'
          }
        ],
        totalAmount: 15000,
        currency: 'USD',
        status: status || 'pending_approval',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      data: invoices
    } as ApiResponse<typeof invoices>);

  } catch (error) {
    console.error('Error fetching patient invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient invoices'
    } as ApiResponse<null>);
  }
});

/**
 * Approve invoice
 * POST /api/patient/invoices/:invoiceId/approve
 */
router.post('/invoices/:invoiceId/approve', [
  body('approvedAmount').isNumeric().withMessage('Approved amount must be numeric'),
  body('patientAddress').matches(/^0\.0\.\d+$/).withMessage('Invalid patient address format')
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

    const { invoiceId } = req.params;
    const { approvedAmount, patientAddress } = req.body;

    // Execute approve invoice transaction
    const result = await contractService.approveInvoice(invoiceId, approvedAmount);

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId?.toString(),
        message: 'Invoice approved successfully'
      }
    } as ApiResponse<{ transactionId: string; message: string }>);

  } catch (error) {
    console.error('Error approving invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve invoice'
    } as ApiResponse<null>);
  }
});

/**
 * Get patient insurance claims
 * GET /api/patient/claims/:patientAddress
 */
router.get('/claims/:patientAddress', async (req: Request, res: Response) => {
  try {
    const { patientAddress } = req.params;

    // Mock claims data (in production, this would come from InsurancePoolFacet)
    const claims = [
      {
        claimId: '1',
        patient: patientAddress,
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
    console.error('Error fetching patient claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient claims'
    } as ApiResponse<null>);
  }
});

/**
 * Submit new insurance claim
 * POST /api/patient/claims
 */
router.post('/claims', [
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

    const { patientAddress, amountRequested, diagnosis, procedureCodes } = req.body;

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

export default router;
