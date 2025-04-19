module.exports = {
	rootDir: ".",
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/test/**/*.test.ts"],
	moduleDirectories: ["node_modules", "src"],
	setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
};
