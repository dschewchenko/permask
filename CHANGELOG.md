# [3.0.0](https://github.com/dschewchenko/permask/compare/v2.1.1...v3.0.0) (2025-12-19)


* feat!: migrate to Bun, publish ESM-only exports, add framework integrations ([#30](https://github.com/dschewchenko/permask/issues/30)) ([#32](https://github.com/dschewchenko/permask/issues/32)) ([31df744](https://github.com/dschewchenko/permask/commit/31df744123bee980a53a7092d1ca67c5aaa24cf5))


### BREAKING CHANGES

* package is ESM-only (CJS/UMD entry points removed)
* unpackBitmasks now throws PermaskError on invalid input
* createPermask().create now throws PermaskError for unknown groups

## [2.1.1](https://github.com/dschewchenko/permask/compare/v2.1.0...v2.1.1) (2025-07-06)


### Bug Fixes

* add number support for access permission in hasAccess method ([#29](https://github.com/dschewchenko/permask/issues/29)) ([6d0d962](https://github.com/dschewchenko/permask/commit/6d0d962f3d703a025c9f2f52ad3df047351c18c4))

# [2.1.0](https://github.com/dschewchenko/permask/compare/v2.0.1...v2.1.0) (2025-07-05)


### Features

* improve API with string group names and new helpers ([dc37415](https://github.com/dschewchenko/permask/commit/dc37415f369678ab03d6b0f3d2a0b6f5f89c5986))=

You can now use string names for permission groups in `create()` and `hasGroup()` for an easier development experience. This change is fully backward-compatible, so numeric IDs still work.

- The `parse()` method now includes `groupName` in its output.
- Added `hasAccess()` to check group permissions in a single call.
- Added `getGroupName()` to find a group's name from a bitmask.

The playground and tests have been updated to use these new features.
For more details, see the project on GitHub: https://github.com/dschewchenko/permask/


## [2.0.1](https://github.com/dschewchenko/permask/compare/v2.0.0...v2.0.1) (2025-04-01)


### Bug Fixes

* initialize result array with zeros in unpackBitmasks function ([#22](https://github.com/dschewchenko/permask/issues/22)) ([aaea417](https://github.com/dschewchenko/permask/commit/aaea4176e1f95b7a099a01135e131eaad3b0e333))

# [2.0.0](https://github.com/dschewchenko/permask/compare/v1.1.0...v2.0.0) (2025-03-29)


### Features

* extend permission model to include update access - 4 bits ([#16](https://github.com/dschewchenko/permask/issues/16)) ([1a0bc02](https://github.com/dschewchenko/permask/commit/1a0bc022af622b3b699c60b008dd2b75be80abbd))


### BREAKING CHANGES

* size and naming changed for access part to fully match crud operations

# [1.1.0](https://github.com/dschewchenko/permask/compare/v1.0.0...v1.1.0) (2025-03-16)


### Features

* add pack and unpack functions ([cab3faf](https://github.com/dschewchenko/permask/commit/cab3faf15337849f757865ecea0cef131add3683))

# 1.0.0 (2025-01-17)


### Bug Fixes

* entry files and mistype ([#3](https://github.com/dschewchenko/permask/issues/3)) ([197f7b3](https://github.com/dschewchenko/permask/commit/197f7b3eee49a5078df42c1f7aff2b143e2247c5))
