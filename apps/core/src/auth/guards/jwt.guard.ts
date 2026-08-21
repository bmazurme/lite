import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

/**
 * Custom JWT authentication guard.
 * Extends the default AuthGuard to provide JWT-based authentication.
 * This guard is used to protect routes that require JWT token validation.
 * When applied to a route, it ensures that the request contains a valid JWT token.
 * If the token is missing or invalid, the request will be rejected.
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
