import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

/**
 * JWT authentication strategy for Passport.js
 * Handles JWT token verification and user validation
 * Extracts token from Authorization header and validates it against secret key
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor initializing strategy configuration
   * @param configService Service for retrieving configuration settings
   * @description Sets up JWT strategy with secret key and token extraction method
   */
  constructor(private readonly configService: ConfigService) {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: (request) => {
        const authHeader = request.headers.authorization;
        // console.log('!!!', authHeader);

        // const token = request.cookies?.access_token;
        // const token = request.cookies?.accessToken;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];

          return token;
        }
      },
      secretOrKey: configService.get('JWT_SECRET') ?? 'SECRET',
    });
  }

  /**
   * Validates decoded JWT payload
   * @param payload Decoded JWT payload containing user information
   * @description Extracts user ID from payload for further use in application
   */
  validate(payload: { sub: number }) {
    return {
      id: payload.sub,
      // roles: payload.roles,
    };
  }
}
