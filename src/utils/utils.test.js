const { getChatName, sendLogMessage, calculateTeamBudget, validateJsonData } = require('./utils');

describe('utils', () => {
  describe('getChatName', () => {
    it('when msg is undefined, return Unknown Chat', () => {
      const result = getChatName();
      expect(result).toBe('Unknown Chat');
    });

    it('when msg.chat is undefined, return Unknown Chat', () => {
      const result = getChatName({});
      expect(result).toBe('Unknown Chat');
    });

    it('when msg.chat.title is defined, return title', () => {
      const result = getChatName({ chat: { title: 'Test Title' } });
      expect(result).toBe('Test Title');
    });

    it('when msg.chat.username is defined, return username', () => {
      const result = getChatName({ chat: { username: 'TestUsername' } });
      expect(result).toBe('TestUsername');
    });

    it('when msg.chat.first_name and msg.chat.last_name are defined, return full name', () => {
      const result = getChatName({
        chat: { first_name: 'John', last_name: 'Doe' },
      });
      expect(result).toBe('John Doe');
    });

    it('when msg.chat.first_name is defined, return first name', () => {
      const result = getChatName({ chat: { first_name: 'John' } });
      expect(result).toBe('John ');
    });

    it('when msg.chat.last_name is defined, return last name', () => {
      const result = getChatName({ chat: { last_name: 'Doe' } });
      expect(result).toBe(' Doe');
    });

    it('when msg.chat is empty, return Unknown Chat', () => {
      const result = getChatName({ chat: {} });
      expect(result).toBe('Unknown Chat');
    });
  });

  describe('sendLogMessage', () => {
    it('when LOG_CHANNEL_ID is undefined, bot.sendMessage does not have been called', () => {
      // Reset module registry to ensure the mocks take effect
      jest.resetModules();
      // Mock the constants module so that LOG_CHANNEL_ID is undefined
      jest.mock('../constants', () => ({
        LOG_CHANNEL_ID: undefined,
      }));

      const botMock = {
        sendMessage: jest.fn(),
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Re-require utils so it picks up the mocked constants
      const { sendLogMessage } = require('./utils');
      sendLogMessage(botMock, 'Log message without channel ID');

      expect(botMock.sendMessage).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('LOG_CHANNEL_ID is not set');

      consoleErrorSpy.mockRestore();
    });

    it('when LOG_CHANNEL_ID is defined, bot.sendMessage has been called', () => {
      const botMock = {
        sendMessage: jest.fn(),
      };

      sendLogMessage(botMock, 'Log message with channel ID');

      expect(botMock.sendMessage).toHaveBeenCalledWith(
        expect.any(Number), // LOG_CHANNEL_ID
        expect.stringContaining('Log message with channel ID')
      );
    });

    it('when NODE_ENV is production, log message contains prod', () => {
      process.env.NODE_ENV = 'production';
      const botMock = {
        sendMessage: jest.fn(),
      };

      sendLogMessage(botMock, 'Log message in production');

      expect(botMock.sendMessage).toHaveBeenCalledWith(
        expect.any(Number), // LOG_CHANNEL_ID
        expect.stringContaining('env: prod')
      );
    });

    it('when NODE_ENV is not production, log message contains dev', () => {
      process.env.NODE_ENV = 'development';
      const botMock = {
        sendMessage: jest.fn(),
      };

      sendLogMessage(botMock, 'Log message in development');

      expect(botMock.sendMessage).toHaveBeenCalledWith(
        expect.any(Number), // LOG_CHANNEL_ID
        expect.stringContaining('env: dev')
      );
    });
  });

  describe('calculateTeamBudget', () => {
    it('calculates totalPrice, costCapRemaining, and overallBudget correctly', () => {
      const mockDrivers = {
        VER: { DR: 'VER', price: 30, expectedPoints: 25, expectedPriceChange: 0.2 },
        HAM: { DR: 'HAM', price: 28, expectedPoints: 20, expectedPriceChange: 0.1 },
        PER: { DR: 'PER', price: 25, expectedPoints: 15, expectedPriceChange: -0.1 },
        SAI: { DR: 'SAI', price: 23, expectedPoints: 18, expectedPriceChange: 0.3 },
        LEC: { DR: 'LEC', price: 24, expectedPoints: 19, expectedPriceChange: 0.1 },
        NOR: { DR: 'NOR', price: 20, expectedPoints: 12, expectedPriceChange: 0 }
      };

      const mockConstructors = {
        RED: { CN: 'RED', price: 35, expectedPoints: 30, expectedPriceChange: 0.5 },
        MER: { CN: 'MER', price: 32, expectedPoints: 25, expectedPriceChange: 0.2 },
        FER: { CN: 'FER', price: 30, expectedPoints: 20, expectedPriceChange: -0.1 }
      };

      const mockCurrentTeam = {
        drivers: ['VER', 'HAM', 'PER', 'SAI', 'LEC'],
        constructors: ['RED', 'MER'],
        drsBoost: 'VER',
        freeTransfers: 2,
        costCapRemaining: 10
      };

      const result = calculateTeamBudget(mockCurrentTeam, mockDrivers, mockConstructors);

      // totalPrice = 30+28+25+23+24 + 35+32 = 197
      // costCapRemaining = 10
      // overallBudget = 197 + 10 = 207
      expect(result).toEqual({
        totalPrice: 197,
        costCapRemaining: 10,
        overallBudget: 207,
      });
    });

    it('returns 0 totalPrice if drivers and constructors are empty', () => {
      const team = {
        drivers: [],
        constructors: [],
        costCapRemaining: 10,
      };
      const drivers = [];
      const constructors = [];

      const result = calculateTeamBudget(team, drivers, constructors);

      expect(result).toEqual({
        totalPrice: 0,
        costCapRemaining: 10,
        overallBudget: 10,
      });
    });

    it('handles driver and constructor indices correctly', () => {
      const team = {
        drivers: [1, 0],
        constructors: [1, 0],
        costCapRemaining: 0,
      };
      const drivers = [{ price: 5 }, { price: 10 }];
      const constructors = [{ price: 20 }, { price: 30 }];

      const result = calculateTeamBudget(team, drivers, constructors);

      // drivers: 10 + 5, constructors: 30 + 20
      expect(result).toEqual({
        totalPrice: 65,
        costCapRemaining: 0,
        overallBudget: 65,
      });
    });
  });

  describe('validateJsonData', () => {
    let botMock;

    beforeEach(() => {
      botMock = {
        sendMessage: jest.fn().mockResolvedValue(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const validJsonData = {
      Drivers: Array(20).fill({}),
      Constructors: Array(10).fill({}),
      CurrentTeam: {
        drivers: Array(5).fill('DRIVER'),
        constructors: Array(2).fill('CONSTRUCTOR'),
        drsBoost: 'DRIVER',
        freeTransfers: 2,
        costCapRemaining: 10,
      },
    };

    it('returns true for valid JSON data', async () => {
      const result = validateJsonData(botMock, validJsonData, 123);
      expect(result).toBe(true);
      expect(botMock.sendMessage).not.toHaveBeenCalled();
    });

    it('returns false and sends message if Drivers is missing', async () => {
      const data = { ...validJsonData, Drivers: undefined };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('20 drivers')
      );
    });

    it('returns false and sends message if Drivers length is not 20', async () => {
      const data = { ...validJsonData, Drivers: Array(19).fill({}) };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('20 drivers')
      );
    });

    it('returns false and sends message if Constructors is missing', async () => {
      const data = { ...validJsonData, Constructors: undefined };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('10 constructors')
      );
    });

    it('returns false and sends message if Constructors length is not 10', async () => {
      const data = { ...validJsonData, Constructors: Array(9).fill({}) };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('10 constructors')
      );
    });

    it('returns false and sends message if CurrentTeam is missing', async () => {
      const data = { ...validJsonData, CurrentTeam: undefined };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.drivers is missing', async () => {
      const data = { ...validJsonData, CurrentTeam: { ...validJsonData.CurrentTeam, drivers: undefined } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.drivers length is not 5', async () => {
      const data = { ...validJsonData, CurrentTeam: { ...validJsonData.CurrentTeam, drivers: Array(4).fill('DRIVER') } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.constructors is missing', async () => {
      const data = { ...validJsonData, CurrentTeam: { ...validJsonData.CurrentTeam, constructors: undefined } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.constructors length is not 2', async () => {
      const data = { ...validJsonData, CurrentTeam: { ...validJsonData.CurrentTeam, constructors: Array(1).fill('CONSTRUCTOR') } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.drsBoost is missing', async () => {
      const { drsBoost, ...rest } = validJsonData.CurrentTeam;
      const data = { ...validJsonData, CurrentTeam: { ...rest } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.freeTransfers is missing', async () => {
      const { freeTransfers, ...rest } = validJsonData.CurrentTeam;
      const data = { ...validJsonData, CurrentTeam: { ...rest } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });

    it('returns false and sends message if CurrentTeam.costCapRemaining is missing', async () => {
      const { costCapRemaining, ...rest } = validJsonData.CurrentTeam;
      const data = { ...validJsonData, CurrentTeam: { ...rest } };
      const result = validateJsonData(botMock, data, 123);
      expect(result).toBe(false);
      expect(botMock.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('CurrentTeam')
      );
    });
  });
});
