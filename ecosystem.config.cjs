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
      },
      max_memory_restart: "512M",
    },
  ],
};

