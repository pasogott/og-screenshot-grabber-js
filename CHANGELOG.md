# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `--dry-run` flag to preview operations without executing
- `--show-config` flag to display current configuration
- Environment variable validation with helpful warnings
- Better error messages with actionable suggestions
- Verbose mode now shows output directory creation
- Configuration helper module (`src/lib/config.ts`)

### Changed
- Error message when no URLs provided now suggests common usage patterns
- Environment variable parsing now validates and warns on invalid values
- CLI flags now correctly override environment variables

### Fixed
- Environment variables now properly validated before use
- Negative values in env vars are rejected with warning

## [1.0.0] - 2026-01-08

### Added
- Initial TypeScript/Bun implementation
- Modular architecture with 7 lib modules
- NO_COLOR environment variable support
- URL validation with early error reporting
- Graceful SIGINT (Ctrl-C) handling
- Enhanced help text with examples
- TTY detection for output formatting
- Exit codes: 0 (success), 1 (partial), 2 (failed)
- Output modes: default, `--plain`, `--json`
- Parallel processing with semaphore
- Cookie banner handling (multi-frame)
- Metadata footer generation
- `--timeout` flag for configurable navigation timeout
- Environment variables support (OG_SCREENSHOT_*)
- Stdin mixing support (`-` flag)

### Documentation
- Comprehensive README with examples
- AGENTS.md for AI coding assistants
- REFACTORING.md for CLI improvements
- BUILD.md for distribution options
- SUMMARY.md for project overview
- CLI_ANALYSIS.md for guidelines compliance

[Unreleased]: https://github.com/user/og-screenshot-grabber-js/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/og-screenshot-grabber-js/releases/tag/v1.0.0
