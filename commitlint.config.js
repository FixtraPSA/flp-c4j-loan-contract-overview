module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", []],
    "scope-required-for-feat-fix": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "scope-required-for-feat-fix": (parsed) => {
          const { type, scope } = parsed;
          if (["feat", "fix"].includes(type) && !scope) {
            return [
              false,
              `scope is required for commit type "${type}" (e.g., "${type}(scope): subject")`,
            ];
          }
          return [true];
        },
      },
    },
  ],
};
