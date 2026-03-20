import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";

function getBuildId(): string {
    try {
        return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
            .toString()
            .trim();
    } catch {
        return "dev";
    }
}

function injectBuildId(buildId: string): Plugin {
    return {
        name: "inject-build-id",
        transformIndexHtml(html) {
            return html.replace(/__APP_BUILD_ID__/g, buildId);
        }
    };
}

const buildId = getBuildId();

export default defineConfig({
    base: "/Warframe-Progression-Tracker/",
    plugins: [
        injectBuildId(buildId),
        tailwindcss(),
        react()
    ],
    define: {
        __BUILD_ID__: JSON.stringify(buildId)
    },
    test: {
        globals: true,
        environment: "node",
    }
});
