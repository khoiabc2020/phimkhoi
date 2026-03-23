module.exports = {
  apps: [
    {
      name: "phimkhoi",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NODE_OPTIONS: "--max_old_space_size=800", // Safe heap for 2GB VPS
        // PM2 will pick up other vars from .env.local automatically if we are careful,
        // but let's keep the explicit ones for now if needed.
      },
      max_memory_restart: "700M",
    },
  ],
};
