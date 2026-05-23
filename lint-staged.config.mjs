/**
 * Root lint-staged config. Routes staged files to the right toolchain
 * across the frontend/ (npm) + backend/ (uv) split. eslint lives in
 * frontend/node_modules; prettier and the git-hook tooling live in the
 * repo-root node_modules; ruff runs through uv.
 */
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');

export default {
  'frontend/**/*.{js,jsx,ts,tsx}': (files) => [
    `frontend/node_modules/.bin/eslint --fix ${quote(files)}`,
    `node_modules/.bin/prettier --write ${quote(files)}`,
  ],
  'frontend/**/*.{json,css,md,yml,yaml,html}': (files) => [
    `node_modules/.bin/prettier --write ${quote(files)}`,
  ],
  '**/*.py': (files) => [
    `uv run ruff check --fix ${quote(files)}`,
    `uv run ruff format ${quote(files)}`,
  ],
};
