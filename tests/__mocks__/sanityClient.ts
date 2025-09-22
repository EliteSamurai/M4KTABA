export const readClient = {
  fetch: jest.fn(),
};

export const writeClient = {
  create: jest.fn(),
  patch: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  commit: jest.fn(),
};

export const getSanityClients = jest.fn().mockResolvedValue({
  readClient: {
    fetch: jest.fn(),
  },
  writeClient: {
    create: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    commit: jest.fn(),
  },
});

export const isSanityConfigured = jest.fn(() => true);
