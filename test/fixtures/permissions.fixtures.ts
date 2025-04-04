import { ExistingPermission } from '../../src/lib/types/permission';
import { mockActingAdminUser } from './user.fixtures';

export const mockExistingPermission: ExistingPermission = {
  uri: 'feed:3',
  feed_name: 'Existing Feed',
  role: 'mod',
  admin_did: mockActingAdminUser.did,
};
