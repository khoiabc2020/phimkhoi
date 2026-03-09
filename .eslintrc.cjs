/** ESLint config for PhimKhoi (web) */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  // Avoid linting bundled / third‑party code and native Android project
  ignorePatterns: [
    "android/**",
    "**/node_modules/**",
    ".next/**",
  ],
};

