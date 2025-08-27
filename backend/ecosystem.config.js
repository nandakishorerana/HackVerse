module.exports = {
  apps: [
    {
      name: 'deshi-sahayak-api',
      script: 'dist/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      
      // Restart configuration
      watch: false, // Don't watch files in production
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Logging configuration
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Ignore watch
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],
      
      // Environment-specific configurations
      node_args: '--max-old-space-size=1024'
    },
    
    // Worker processes for background tasks
    {
      name: 'deshi-sahayak-worker',
      script: 'dist/workers/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'background'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background'
      },
      
      // Worker-specific settings
      max_memory_restart: '300M',
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      
      // Logging
      log_file: 'logs/worker-combined.log',
      out_file: 'logs/worker-out.log',
      error_file: 'logs/worker-error.log',
      merge_logs: true
    },
    
    // Notification processor
    {
      name: 'deshi-sahayak-notifications',
      script: 'dist/workers/notification-processor.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'notifications'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'notifications'
      },
      
      // Notification-specific settings
      max_memory_restart: '200M',
      restart_delay: 4000,
      
      // Logging
      log_file: 'logs/notifications-combined.log',
      out_file: 'logs/notifications-out.log',
      error_file: 'logs/notifications-error.log'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/deshi-sahayak-hub.git',
      path: '/var/www/deshi-sahayak-hub',
      
      // Pre-deployment
      'pre-deploy-local': '',
      
      // Post-receive hooks
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      
      // Pre-setup
      'pre-setup': 'apt update && apt install nodejs npm -y'
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/deshi-sahayak-hub.git',
      path: '/var/www/deshi-sahayak-hub-staging',
      
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  },

  // Monitoring configuration
  monitoring: {
    http: true,
    https: false,
    port: 9615,
    refresh: 5000,
    
    // Custom metrics
    custom_probes: [
      {
        name: 'CPU usage',
        script: 'echo 1',
        geo: 'cpu'
      },
      {
        name: 'Realtime users',
        script: 'echo 42',
        geo: 'realtime'
      }
    ],
    
    // Network monitoring
    network: true,
    ports: true
  }
};
