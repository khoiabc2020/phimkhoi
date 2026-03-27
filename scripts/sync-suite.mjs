#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : args.has("--full") ? "full" : "fast";

const stepsByMode = {
    fast: [
        { label: "repair-media", file: "scripts/repair-media-integrity.mjs" },
        { label: "daily-sync", file: "scripts/daily-sync.mjs" },
        { label: "force-sync-slugs", file: "scripts/force-sync-slugs.mjs" },
        { label: "check-counts", file: "scripts/check-counts.mjs" },
    ],
    full: [
        { label: "repair-media", file: "scripts/repair-media-integrity.mjs" },
        { label: "daily-sync-full", file: "scripts/daily-sync.mjs", args: ["--full"] },
        { label: "force-sync-slugs", file: "scripts/force-sync-slugs.mjs" },
        { label: "check-counts", file: "scripts/check-counts.mjs" },
    ],
    repair: [
        { label: "repair-media", file: "scripts/repair-media-integrity.mjs" },
        { label: "check-counts", file: "scripts/check-counts.mjs" },
    ],
    audit: [{ label: "check-counts", file: "scripts/check-counts.mjs" }],
};

const steps = stepsByMode[mode];
if (!steps) {
    console.error(`Unsupported sync mode: ${mode}`);
    process.exit(1);
}

function runNodeScript(step) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const child = spawn(
            process.execPath,
            [path.join(rootDir, step.file), ...(step.args || [])],
            {
                cwd: rootDir,
                stdio: "inherit",
                env: process.env,
            }
        );

        child.on("error", reject);
        child.on("exit", (code) => {
            const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
            if (code === 0) {
                console.log(`[sync-suite] ${step.label} completed in ${elapsed}s`);
                resolve();
                return;
            }
            reject(new Error(`${step.label} exited with code ${code}`));
        });
    });
}

async function main() {
    console.log(`[sync-suite] starting mode=${mode}`);
    for (const step of steps) {
        console.log(`[sync-suite] running ${step.label}...`);
        await runNodeScript(step);
    }
    console.log(`[sync-suite] mode=${mode} completed successfully`);
}

main().catch((error) => {
    console.error("[sync-suite] failed:", error.message);
    process.exit(1);
});
