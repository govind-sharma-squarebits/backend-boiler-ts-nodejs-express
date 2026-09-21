import { Response } from 'express';
import { BadRequestError } from '../../../shared/utils/errors';
import { sendSuccess } from '../../../shared/utils/response';
import { AuthRequest } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { clearRefreshTokenCookie } from '../utils/refreshCookie';
import {
  deliverAuthTokens,
  getRefreshTokenFromRequest,
} from '../utils/tokenDelivery';

export class AuthController {
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    const user = await authService.createUser(req.user!, req.body);
    sendSuccess(res, 'User created successfully', { user }, 201);
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken, accessToken, user } = await authService.login(
      req.body.email,
      req.body.password
    );

    const data = deliverAuthTokens(
      res,
      { accessToken, refreshToken },
      { user }
    );
    sendSuccess(res, 'Login successful', data);
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new BadRequestError(
        'Refresh token is required',
        'refreshToken: missing from cookies and body'
      );
    }

    const tokens = await authService.refreshToken(refreshToken);
    const data = deliverAuthTokens(res, tokens);
    sendSuccess(res, 'Token refreshed successfully', data);
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshTokenCookie(res);
    sendSuccess(res, 'Logged out successfully');
  }

  async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result.message);
  }

  async verifyOtp(req: AuthRequest, res: Response): Promise<void> {
    const result = await authService.verifyOtp(req.body.email, req.body.otp);
    sendSuccess(res, 'OTP verified successfully', result);
  }

  async resetPasswordWithToken(req: AuthRequest, res: Response): Promise<void> {
    const result = await authService.resetPasswordWithToken(
      req.body.resetToken,
      req.body.newPassword
    );
    sendSuccess(res, result.message);
  }

  async resetPasswordWithCurrent(req: AuthRequest, res: Response): Promise<void> {
    const result = await authService.resetPasswordWithCurrent(
      req.user!.sub,
      req.body.currentPassword,
      req.body.newPassword
    );
    sendSuccess(res, result.message);
  }
}

export const authController = new AuthController();
