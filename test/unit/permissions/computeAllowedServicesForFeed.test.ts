import { computeAllowedServicesForFeed } from '../../../src/lib/utils/permissions';

describe('computeAllowedServicesForFeed', () => {
  it('should always include "ozone" by default when servicesConfig is empty', async () => {
    const admin_did = 'admin1';
    const servicesConfig: { value: string; admin_did?: string }[] = [];
    const result = await computeAllowedServicesForFeed(
      admin_did,
      servicesConfig
    );
    expect(result).toEqual(['ozone']);
  });

  it('should ignore any services with value "ozone" in servicesConfig', async () => {
    const admin_did = 'admin1';
    const servicesConfig = [
      { value: 'ozone', admin_did: 'admin1' },
      { value: 'ozone', admin_did: 'admin2' },
    ];
    const result = await computeAllowedServicesForFeed(
      admin_did,
      servicesConfig
    );
    expect(result).toEqual(['ozone']);
  });

  it('should add a service when admin_did matches', async () => {
    const admin_did = 'admin1';
    const servicesConfig = [{ value: 'custom', admin_did: 'admin1' }];
    const result = await computeAllowedServicesForFeed(
      admin_did,
      servicesConfig
    );
    expect(result).toEqual(['ozone', 'custom']);
  });

  it('should not add a service when admin_did does not match', async () => {
    const admin_did = 'admin1';
    const servicesConfig = [{ value: 'custom', admin_did: 'admin2' }];
    const result = await computeAllowedServicesForFeed(
      admin_did,
      servicesConfig
    );
    expect(result).toEqual(['ozone']);
  });

  it('should handle multiple services correctly', async () => {
    const admin_did = 'admin1';
    const servicesConfig = [
      { value: 'ozone', admin_did: 'admin1' }, // Ignored since "ozone" is always default.
      { value: 'custom', admin_did: 'admin1' }, // Matches, should be added.
      { value: 'extra', admin_did: 'admin2' }, // No match, should not be added.
      { value: 'vip', admin_did: 'admin1' }, // Matches, should be added.
    ];
    const result = await computeAllowedServicesForFeed(
      admin_did,
      servicesConfig
    );
    expect(result).toEqual(['ozone', 'custom', 'vip']);
  });
});
