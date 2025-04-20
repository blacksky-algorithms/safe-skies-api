// import { setupPermissionsMocks } from "../../mocks/permissions.mocks";
import { customServiceGate } from "../../../src/repos/permissions";
// import { mockServicesConfig } from "../../fixtures/moderation.fixtures";

// setupPermissionsMocks();

export const mockServicesConfig = [
  {
    value: "ozone",
    label: "Ozone",
    feed_gen_endpoint: null,
    admin_did: "admin1",
  },
  {
    value: "custom",
    label: "Custom Service",
    feed_gen_endpoint: "http://example.com",
    admin_did: "admin2",
  },
  {
    value: "blacksky",
    label: "Blacksky Moderation Service",
    feed_gen_endpoint: "http://example.com",
    admin_did: "did:plc:w4xbfzo7kqfes5zb7r6qv3rw",
  },
];

jest.mock("../../../src/repos/moderation", () => {
  return {
    getModerationServicesConfig: jest
      .fn()
      .mockResolvedValue(mockServicesConfig),
  };
});

describe("customServiceGate using default mocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false if service is not found in the configuration", async () => {
    // "blacksky" is not in mockServicesConfig so the default should allow it.
    const feedUri = "https://example.com/feed?creator=notfound";
    const result = await customServiceGate("notfound", feedUri);

    expect(result).toBe(false);
  });

  // TODO: Mocks need to be adjusted, some tests are still hitting the database instead of being mocked
  it.skip('should return true if feedUri includes admin_did for the "custom" service', async () => {
    // In mockServicesConfig, the "custom" service has admin_did of "admin2".
    const feedUri =
      "https://example.com/feed?creator=did:plc:w4xbfzo7kqfes5zb7r6qv3rw";
    const result = await customServiceGate("blacksky", feedUri);
    expect(result).toBe(true);
  });

  it('should return false if feedUri does not include admin_did for the "custom" service', async () => {
    const feedUri = "https://example.com/feed?creator=notblacksky";
    const result = await customServiceGate("blacksky", feedUri);
    expect(result).toBe(false);
  });
});

describe("customServiceGate with overridden configuration", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return false if a matching service has no admin_did", async () => {
    // Override configuration: service exists but with no admin_did.
    jest.doMock("../../../src/repos/permissions", () => ({
      // Preserve customServiceGate from the actual module.
      ...jest.requireActual("../../../src/repos/permissions"),
      getModerationServicesConfig: jest
        .fn()
        .mockResolvedValue([
          { value: "blacksky", label: "Blacksky", admin_did: undefined },
        ]),
    }));
    // Re-import customServiceGate so that the new mock takes effect.
    const { customServiceGate } = await import(
      "../../../src/repos/permissions"
    );
    const result = await customServiceGate(
      "blacksky",
      "https://example.com/feed",
    );
    expect(result).toBe(false);
  });

  it("should return false if getModerationServicesConfig throws an error", async () => {
    jest.doMock("../../../src/repos/permissions", () => ({
      ...jest.requireActual("../../../src/repos/permissions"),
      getModerationServicesConfig: jest
        .fn()
        .mockRejectedValue(new Error("DB error")),
    }));
    const { customServiceGate } = await import(
      "../../../src/repos/permissions"
    );
    const result = await customServiceGate(
      "blacksky",
      "https://example.com/feed",
    );
    expect(result).toBe(false);
  });
});
