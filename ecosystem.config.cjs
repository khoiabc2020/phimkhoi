module.exports = {
  apps: [
    {
      name: "phimkhoi",
      script: "npm",
      args: "start",
      exec_mode: "cluster",
      instances: "max",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NODE_OPTIONS: "--max_old_space_size=2048",
        NEXTAUTH_URL: "https://khoiphim.io.vn",
        NEXTAUTH_SECRET: "khoiphim-secret-key-123",
      },
      max_memory_restart: "512M",
    },
  ],
};

