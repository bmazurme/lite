import {
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request as CustomRequest } from 'express';

import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('api/v1/auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RefreshTokenGuard)
  @Get('check')
  checkAuth(
    @Request() request: CustomRequest & { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.checkAuth(request, response);
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  logout(
    @Request() req: CustomRequest & { cookies?: { refreshToken?: string } },
    @Res({ passthrough: true }) response: Response,
    // @CurrentUser() user: User,
  ) {
    return this.authService.logout(req, response);
  }
}
