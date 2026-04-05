module.exports = {
  apps: [{
    name: 'photography-pro',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 80',
    cwd: '/var/www/photography-pro',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/photography-pro-error.log',
    out_file: '/var/log/pm2/photography-pro-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
