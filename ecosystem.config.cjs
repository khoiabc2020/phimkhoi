module.exports = {
  apps: [
    {
      name: "phimkhoi",
      script: "./.next/standalone/server.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NODE_OPTIONS: "--max_old_space_size=2048", // Using 50% of 4GB for safety
      },
      max_memory_restart: "1.5G",
    },
  ],
};
