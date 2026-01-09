// scripts/sanitize-json-data.mjs
// Format-only sanitizer for src/data/**/*.json
// Guardrails:
//  - Rejects comment tokens (// or /* */) outside strings
//  - Rejects duplicate keys in any object
//  - Round-trip deep-equality check before writing
//
// Usage:
//  node scripts/sanitize-json-data.mjs            # check only (no writes)
//  node scripts/sanitize-json-data.mjs --write    # write changes
//  node scripts/sanitize-json-data.mjs --dir src/data

import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const dirArgIndex = process.argv.indexOf("--dir");
const ROOT_DIR =
    dirArgIndex !== -1 && process.argv[dirArgIndex + 1]
        ? process.argv[dirArgIndex + 1]
        : "src/data";

function walk(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            out.push(...walk(full));
        } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".json")) {
            out.push(full);
        }
    }
    return out;
}

function isWhitespace(ch) {
    return ch === " " || ch === "\n" || ch === "\r" || ch === "\t";
}

function parseString(src, i) {
    // src[i] must be '"'
    let j = i + 1;
    let out = "";
    while (j < src.length) {
        const ch = src[j];
        if (ch === '"') {
            return { value: out, next: j + 1 };
        }
        if (ch === "\\") {
            const esc = src[j + 1];
            if (esc === undefined) {
                throw new Error("Unterminated escape in string");
            }
            // Preserve exact meaning via JSON.parse on a tiny slice is costly;
            // We only need the key string for duplicate detection, so we decode minimal escapes.
            if (esc === '"' || esc === "\\" || esc === "/") {
                out += esc;
                j += 2;
                continue;
            }
            if (esc === "b") {
                out += "\b";
                j += 2;
                continue;
            }
            if (esc === "f") {
                out += "\f";
                j += 2;
                continue;
            }
            if (esc === "n") {
                out += "\n";
                j += 2;
                continue;
            }
            if (esc === "r") {
                out += "\r";
                j += 2;
                continue;
            }
            if (esc === "t") {
                out += "\t";
                j += 2;
                continue;
            }
            if (esc === "u") {
                const hex = src.slice(j + 2, j + 6);
                if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                    throw new Error(`Invalid unicode escape: \\u${hex}`);
                }
                out += String.fromCharCode(parseInt(hex, 16));
                j += 6;
                continue;
            }
            throw new Error(`Unsupported escape sequence: \\${esc}`);
        }
        out += ch;
        j += 1;
    }
    throw new Error("Unterminated string");
}

function detectCommentsAndDuplicateKeys(src) {
    // Minimal JSON scanner that:
    //  - detects // and /* */ outside strings
    //  - detects duplicate keys in objects
    let i = 0;

    const stack = [];
    // Each object frame: { type: "object", keys: Set<string>, expect: "keyOrEnd"|"colon"|"value"|"commaOrEnd", lastKey: string|null }
    // Each array frame: { type: "array", expect: "valueOrEnd"|"commaOrEnd" }

    function skipWs() {
        while (i < src.length && isWhitespace(src[i])) i += 1;
    }

    function peek2() {
        return src.slice(i, i + 2);
    }

    function error(msg) {
        const context = src.slice(Math.max(0, i - 20), Math.min(src.length, i + 20));
        throw new Error(`${msg} at index ${i}. Context: ${JSON.stringify(context)}`);
    }

    function readLiteral() {
        // number, true, false, null - just advance
        const start = i;
        while (i < src.length) {
            const ch = src[i];
            if (
                ch === "," ||
                ch === "}" ||
                ch === "]" ||
                ch === ":" ||
                isWhitespace(ch)
            ) {
                break;
            }
            i += 1;
        }
        if (i === start) error("Expected literal");
    }

    function expectFrame() {
        return stack.length ? stack[stack.length - 1] : null;
    }

    skipWs();
    while (i < src.length) {
        // comment detection outside strings
        const p2 = peek2();
        if (p2 === "//" || p2 === "/*") {
            error("Found comment token (JSONC). Refusing to sanitize this file");
        }

        const ch = src[i];
        const frame = expectFrame();

        if (ch === '"') {
            const { value, next } = parseString(src, i);
            i = next;

            // If we are in object expecting a key, record & check duplicates
            if (frame && frame.type === "object") {
                if (frame.expect === "keyOrEnd") {
                    if (frame.keys.has(value)) {
                        throw new Error(`Duplicate key "${value}" detected`);
                    }
                    frame.keys.add(value);
                    frame.lastKey = value;
                    frame.expect = "colon";
                } else if (frame.expect === "value") {
                    frame.expect = "commaOrEnd";
                } else {
                    // Strings can appear as values; for arrays this is always value
                    if (frame.expect === "valueOrEnd") {
                        frame.expect = "commaOrEnd";
                    }
                }
            } else if (frame && frame.type === "array") {
                if (frame.expect === "valueOrEnd") {
                    frame.expect = "commaOrEnd";
                }
            } else {
                // top-level string; allow
            }

            skipWs();
            continue;
        }

        if (ch === "{") {
            i += 1;
            stack.push({
                type: "object",
                keys: new Set(),
                expect: "keyOrEnd",
                lastKey: null
            });
            skipWs();
            continue;
        }

        if (ch === "}") {
            i += 1;
            const top = stack.pop();
            if (!top || top.type !== "object") error("Mismatched '}'");
            // Closing object counts as completing a value in parent
            const parent = expectFrame();
            if (parent) {
                if (parent.type === "object" && parent.expect === "value") {
                    parent.expect = "commaOrEnd";
                } else if (parent.type === "array" && parent.expect === "valueOrEnd") {
                    parent.expect = "commaOrEnd";
                }
            }
            skipWs();
            continue;
        }

        if (ch === "[") {
            i += 1;
            stack.push({
                type: "array",
                expect: "valueOrEnd"
            });
            skipWs();
            continue;
        }

        if (ch === "]") {
            i += 1;
            const top = stack.pop();
            if (!top || top.type !== "array") error("Mismatched ']'");
            const parent = expectFrame();
            if (parent) {
                if (parent.type === "object" && parent.expect === "value") {
                    parent.expect = "commaOrEnd";
                } else if (parent.type === "array" && parent.expect === "valueOrEnd") {
                    parent.expect = "commaOrEnd";
                }
            }
            skipWs();
            continue;
        }

        if (ch === ":") {
            if (!frame || frame.type !== "object" || frame.expect !== "colon") {
                error("Unexpected ':'");
            }
            i += 1;
            frame.expect = "value";
            skipWs();
            continue;
        }

        if (ch === ",") {
            if (!frame) error("Unexpected ',' at top-level");
            if (frame.type === "object") {
                if (frame.expect !== "commaOrEnd") error("Unexpected ',' in object");
                frame.expect = "keyOrEnd";
            } else {
                if (frame.expect !== "commaOrEnd") error("Unexpected ',' in array");
                frame.expect = "valueOrEnd";
            }
            i += 1;
            skipWs();
            continue;
        }

        if (isWhitespace(ch)) {
            skipWs();
            continue;
        }

        // literals (numbers / true / false / null)
        if (!frame) {
            // top-level literal allowed
            readLiteral();
            skipWs();
            continue;
        }

        if (frame.type === "object") {
            if (frame.expect === "value") {
                readLiteral();
                frame.expect = "commaOrEnd";
                skipWs();
                continue;
            }
            if (frame.expect === "keyOrEnd") {
                error("Object keys must be strings");
            }
            error("Unexpected token in object");
        } else {
            if (frame.expect === "valueOrEnd") {
                readLiteral();
                frame.expect = "commaOrEnd";
                skipWs();
                continue;
            }
            error("Unexpected token in array");
        }
    }

    if (stack.length !== 0) {
        throw new Error("Unclosed object/array detected");
    }
}

function sortKeysDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep);
    }
    if (value && typeof value === "object") {
        const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
        const out = {};
        for (const k of keys) {
            out[k] = sortKeysDeep(value[k]);
        }
        return out;
    }
    return value;
}

function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (typeof a === "object") {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;

        // Key order irrelevant; compare sets
        aKeys.sort();
        bKeys.sort();
        for (let i = 0; i < aKeys.length; i += 1) {
            if (aKeys[i] !== bKeys[i]) return false;
        }
        for (const k of aKeys) {
            if (!deepEqual(a[k], b[k])) return false;
        }
        return true;
    }

    return false;
}

function sanitizeFile(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");

    // Guardrails before JSON.parse
    detectCommentsAndDuplicateKeys(raw);

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        throw new Error(`JSON.parse failed: ${e.message}`);
    }

    const sorted = sortKeysDeep(parsed);
    const canonical = JSON.stringify(sorted, null, 4) + "\n";

    // Round-trip equality check
    const reparsed = JSON.parse(canonical);
    if (!deepEqual(sorted, reparsed)) {
        throw new Error("Round-trip deep-equality check failed (refusing to write)");
    }

    const changed = raw !== canonical;
    return { changed, canonical };
}

function main() {
    const absDir = path.resolve(process.cwd(), ROOT_DIR);
    if (!fs.existsSync(absDir)) {
        console.error(`Directory not found: ${absDir}`);
        process.exit(2);
    }

    const files = walk(absDir);
    let changedCount = 0;
    let okCount = 0;

    for (const f of files) {
        try {
            const { changed, canonical } = sanitizeFile(f);
            okCount += 1;

            if (changed) {
                changedCount += 1;
                if (WRITE) {
                    fs.writeFileSync(f, canonical, "utf8");
                    process.stdout.write(`WROTE  ${path.relative(process.cwd(), f)}\n`);
                } else {
                    process.stdout.write(`WOULD  ${path.relative(process.cwd(), f)}\n`);
                }
            } else {
                process.stdout.write(`OK     ${path.relative(process.cwd(), f)}\n`);
            }
        } catch (e) {
            process.stderr.write(`FAIL   ${path.relative(process.cwd(), f)}\n`);
            process.stderr.write(`       ${e.message}\n`);
            process.exitCode = 1;
        }
    }

    process.stdout.write(
        `\nFiles: ${files.length} | OK: ${okCount} | Changed: ${changedCount} | Mode: ${WRITE ? "write" : "check"}\n`
    );

    if (process.exitCode) {
        process.stdout.write("One or more files failed. Fix failures and re-run.\n");
    }
}

main();
