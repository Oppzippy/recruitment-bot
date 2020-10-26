export default {
	transform: { "^.+\\.ts$": "ts-jest" },
	testEnvironment: "node",
	testRegex: "/integration/.*\\.test\\.ts$",
	moduleFileExtensions: ["ts", "js"],
};
