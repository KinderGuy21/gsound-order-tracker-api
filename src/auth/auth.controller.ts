import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from 'common';
import { AuthService } from './auth.service';
import { AuthRequestDto, RefreshAuthRequestDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and get tokens' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async login(@Body() authRequest: AuthRequestDto) {
    try {
      const contact = await this.authService.fetchContact(authRequest);

      if (!contact) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = await this.authService.createAccessToken({
        contact,
      });
      const refreshToken = await this.authService.createRefreshToken(contact);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Authentication failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @ApiBearerAuth('access-token')
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refresh successful' })
  async refresh(@Body() refreshAuthRequestDto: RefreshAuthRequestDto) {
    try {
      return await this.authService.refreshTokens(
        refreshAuthRequestDto.refreshToken,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Token refresh failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Public()
  @Post('generate-hyperlink/:id')
  @ApiOperation({ summary: 'Generate 24h access URL for a contact' })
  @ApiResponse({ status: 200, description: 'Hyperlink generated successfully' })
  async generateHyperlink(
    @Body() authRequest: AuthRequestDto,
    @Param('id') id: string,
  ) {
    const contact = await this.authService.fetchContact(authRequest);

    if (!contact) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hyperlinkToken = await this.authService.createAccessToken({
      contact,
      isHyperlink: true,
    });

    const baseUrl = process.env.HYPERLINK_BASE_URL;
    const url = `${baseUrl}/order/${id}/view?token=${hyperlinkToken}`;

    return {
      url,
    };
  }
}
