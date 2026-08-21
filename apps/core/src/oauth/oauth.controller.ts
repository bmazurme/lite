import {
  Controller,
  Get,
  UseGuards,
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

@Controller('api/v1/oauth')
@UseInterceptors(ClassSerializerInterceptor)
export class OauthController {
  private readonly logger = new Logger(OauthController.name);

  constructor(private readonly oauthService: OauthService) {}

  @Get('/yandex')
  @UseGuards(AuthGuard('yandex'))
  async yandexLogin(): Promise<void> {
    this.logger.log('Initiating Yandex OAuth flow');
    // return HttpStatus.OK;
  }

  @Get('/yandex/redirect')
  @UseGuards(AuthGuard('yandex'))
  async yandexLoginRedirect(
    @Req() req: Request & { user: { user?: User } },
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    console.log(123);
    return this.oauthService.signinOrSignup(req.user.user, response);
  }
}
