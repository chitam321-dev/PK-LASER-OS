# Dependency audit exception review

**Review date:** 2026-10-20  
**Status:** Temporary, narrowly scoped CI exception; review on every dependency update.

## Finding

GitHub Advisory Database entry [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) reports a high-severity uncontrolled-recursion / stack-exhaustion issue in `braces` versions `<=3.0.3`. The advisory currently lists no patched release. The branch's audit output traces this package through:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`

This path starts in the development-only `eslint-config-next` dependency. npm reports the direct finding and high-severity parent finding(s) whose audit path terminates at the same `braces` advisory. The prior CI audit also reported a moderate `esbuild` advisory through `drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild`; this is a development-tool dependency and remains visible in full audit output.

## Why the high finding is excepted

The repository uses the affected package through lint/build tooling, not application runtime code. The available forced npm remediation would downgrade `eslint-config-next` to 14.2.35 and `drizzle-kit` to 0.18.1, both major compatibility regressions for this project. Pinning `braces@3.0.3` does not fix this advisory because 3.0.3 is within the affected range.

## CI enforcement

CI still runs `npm audit --json` over the full dependency tree. The checker follows npm's advisory dependency links and permits only the exact high advisory above and parent findings whose only high-severity path recursively leads to that advisory. It then checks every affected package name against the `npm ls --omit=dev` production tree. The check fails closed if that verification fails or if any affected package appears in production. Any other high/critical advisory or audit parsing error fails CI. Low/moderate findings remain listed in the CI output under the existing high-severity release threshold.

## Conditions for removal

Remove this exception when the advisory is withdrawn or a patched `braces` release is available and adopted. Reassess earlier if dependency paths change, any affected package appears in production dependencies, or a release uses untrusted brace patterns in a runtime path. Do not use `npm audit fix --force` without reviewing its proposed major-version changes.
