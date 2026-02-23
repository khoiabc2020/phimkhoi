module.exports = {
  apps: [
    {
      name: "phimkhoi",
      cwd: ".next/standalone",
      script: "server.js",
      args: "--port 3000",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NODE_OPTIONS: "--max_old_space_size=2048",
      },
      max_memory_restart: "512M",
    },
  ],
};

