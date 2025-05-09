import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HighLevelService } from './highlevel.service';
import { AuthRequestDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly highLevelService: HighLevelService,
  ) {}

  async validateUser(authRequest: AuthRequestDto): Promise<boolean> {
    try {
      const contacts = await this.highLevelService.searchContacts(
        authRequest.email,
        authRequest.phone,
      );
      return contacts.length > 0;
    } catch (error) {
      throw new UnauthorizedException('Failed to validate user');
    }
  }

  async createAccessToken({
    user,
    isHyperlink = false,
  }: {
    user: AuthRequestDto;
    isHyperlink?: boolean;
  }): Promise<string> {
    const payload = {
      email: user.email,
      phone: user.phone,
      type: isHyperlink ? 'hyperlink' : 'user',
    };

    return this.jwtService.sign(payload, {
      expiresIn: isHyperlink ? '24h' : '1h',
    });
  }

  async createRefreshToken(user: AuthRequestDto): Promise<string> {
    const payload = {
      email: user.email,
      phone: user.phone,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user: AuthRequestDto = {
        email: payload.email,
        phone: payload.phone,
      };

      // Validate user still exists in HighLevel
      const isValid = await this.validateUser(user);
      if (!isValid) {
        throw new UnauthorizedException('User no longer exists');
      }

      const newAccessToken = await this.createAccessToken({ user });
      const newRefreshToken = await this.createRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // For hyperlink tokens, we don't need to revalidate the user
      if (payload.type === 'hyperlink') {
        return payload;
      }

      // For user tokens, verify the user still exists
      const isValid = await this.validateUser({
        email: payload.email,
        phone: payload.phone,
      });

      if (!isValid) {
        throw new UnauthorizedException('User no longer exists');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
