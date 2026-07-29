# Repository quality cleanup

This branch runs repository-wide safe formatting and ESLint autofixes before verification.

## Verification gates

- TypeScript typecheck
- semantic ESLint checks
- formatting check
- unit tests
- integration tests
- security tests
- coverage
- production build
- end-to-end tests
- accessibility tests
- isolated Supabase migration reset and SQL regression tests

No production deployment or production database migration is performed by this branch.
