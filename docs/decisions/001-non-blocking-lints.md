# Decision Record: Non-Blocking Lints (Temporary)

**Date:** 2026-01-26
**Status:** Temporary - Will be reverted when backend-dev-ia2 is resolved
**Context:** PR #28 - Jenkins CI/CD improvements

## Decision

Linting stages in Jenkins remain **non-blocking** (with `|| true` flags) until the existing TypeScript linting errors are resolved.

## Context

While improving the Jenkins CI/CD pipeline, we attempted to make linting blocking to enforce code quality. However, this revealed 266 existing TypeScript linting errors in the backend codebase.

### Linting Error Summary

**Total Errors:** 266 errors, 33 warnings
**Auto-fixable:** 1 error (already fixed in commit 133445d)
**Manual fixes needed:** 266 errors

**Primary Issues:**
- `@typescript-eslint/no-unsafe-assignment` - Using `any` types unsafely
- `@typescript-eslint/no-unsafe-member-access` - Accessing properties on `any` values
- `@typescript-eslint/no-unsafe-argument` - Passing `any` values as function arguments
- `@typescript-eslint/no-explicit-any` - Explicit `any` type usage
- `@typescript-eslint/no-unsafe-call` - Calling functions of `any` type

**Files Affected:**
- `backend/src/__tests__/auth.test.ts` - Test file with `any` typed responses
- `backend/src/engine/CollectionSimulator.ts` - Game engine with loose typing
- `backend/src/routes/api.ts` - API routes with `any` typed request/response handling

## Rationale

We chose to keep lints non-blocking temporarily because:

1. **Separation of Concerns:** The Jenkins improvements PR (#28) focuses on CI/CD infrastructure, not code quality fixes
2. **Scope Management:** Fixing 266 type errors is substantial work that should be tracked and reviewed separately
3. **Progressive Enhancement:** We can improve the CI/CD pipeline now and enforce stricter quality gates after cleanup
4. **Infrastructure First:** Having reliable CI/CD infrastructure in place makes it easier to validate future type safety improvements

## Options Considered

1. ✅ **Keep lints non-blocking, create cleanup issue** (Selected)
   - Pros: Unblocks CI/CD improvements, properly scopes work
   - Cons: Allows new linting errors temporarily

2. ❌ **Fix all 266 errors now**
   - Pros: Clean codebase immediately
   - Cons: Mixed concerns in one PR, time-consuming, harder to review

3. ❌ **Disable problematic ESLint rules**
   - Pros: Unblocks immediately
   - Cons: Weakens code quality standards permanently

4. ❌ **Split PR - infrastructure only**
   - Pros: Smaller PR
   - Cons: Loses the benefit of blocking lints, infrastructure incomplete

## Implementation

**Jenkinsfile Changes:**
```groovy
// Backend and Web Lint stages
sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm lint' || true"

post {
    always {
        publishChecks name: 'Backend Lint',
            summary: 'Backend linting completed (non-blocking until backend-dev-ia2 resolved)',
            conclusion: 'NEUTRAL'
    }
}
```

**Tracking Issue:** backend-dev-ia2 - "Fix backend TypeScript linting errors (266 errors)"

## When to Revert

Once backend-dev-ia2 is resolved and all linting errors are fixed:

1. Remove `|| true` from Backend Lint and Web Lint stages in Jenkinsfile
2. Change `post { always { ... conclusion: 'NEUTRAL' } }` to:
   ```groovy
   post {
       success {
           publishChecks name: 'Backend Lint',
               summary: 'Backend linting passed',
               conclusion: 'SUCCESS'
       }
       failure {
           publishChecks name: 'Backend Lint',
               summary: 'Backend linting failed',
               conclusion: 'FAILURE'
       }
   }
   ```
3. Update this decision record's status to "Resolved"
4. Verify Jenkins builds fail on new linting errors

## References

- **PR #28:** Jenkins CI/CD improvements
- **Issue backend-dev-ia2:** Fix backend TypeScript linting errors (266 errors)
- **Commit 133445d:** Auto-fix eslint issues in CollectionSimulator (1 error fixed)
