/**
 * Google Drive backup/restore for Warframe Tracker progress packs.
 *
 * HOW IT WORKS
 * ─────────────
 * This app uses Google's "token model" — no backend server, no redirect URLs.
 * A pop-up asks the user to sign in and grant permission once per session.
 * The access token is kept in memory only (never stored to disk).
 *
 * SCOPE: drive.file
 * The app requests the narrowest possible scope. It can only read and write
 * files that IT created. It cannot see anything else in the user's Drive.
 *
 * SETUP
 * ──────
 * Set VITE_GOOGLE_CLIENT_ID in your .env file.
 * See .env.example for instructions.
 */

const GDRIVE_FILE_NAME     = "wf-tracker-progress.json";
const FILE_ID_KEY          = "wft_gdrive_file_id";
const LAST_SYNC_KEY        = "wft_gdrive_last_sync";
const CONNECTED_FLAG_KEY   = "wft_gdrive_connected";
const GDRIVE_SCOPE         = "https://www.googleapis.com/auth/drive.file";
const GIS_SRC          = "https://accounts.google.com/gsi/client";
const DRIVE_API        = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

// ── In-memory token (GIS token model — never persisted) ──────────────────────

let _token: { access_token: string; expires_at: number } | null = null;

function tokenValid(): boolean {
    return !!_token && Date.now() < _token.expires_at - 60_000;
}

// ── Config check ──────────────────────────────────────────────────────────────

export function getClientId(): string {
    // Vite replaces import.meta.env.* at build time
    return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? "";
}

export function isConfigured(): boolean {
    return getClientId().length > 0;
}

export function isConnected(): boolean {
    return tokenValid();
}

// ── GIS script loader (lazy, singleton) ───────────────────────────────────────

let _scriptPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
    if (_scriptPromise) return _scriptPromise;

    _scriptPromise = new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src     = GIS_SRC;
        el.async   = true;
        el.onload  = () => resolve();
        el.onerror = () => reject(new Error("Failed to load Google Identity Services. Check your network connection."));
        document.head.appendChild(el);
    });
    return _scriptPromise;
}

// ── Token acquisition ─────────────────────────────────────────────────────────

function acquireToken(prompt: "" | "consent"): Promise<string> {
    return new Promise((resolve, reject) => {
        const g = (window as any).google?.accounts?.oauth2;
        if (!g) { reject(new Error("Google Identity Services not loaded.")); return; }

        const client = g.initTokenClient({
            client_id: getClientId(),
            scope: GDRIVE_SCOPE,
            callback: (resp: any) => {
                if (resp.error) {
                    reject(new Error(resp.error_description ?? resp.error));
                    return;
                }
                _token = {
                    access_token: resp.access_token,
                    expires_at: Date.now() + Number(resp.expires_in) * 1000,
                };
                resolve(resp.access_token);
            },
            error_callback: (err: any) => {
                reject(new Error(err?.message ?? "Authorization was cancelled."));
            },
        });
        client.requestAccessToken({ prompt });
    });
}

async function getToken(): Promise<string> {
    if (tokenValid()) return _token!.access_token;
    await loadGis();
    return acquireToken("");
}

// ── Public auth actions ───────────────────────────────────────────────────────

/** Show the Google sign-in / consent popup. Call this from a user gesture. */
export async function connect(): Promise<void> {
    await loadGis();
    await acquireToken("consent");
    localStorage.setItem(CONNECTED_FLAG_KEY, "1");
}

/** Revoke the in-memory token and clear stored file references. */
export async function disconnect(): Promise<void> {
    const g = (window as any).google?.accounts?.oauth2;
    if (g && _token) g.revoke(_token.access_token, () => {});
    _token = null;
    localStorage.removeItem(FILE_ID_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    localStorage.removeItem(CONNECTED_FLAG_KEY);
}

/** True if the user has previously connected (persists across page loads). */
export function wasConnected(): boolean {
    return localStorage.getItem(CONNECTED_FLAG_KEY) === "1";
}

/**
 * Check whether there is already a valid in-memory token without triggering
 * any popup. The GIS token model does not support silent refresh — every new
 * token requires a user gesture. Call this to check state only.
 */
export async function tryAutoConnect(): Promise<boolean> {
    return tokenValid();
}

// ── Drive helpers ─────────────────────────────────────────────────────────────

function getStoredFileId(): string | null {
    return localStorage.getItem(FILE_ID_KEY);
}

async function findFile(token: string): Promise<string | null> {
    const q = encodeURIComponent(`name='${GDRIVE_FILE_NAME}' and not trashed`);
    const r = await fetch(`${DRIVE_API}/files?q=${q}&spaces=drive&fields=files(id)`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const data = await r.json() as { files?: { id: string }[] };
    return data.files?.[0]?.id ?? null;
}

function makeMultipart(json: string): FormData {
    const meta = JSON.stringify({ name: GDRIVE_FILE_NAME, mimeType: "application/json" });
    const form = new FormData();
    form.append("metadata", new Blob([meta], { type: "application/json" }));
    form.append("file",     new Blob([json],  { type: "application/json" }));
    return form;
}

// ── Public Drive actions ──────────────────────────────────────────────────────

// Drive v3 API returns `id`, not `fileId`
type DriveFileResult = { id: string; modifiedTime: string };
export type SaveResult = { id: string; modifiedTime: string };

/**
 * Save the progress pack JSON to Google Drive.
 * Creates the file on first call; updates it on subsequent calls.
 */
export async function saveToGoogleDrive(json: string): Promise<SaveResult> {
    const token  = await getToken();
    let   fileId = getStoredFileId() ?? await findFile(token);

    if (fileId) {
        // Try to update existing file
        const r = await fetch(
            `${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=multipart&fields=id,modifiedTime`,
            { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: makeMultipart(json) },
        );
        if (r.ok) {
            const d = await r.json() as DriveFileResult;
            localStorage.setItem(FILE_ID_KEY, d.id);
            localStorage.setItem(LAST_SYNC_KEY, d.modifiedTime);
            return d;
        }
        // File was deleted on Drive — fall through to create
        localStorage.removeItem(FILE_ID_KEY);
        fileId = null;
    }

    // Create new file
    const r = await fetch(
        `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,modifiedTime`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: makeMultipart(json) },
    );
    if (!r.ok) {
        const msg = await r.text().catch(() => String(r.status));
        throw new Error(`Google Drive upload failed: ${msg}`);
    }
    const d = await r.json() as DriveFileResult;
    localStorage.setItem(FILE_ID_KEY, d.id);
    localStorage.setItem(LAST_SYNC_KEY, d.modifiedTime);
    return d;
}

/** Download the progress pack JSON from Google Drive. */
export async function restoreFromGoogleDrive(): Promise<string> {
    const token  = await getToken();
    const fileId = getStoredFileId() ?? await findFile(token);
    if (!fileId) throw new Error("No backup file found in your Google Drive.");
    localStorage.setItem(FILE_ID_KEY, fileId);

    const r = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
        const msg = await r.text().catch(() => String(r.status));
        throw new Error(`Google Drive download failed: ${msg}`);
    }
    return r.text();
}

/** ISO string of the last successful save, or null. */
export function getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
}
