import http from "k6/http";
import { check, sleep } from "k6";

export function pickPath(paths) {
  if (!paths || paths.length === 0) return "/";
  const idx = Math.floor(Math.random() * paths.length);
  return paths[idx];
}

export function parsePathsFromEnv() {
  const raw = (__ENV.PATHS || "").trim();
  if (!raw) return ["/", "/tim-kiem", "/api/mobile/home"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith("/") ? p : `/${p}`));
}

export function getBaseUrl() {
  return (__ENV.BASE_URL || "https://www.khoiphim.io.vn").replace(/\/+$/, "");
}

export function get(url) {
  const res = http.get(url, {
    redirects: 5,
    tags: { name: "GET" },
    headers: {
      "User-Agent": "k6-loadtest (controlled)",
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
  });

  check(res, {
    "status is 2xx/3xx": (r) => r.status >= 200 && r.status < 400,
  });

  sleep(Math.random() * 0.5);
  return res;
}

