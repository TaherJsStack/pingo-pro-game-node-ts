/**
 * PM2 production example.
 *
 * Required environment must be provided by the VPS shell, service manager, or PM2
 * deploy step: MONGODB_URL, SECRET, APP_BASE_URL, CORS_ORIGINS, UPLOAD_PATH.
 * Run only one PM2 process with ENABLE_BILLING_CRON=true to avoid duplicate
 * subscription billing jobs.
 */
module.exports = {
  apps: [
    {
      name: 'pingo-pro-game-api',
      script: 'dist/server.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '4001',
        PAYMENTS_ENABLED: 'false',
        ENABLE_BILLING_CRON: 'false',
        SWAGGER_ENABLED: 'false',
      },
    },
  ],
};
