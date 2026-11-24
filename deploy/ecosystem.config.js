/**
 * PM2 process file for Rate Wise
 *
 * Usage (from the project root on Web01 / Web02):
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save
 *   pm2 startup   # follow the printed command to enable reboot persistence
 */

module.exports = {
  apps: [
    {
      name: "rate-wise",
      script: "server.js",
      cwd: __dirname + "/..",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
