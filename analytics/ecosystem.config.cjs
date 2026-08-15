// PM2 ecosystem config for the polofio analytics server.
// Use instead of systemd if you manage processes with PM2:
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup   (so it restarts on boot)
// Env vars come from the system environment (or set -a; source .env; set +a).

module.exports = {
  apps: [
    {
      name: 'polofio-analytics',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
