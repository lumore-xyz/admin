# Changelog

All notable changes to the Lumore admin web app (`lumore-admin`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] – Icon picker for dynamic options, options page cleanup

### Added
- **Icon picker on the Options page.** Each option row now has an "Icon" column with a searchable Ionicons picker (`Command` + `Popover`). Selecting an icon saves `icon: { library: "Ionicons", name: "heart-outline" }` alongside `label` / `value`. Icons are loaded on demand from the backend's curated catalog (`GET /api/admin/options/icon-catalog`) so the picker stays in sync with the mobile renderer without shipping a custom icon library to the admin.
- **Icon preview chip.** When a row has an icon, the page shows a `Badge` underneath with the human-readable name (e.g. `Ionicons · Heart Outline`) so admins can confirm what they picked.

### Changed
- Extracted `OptionRow` into its own component so the options page just maps draft rows to `<OptionRow item onChange onRemove />`. The page no longer owns the row markup.
- `sanitizeDraftItem` / `buildSavePayload` now strip empty/invalid items server-side in one place (trim → require non-empty label/value → keep icon only when both library and name are present).
- `applyServerOptions` clones the response (deep enough for our shape) and resets both `remoteOptions` and `draftOptions` from the same source so save → reload stays consistent.
- `isSameOptionsMap` is now a small named helper instead of an inline `JSON.stringify(...)` comparison.

### Fixed
- Selecting an icon from a different library (anything that isn't `"Ionicons"`) is silently dropped at the row level via `normalizeIcon`, so the saved payload never carries an unsupported library string.
- Admin can no longer accidentally submit duplicate icon entries per option (dedup is performed server-side; the row UI also normalises the value).
- `getOptionIconCatalog` failure surfaces an inline error in the picker (instead of silently leaving the picker empty).

### Internal
- New `app/(DashboardLayout)/options/OptionRow.tsx` with explicit `OptionRowItem` shape.
- New `app/(DashboardLayout)/options/OptionIconPicker.tsx` using existing `Command` + `Popover` primitives.
- `AdminOptionItem.icon` and `AdminOptionsMap` types in `lib/admin-api.ts` extended to carry the optional icon.

## [1.0.0] – Initial admin baseline
- Initial release. Next.js admin dashboard with admin stats, users, credits ledger, this-or-that moderation, options management, campaign notifications, mobile-config + app-version management, user-groups, reported-users moderation.
