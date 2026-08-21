import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

import {
  createRequestCounter,
  createRequestDurationHistogram,
} from '../metrics/metrics.provider';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly metrics = {
    create: createRequestCounter(
      'users_create_total',
      'Total number of created users',
    ),
    findCurrent: createRequestCounter(
      'users_find_current_total',
      'Total number of find current user',
    ),
    findByEmail: createRequestCounter(
      'users_find_by_email_total',
      'Total number of find user by email',
    ),
    findByRefreshToken: createRequestCounter(
      'users_find_by_refresh_token_total',
      'Total number of find user by refresh token',
    ),
    update: createRequestCounter(
      'users_update_total',
      'Total number of updated users',
    ),
  };

  private findUserHistogram = createRequestDurationHistogram(
    'users_find_duration_seconds',
    'Duration of user find operations',
  );

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // private readonly users = [
  //   {
  //     id: 1,
  //     username: 'john',
  //     password: '$2b$10$oNa8UD6IULhrWTXodJ2ZTuiAoOYho0GC6WdCpElGLQCvHnxV72utS', // 'changeme'
  //     refreshToken: null,
  //   },
  // ];

  // async findByUsername(username: string) {
  //   return this.users.find((user) => user.username === username);
  // }

  async findByRefreshToken(refreshToken: string) {
    // return this.users.find((user) => user.refreshToken === refreshToken);
    return this.findUser<User>(
      { refreshToken },
      'findByRefreshToken',
      undefined,
      // ['roles'],
    );
  }

  async saveRefreshToken(id: number, newRefreshToken: string) {
    return this.updateUser(
      id,
      { refreshToken: newRefreshToken },
      'update',
      'saveRefreshToken',
    );
    // const user = this.users.find((u) => u.id === userId);

    // if (user) {
    //   user.refreshToken = refreshToken;
    // }
  }

  async create(createUserDto: CreateUserDto) {
    return this.trackOperation('create', async () => {
      const { email } = createUserDto;
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        const errorMessage = `User with email ${email} already exists`;
        this.logger.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }

      return await this.userRepository.save(createUserDto);
    });
  }

  async findByEmail(email: string) {
    return this.findUser<User>({ email }, 'findByEmail', {
      id: true,
      email: true,
      status: true,
      isActive: true,
    });
  }

  async findById(id: number) {
    const key = `users:${id}`;
    const cached = await this.cacheManager.get<User>(key);
    if (cached) return cached;

    const user = await this.findUser<User>({ id }, 'findCurrent', {
      id: true,
      email: true,
      status: true,
    });
    if (user) await this.cacheManager.set(key, user);
    return user;
  }

  private async trackOperation<T>(
    operationName: keyof typeof this.metrics,
    action: () => Promise<T>,
  ): Promise<T> {
    const end = this.findUserHistogram.startTimer({ operation: operationName });
    try {
      const result = await action();
      this.metrics[operationName].inc({ success: 'true' });
      return result;
    } catch (error) {
      this.metrics[operationName].inc({ success: 'false' });
      throw error;
    } finally {
      end();
    }
  }

  private async findUser<T>(
    where: FindOptionsWhere<User>,
    operation: keyof typeof this.metrics,
    select?: FindOptionsSelect<User>,
    relations?: FindOptionsRelations<User>,
  ): Promise<T | null> {
    return this.trackOperation(operation, async () => {
      const options: FindOneOptions<User> = { where, select, relations };
      const user = await this.userRepository.findOne(options);

      if (user) {
        this.logger.log(`Found user: ${JSON.stringify(where)}`);
      } else {
        this.logger.warn(`User not found: ${JSON.stringify(where)}`);
      }

      return user as T;
    });
  }

  // private async findUser<T>(
  //   where: FindOptionsWhere<User>,
  //   operation: keyof typeof this.metrics,
  //   select?: FindOptionsSelect<User>,
  //   relations?: string[],
  // ): Promise<T | null> {
  //   return this.trackOperation(operation, async () => {
  //     const options: FindOneOptions<User> = { where, select, relations };
  //     const user = await this.userRepository.findOne(options);

  //     if (user) {
  //       this.logger.log(`Found user: ${JSON.stringify(where)}`);
  //     } else {
  //       this.logger.warn(`User not found: ${JSON.stringify(where)}`);
  //     }

  //     return user as T;
  //   });
  // }

  async update(
    id: number,
    updateFields: Partial<User>,
  ): Promise<UserResponseDto> {
    return this.updateUser(id, updateFields, 'update', 'update');
  }

  private async updateUser(
    userId: number,
    updateFields: Partial<User>,
    operation: keyof typeof this.metrics,
    logMessage: string,
  ): Promise<UserResponseDto> {
    return this.trackOperation(operation, async () => {
      const user = await this.userRepository.findOneOrFail({
        where: { id: userId },
      });
      const updatedUser = { ...user, ...updateFields };

      await this.userRepository.save(updatedUser);
      await this.cacheManager.del(`users:${userId}`);
      this.logger.log(`${logMessage} - ${userId}`);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status,
      };
    });
  }

  async isRefreshTokenValid(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
          refreshToken: refreshToken,
          // isActive: true,
        },
        select: {
          id: true,
          refreshToken: true,
          isActive: true,
        },
      });

      if (!user) {
        this.logger.warn(`Invalid refresh token for user ${userId}`);
        return false;
      }

      // Дополнительная проверка срока действия, если хранится в БД
      // if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      //   return false;
      // }

      return true;
    } catch (error) {
      // this.handleError('isRefreshTokenValid', error as Error, `user ${userId}`);
      return false;
    }
  }
}
