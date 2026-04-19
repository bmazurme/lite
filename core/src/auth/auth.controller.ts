import { Controller, Post, Request, UseGuards, Res, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request as CustomRequest } from 'express';

import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req: Request & { user: any },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(req.user, response);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshToken(
    @Request() req: CustomRequest & { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshTokens(req, response);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/logout')
  logout(
    @Request() req: CustomRequest & { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(req, response);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('check')
  checkAuth(
    @Request() request: CustomRequest & { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.checkAuth(request, response);
  }
}
