import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/**
 * Как JwtGuard, но не отклоняет запрос при отсутствии/невалидности токена —
 * request.user просто остаётся незаполненным. Нужен для публичных ручек,
 * которым важно знать, авторизован ли запрос (черновики видны только автору),
 * но которые должны отвечать и анонимным посетителям.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user;
  }
}
