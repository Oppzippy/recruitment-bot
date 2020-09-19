export default {
	transform: { "^.+\\.ts$": "ts-jest" },
	testEnvironment: "node",
	testRegex: "/src/.*\\.test\\.ts$",
	moduleFileExtensions: ["ts", "js"],
};
