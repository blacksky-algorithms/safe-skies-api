import { mockToken } from "../fixtures/auth.fixtures";
import { mockUser, mockActingAdminUser } from "../fixtures/user.fixtures";

export const mockBlueskyOAuthClient = {
	authorize: jest.fn().mockResolvedValue(new URL("http://example.com")),
	callback: jest.fn(async (params: URLSearchParams) => {
		const code = params.get("code");
		const state = params.get("state");
		if (code === "validCode" && state === "validState") {
			return { session: { sub: "did:example:123" } };
		}
		throw new Error("Test error");
	}),
};

export const mockGetActorFeeds = jest.fn().mockResolvedValue({
	feeds: [
		{
			uri: "feed:1",
			displayName: "Feed One",
			creator: { did: "admin1" },
		},
	],
});

export const mockGetProfile = jest.fn().mockResolvedValue(mockUser);

export const mockSaveProfile = jest.fn().mockResolvedValue(true);

export const mockJwtSign = jest.fn().mockReturnValue(mockToken);
export const mockJwtVerify = jest
	.fn()
	.mockImplementation(() => mockActingAdminUser);

// Setup helper for all auth-related mocks
export const setupAuthMocks = (): void => {
	jest.mock("../../src/repos/oauth-client", () => ({
		BlueskyOAuthClient: mockBlueskyOAuthClient,
	}));

	jest.mock("../../src/repos/profile", () => ({
		getProfile: mockGetProfile,
		saveProfile: mockSaveProfile,
	}));

	jest.mock("jsonwebtoken", () => ({
		sign: mockJwtSign,
		verify: mockJwtVerify,
	}));
	jest.mock("../../src/repos/atproto", () => ({
		AtprotoAgent: {
			// Return a fixed profile based on the actor.
			getProfile: jest.fn(async () => {
				return {
					success: true,
					data: mockUser,
				};
			}),
		},
		// Return a fixed set of feeds.
		getActorFeeds: jest.fn(async () => ({
			feeds: [
				{ uri: "feed:1", displayName: "Feed One", creator: { did: "admin1" } },
			],
		})),
	}));
};
