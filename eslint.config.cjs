const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["src/**/*.spec.ts"],
		rules: {
			"@typescript-eslint/no-unused-expressions": "off"
		}
	}
)
