import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRequestDto, RefreshAuthRequestDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    createAccessToken: jest.fn(),
    createRefreshToken: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://app.com/secure-view'),
  };

  const authRequestDto: AuthRequestDto = {
    email: 'test@example.com',
    phone: '1234567890',
  };

  const refreshAuthRequestDto: RefreshAuthRequestDto = {
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access and refresh tokens if valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(true);
      mockAuthService.createAccessToken.mockResolvedValue('access.token');
      mockAuthService.createRefreshToken.mockResolvedValue('refresh.token');

      const result = await controller.login(authRequestDto);

      expect(result).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      });
    });

    it('should throw UnauthorizedException if user is invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(false);

      await expect(controller.login(authRequestDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      const tokens = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      };
      mockAuthService.refreshTokens.mockResolvedValue(tokens);

      const result = await controller.refresh(refreshAuthRequestDto);
      expect(result).toEqual(tokens);
    });
  });

  describe('generateHyperlink', () => {
    it('should return hyperlink URL for a valid contact', async () => {
      mockAuthService.validateUser.mockResolvedValue(true);
      mockAuthService.createAccessToken.mockResolvedValue('hyperlink.token');
      mockConfigService.get.mockReturnValue('https://app.com/secure-view');

      const result = await controller.generateHyperlink(authRequestDto);
      expect(result).toEqual({
        url: 'https://app.com/secure-view?token=hyperlink.token',
      });
    });

    it('should throw UnauthorizedException for invalid contact', async () => {
      mockAuthService.validateUser.mockResolvedValue(false);

      await expect(
        controller.generateHyperlink(authRequestDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
