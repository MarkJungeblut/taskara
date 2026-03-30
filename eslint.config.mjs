import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["backend/domain/models/**", ".next/**"],
    extends: [tseslint.configs.base],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@backend/domain/models/*"],
              message:
                "Import from '@backend/domain/models' (the barrel) instead of individual model files.",
            },
          ],
        },
      ],
    },
  }
);
