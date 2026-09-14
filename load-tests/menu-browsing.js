import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:3000";
const menus = ["mora", "khesht", "nava", "district"];

export const options = {
  scenarios: {
    cached_menu_browsing: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { target: 50, duration: "30s" },
        { target: 200, duration: "1m" },
        { target: 50, duration: "30s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
};

export default function browseMenu() {
  const slug = menus[Math.floor(Math.random() * menus.length)];
  const response = http.get(`${baseUrl}/menus/${slug}?lang=en`, {
    tags: { surface: "public-menu" },
  });
  check(response, {
    "menu responds 200": (res) => res.status === 200,
    "menu contains Foryxo branding": (res) => res.body.includes("Foryxo Menu"),
  });
  sleep(Math.random() * 2 + 0.5);
}
