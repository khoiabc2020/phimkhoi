module.exports = {
  apps: [
    {
      name: "phimkhoi",
      cwd: "./.next/standalone",
      script: "server.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NODE_OPTIONS: "--max_old_space_size=2048",
      },
      max_memory_restart: "1500M",
    },
  ],
};
