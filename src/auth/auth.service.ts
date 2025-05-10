import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HighLevelService } from 'services';
import { Contact } from 'types';
import { AuthRequestDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly highLevelService: HighLevelService,
  ) {}

  async fetchContact(authRequest: AuthRequestDto): Promise<Contact | null> {
    try {
      const contacts = await this.highLevelService.searchContacts(
        authRequest.email,
        authRequest.phone,
      );
      const contact = contacts.length > 0 ? contacts[0] : null;
      if (contact) {
        return {
          id: contact.id,
          email: contact.email,
          phone: contact.phone,
          type: contact.type,
          firstNameLowerCase: contact.firstNameLowerCase,
          lastNameLowerCase: contact.lastNameLowerCase,
          ...(contact?.customFields && { customFields: contact.customFields }),
        };
      }
      return null;
    } catch (error) {
      throw new UnauthorizedException('Failed to validate user');
    }
  }

  async createAccessToken({
    contact,
    isHyperlink = false,
  }: {
    contact: Contact;
    isHyperlink?: boolean;
  }): Promise<string> {
    return this.jwtService.sign(contact, {
      expiresIn: isHyperlink ? '24h' : '1h',
    });
  }

  async createRefreshToken(contact: Contact): Promise<string> {
    const payload = {
      email: contact.email,
      phone: contact.phone,
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

      const authRequest: AuthRequestDto = {
        email: payload.email,
        phone: payload.phone,
      };

      const contact = await this.fetchContact(authRequest);
      if (!contact) {
        throw new UnauthorizedException('User no longer exists');
      }

      const newAccessToken = await this.createAccessToken({ contact });
      const newRefreshToken = await this.createRefreshToken(contact);

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

      if (payload.type === 'hyperlink') {
        return payload;
      }

      // const authRequest: AuthRequestDto = {
      //   email: payload.email,
      //   phone: payload.phone,
      // };

      // const contact = await this.fetchContact(authRequest);
      // if (!contact) {
      //   throw new UnauthorizedException('User no longer exists');
      // }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
