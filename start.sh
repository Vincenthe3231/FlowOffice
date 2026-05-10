#!/bin/sh

# Exit on error
set -e

echo "Running optimizations..."

# Cache configuration, routes, and views
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting Apache..."

# Start Apache in the foreground
apache2-foreground
