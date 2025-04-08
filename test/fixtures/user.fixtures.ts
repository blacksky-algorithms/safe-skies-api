export const mockUser = {
  did: 'did:example:123',
  handle: '@justUser',
  displayName: 'Test User',
};
export const mockActingAdminUser = {
  did: 'did:example:admin',
  handle: '@adminUser',
  displayName: 'Admin User',
};

export const mockNotActingAdminUser = {
  did: 'did:example:not.acting.admin',
  handle: '@notActingAdmin',
  displayName: 'Not Acting Admin User',
};

export const mockModUser = {
  did: 'did:example:mod',
  handle: '@modUser',
  displayName: 'Mod User',
};

export const mockTargetUser = {
  did: 'did:example:targetUser',
  handle: '@targetUser',
  displayName: 'targetUser',
};

export const mockTargetPostUri = `at://${mockTargetUser.did}/post/1`;
