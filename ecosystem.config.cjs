const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

module.exports = {
  apps: [
    {
      name: "phimkhoi",
      script: ".next/standalone/server.js",
      exec_mode: "cluster",
      instances: 1, // Only 1 instance for 2GB RAM VPS to avoid OOM
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NODE_OPTIONS: "--max_old_space_size=1024", // Max 1GB heap
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        MONGODB_URI: process.env.MONGODB_URI,
        TMDB_API_KEY: process.env.TMDB_API_KEY,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
        FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
      },
      max_memory_restart: "800M",
    },
  ],
};
