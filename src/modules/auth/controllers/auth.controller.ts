import { Response } from 'express';
import { env } from '../../../config/env';
import { sendSuccess } from '../../../shared/utils/response';
import { AuthRequest } from '../types/auth.types';
import { authService } from '../services/auth.service';

export class AuthController {
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    const user = await authService.createUser(req.user!, req.body);
    sendSuccess(res, 'User created successfully', { user }, 201);
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken, ...result } = await authService.login(req.body.email, req.body.password);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    sendSuccess(res, 'Login successful', result);
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    const tokens = await authService.refreshToken(req.cookies.refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    sendSuccess(res, 'Token refreshed successfully', { accessToken: tokens.accessToken });
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
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
