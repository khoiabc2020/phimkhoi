import { get, getBaseUrl, parsePathsFromEnv, pickPath } from "./lib.js";

export const options = {
  scenarios: {
    ramp_users: {
      executor: "ramping-vus",
      startVUs: 2,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 15 },
        { duration: "2m", target: 30 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2500", "p(99)<5000"],
  },
};

export default function () {
  const base = getBaseUrl();
  const paths = parsePathsFromEnv();
  const path = pickPath(paths);
  get(`${base}${path}`);
}

