import {
  Controller,
  Get,
  UseGuards,
  // HttpStatus,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { OauthService } from './oauth.service';

import { User } from '../users/entities/user.entity';
// import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('api/v1/oauth')
@UseInterceptors(ClassSerializerInterceptor)
// @ApiTags('OAuth')
export class OauthController {
  private readonly logger = new Logger(OauthController.name);

  constructor(private readonly oauthService: OauthService) {}

  @Get('/yandex')
  @UseGuards(AuthGuard('yandex'))
  // @ApiOperation({ summary: 'Redirect to Yandex OAuth' })
  // @ApiResponse({
  //   status: HttpStatus.FOUND,
  //   description: 'Redirecting to Yandex OAuth',
  // })
  async yandexLogin(): Promise<void> {
    this.logger.log('Initiating Yandex OAuth flow');
    // return HttpStatus.OK;
  }

  @Get('/yandex/redirect')
  @UseGuards(AuthGuard('yandex'))
  // @ApiOperation({ summary: 'Yandex OAuth callback' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'User authenticated successfully',
  //   schema: {
  //     example: {
  //       accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  //       refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  //     },
  //   },
  // })
  async yandexLoginRedirect(
    @Req() req: Request & { user: { user?: User } },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    return this.oauthService.signinOrSignup(req.user.user, response);
  }
}
