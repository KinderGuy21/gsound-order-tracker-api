import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    createAccessToken: jest.fn(),
    createRefreshToken: jest.fn(),
    refreshTokens: jest.fn(),
    validateToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://app.com/secure-view'),
  };

  const mockAuthRequest = { email: 'test@test.com', phone: '123456789' };
  const mockAccessToken = 'access.token.mock';
  const mockRefreshToken = 'refresh.token.mock';
  const mockPayload = {
    email: 'test@test.com',
    phone: '123456789',
    type: 'user',
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      mockAuthService.validateUser.mockResolvedValue(true);
      mockAuthService.createAccessToken.mockResolvedValue(mockAccessToken);
      mockAuthService.createRefreshToken.mockResolvedValue(mockRefreshToken);

      const result = await controller.login(mockAuthRequest);
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw UnauthorizedException if user is invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(false);
      await expect(controller.login(mockAuthRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      const resultTokens = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      };
      mockAuthService.refreshTokens.mockResolvedValue(resultTokens);

      const result = await controller.refresh('some-refresh-token');
      expect(result).toEqual(resultTokens);
    });
  });

  describe('validate', () => {
    it('should return valid payload', async () => {
      mockAuthService.validateToken.mockResolvedValue(mockPayload);

      const result = await controller.validate('some-token');
      expect(result).toEqual({ valid: true, payload: mockPayload });
    });
  });

  describe('generateHyperlink', () => {
    it('should return a 24h hyperlink with token and url', async () => {
      mockAuthService.validateUser.mockResolvedValue(true);
      mockAuthService.createAccessToken.mockResolvedValue(mockAccessToken);

      const result = await controller.generateHyperlink(mockAuthRequest);

      expect(result).toEqual({
        hyperlinkToken: mockAccessToken,
        url: `https://app.com/secure-view?token=${mockAccessToken}`,
        expiresIn: '24h',
      });
    });

    it('should throw UnauthorizedException if contact is invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(false);
      await expect(
        controller.generateHyperlink(mockAuthRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
