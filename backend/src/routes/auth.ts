import express, { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { hederaService } from '../server';
import { ApiResponse } from '../types/api';
import { HederaService } from '../services/hederaService';

const router: Router = express.Router();

/**
 * Authenticate user with wallet
 * POST /api/auth/wallet
 */
router.post('/wallet', [
  body('address').matches(/^0\.0\.\d+$/).withMessage('Invalid Hedera address format'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('message').notEmpty().withMessage('Message is required')
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

    const { address, signature, message } = req.body;

    // Verify wallet signature (simplified for demo)
    // In production, implement proper signature verification
    
    const token = jwt.sign(
      { 
        address, 
        type: 'wallet_auth',
        iat: Math.floor(Date.now() / 1000) 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        address,
        expiresIn: '24h'
      }
    } as ApiResponse<{ token: string; address: string; expiresIn: string }>);

  } catch (error) {
    console.error('Error in wallet authentication:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    } as ApiResponse<null>);
  }
});

/**
 * Verify JWT token
 * POST /api/auth/verify
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      } as ApiResponse<null>);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    res.json({
      success: true,
      data: {
        address: decoded.address,
        type: decoded.type,
        exp: decoded.exp
      }
    } as ApiResponse<{ address: string; type: string; exp: number }>);

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      } as ApiResponse<null>);
    }

    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed'
    } as ApiResponse<null>);
  }
});

/**
 * Get wallet connection status
 * GET /api/auth/status/:address
 */
router.get('/status/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Check if wallet address format is valid
    const isConnected = HederaService.isValidAccountId(address);

    res.json({
      success: true,
      data: {
        address,
        isConnected,
        network: process.env.HEDERA_NETWORK || 'testnet'
      }
    } as ApiResponse<{ address: string; isConnected: boolean; network: string }>);

  } catch (error) {
    console.error('Error checking wallet status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check wallet status'
    } as ApiResponse<null>);
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement token blacklisting here if needed

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    } as ApiResponse<{ message: string }>);

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    } as ApiResponse<null>);
  }
});

export default router;
