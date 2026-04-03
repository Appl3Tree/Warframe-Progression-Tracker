import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const INPUT = path.join(ROOT, "external/wiki/blueprintsDatabase.txt");
const OUTPUT = path.join(ROOT, "src/data/_generated/wiki-blueprints.auto.json");

type Token =
    | { type: "{" | "}" | "[" | "]" | "," | "=" }
    | { type: "identifier"; value: string }
    | { type: "string"; value: string }
    | { type: "number"; value: number }
    | { type: "boolean"; value: boolean }
    | { type: "nil" };

class Tokenizer {
    private index = 0;

    constructor(private readonly input: string) {}

    next(): Token | null {
        this.skipWhitespace();
        if (this.index >= this.input.length) return null;

        const ch = this.input[this.index];

        if (ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === "," || ch === "=") {
            this.index += 1;
            return { type: ch };
        }

        if (ch === "\"") {
            return { type: "string", value: this.readString() };
        }

        if (ch === "-" || this.isDigit(ch)) {
            return { type: "number", value: this.readNumber() };
        }

        if (this.isIdentifierStart(ch)) {
            const ident = this.readIdentifier();
            if (ident === "true") return { type: "boolean", value: true };
            if (ident === "false") return { type: "boolean", value: false };
            if (ident === "nil") return { type: "nil" };
            return { type: "identifier", value: ident };
        }

        throw new Error(`Unexpected character "${ch}" at offset ${this.index}`);
    }

    peek(): Token | null {
        const prev = this.index;
        const token = this.next();
        this.index = prev;
        return token;
    }

    private skipWhitespace(): void {
        while (this.index < this.input.length) {
            const ch = this.input[this.index];
            const next = this.input[this.index + 1];
            if (ch === "-" && next === "-") {
                this.index += 2;
                while (this.index < this.input.length) {
                    const commentCh = this.input[this.index];
                    if (commentCh === "\n" || commentCh === "\r") break;
                    this.index += 1;
                }
                continue;
            }
            if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
                this.index += 1;
                continue;
            }
            break;
        }
    }

    private readString(): string {
        let out = "";
        this.index += 1; // opening quote

        while (this.index < this.input.length) {
            const ch = this.input[this.index++];
            if (ch === "\"") return out;

            if (ch === "\\") {
                const esc = this.input[this.index++];
                if (esc === undefined) throw new Error("Unterminated escape sequence");

                switch (esc) {
                    case "\"": out += "\""; break;
                    case "\\": out += "\\"; break;
                    case "n": out += "\n"; break;
                    case "r": out += "\r"; break;
                    case "t": out += "\t"; break;
                    default: out += esc; break;
                }
                continue;
            }

            out += ch;
        }

        throw new Error("Unterminated string literal");
    }

    private readNumber(): number {
        const start = this.index;
        if (this.input[this.index] === "-") this.index += 1;
        while (this.index < this.input.length && this.isDigit(this.input[this.index])) this.index += 1;
        if (this.input[this.index] === ".") {
            this.index += 1;
            while (this.index < this.input.length && this.isDigit(this.input[this.index])) this.index += 1;
        }

        const raw = this.input.slice(start, this.index);
        const num = Number(raw);
        if (!Number.isFinite(num)) throw new Error(`Invalid number "${raw}"`);
        return num;
    }

    private readIdentifier(): string {
        const start = this.index;
        this.index += 1;
        while (this.index < this.input.length && this.isIdentifierPart(this.input[this.index])) this.index += 1;
        return this.input.slice(start, this.index);
    }

    private isDigit(ch: string): boolean {
        return ch >= "0" && ch <= "9";
    }

    private isIdentifierStart(ch: string): boolean {
        return /[A-Za-z_]/.test(ch);
    }

    private isIdentifierPart(ch: string): boolean {
        return /[A-Za-z0-9_]/.test(ch);
    }
}

class Parser {
    constructor(private readonly tokenizer: Tokenizer) {}

    parseRoot(): unknown {
        const first = this.tokenizer.next();
        if (!first || first.type !== "identifier" || first.value !== "return") {
            throw new Error("Expected leading `return`");
        }
        return this.parseValue();
    }

    private parseValue(): unknown {
        const token = this.tokenizer.next();
        if (!token) throw new Error("Unexpected end of input");

        switch (token.type) {
            case "{":
                return this.parseTable();
            case "string":
                return token.value;
            case "number":
                return token.value;
            case "boolean":
                return token.value;
            case "nil":
                return null;
            default:
                throw new Error(`Unexpected token ${token.type} while parsing value`);
        }
    }

    private parseTable(): unknown {
        const entries: Array<{ key?: string; value: unknown }> = [];

        while (true) {
            const next = this.tokenizer.peek();
            if (!next) throw new Error("Unexpected end of input inside table");
            if (next.type === "}") {
                this.tokenizer.next();
                break;
            }

            const entry = this.parseTableEntry();
            entries.push(entry);

            const sep = this.tokenizer.peek();
            if (sep?.type === ",") {
                this.tokenizer.next();
            }
        }

        const hasExplicitKeys = entries.some((entry) => entry.key !== undefined);
        if (!hasExplicitKeys) return entries.map((entry) => entry.value);

        const out: Record<string, unknown> = {};
        let arrayIndex = 1;
        for (const entry of entries) {
            if (entry.key !== undefined) out[entry.key] = entry.value;
            else {
                out[String(arrayIndex)] = entry.value;
                arrayIndex += 1;
            }
        }
        return out;
    }

    private parseTableEntry(): { key?: string; value: unknown } {
        const next = this.tokenizer.peek();
        if (!next) throw new Error("Unexpected end of input while parsing table entry");

        if (next.type === "[") {
            this.tokenizer.next();
            const keyToken = this.tokenizer.next();
            if (!keyToken || (keyToken.type !== "string" && keyToken.type !== "identifier" && keyToken.type !== "number")) {
                throw new Error("Expected bracket key");
            }
            this.expect("]");
            this.expect("=");
            return { key: String((keyToken as any).value ?? ""), value: this.parseValue() };
        }

        if (next.type === "identifier") {
            const ident = this.tokenizer.next() as Extract<Token, { type: "identifier" }>;
            if (this.tokenizer.peek()?.type === "=") {
                this.tokenizer.next();
                return { key: ident.value, value: this.parseValue() };
            }
            throw new Error(`Unexpected bare identifier "${ident.value}" in table`);
        }

        return { value: this.parseValue() };
    }

    private expect(type: Token["type"]): void {
        const token = this.tokenizer.next();
        if (!token || token.type !== type) {
            throw new Error(`Expected token ${type}`);
        }
    }
}

function normalizeBlueprintRecord(value: unknown): unknown {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;

    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(obj)) {
        if (key === "Parts" && raw && typeof raw === "object" && !Array.isArray(raw)) {
            const partEntries = Object.entries(raw)
                .filter(([partKey]) => /^\d+$/.test(partKey))
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([, partValue]) => normalizeBlueprintRecord(partValue));
            out[key] = partEntries;
            continue;
        }

        out[key] = normalizeBlueprintRecord(raw);
    }

    return out;
}

async function main(): Promise<void> {
    const raw = await readFile(INPUT, "utf8");
    const parsed = new Parser(new Tokenizer(raw)).parseRoot();
    const normalized = normalizeBlueprintRecord(parsed);

    await mkdir(path.dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, JSON.stringify(normalized, null, 2), "utf8");

    const blueprintCount =
        normalized && typeof normalized === "object" && !Array.isArray(normalized)
            ? Object.keys(((normalized as Record<string, unknown>).Blueprints as Record<string, unknown>) ?? {}).length
            : 0;

    console.log(`Converted wiki blueprint data: ${blueprintCount} blueprint records`);
    console.log(`Written to ${OUTPUT}`);
}

main().catch((error) => {
    console.error((error as Error).message);
    process.exit(1);
});
