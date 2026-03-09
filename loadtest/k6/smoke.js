import { get, getBaseUrl, parsePathsFromEnv, pickPath } from "./lib.js";

export const options = {
  vus: 2,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const base = getBaseUrl();
  const paths = parsePathsFromEnv();
  const path = pickPath(paths);
  get(`${base}${path}`);
}

