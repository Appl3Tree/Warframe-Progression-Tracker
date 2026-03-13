// CLI entry point for source validation.
// Run with: npm run validate:sources
//   (which executes: tsx ./scripts/validateSources.cli.ts)

import { runSourceValidationOrThrow } from "../src/catalog/sources/validateSources";

try {
    runSourceValidationOrThrow();
    process.exit(0);
} catch {
    process.exit(1);
}
