# Dockerize Laravel Backend for Render

This plan outlines the steps to containerize your Laravel application so it can be deployed seamlessly to Render.

## Goal Description

To create a robust Docker image for the Laravel backend using an official PHP-Apache image, optimized for production, and to configure it for deployment on Render. Since Render assigns a dynamic port via the `PORT` environment variable, the Apache configuration will be adapted to listen on this port. We will also include a `render.yaml` blueprint file for infrastructure-as-code deployment on Render.

## Proposed Changes

We will create the following new files in the project root:

### [NEW] [Dockerfile](file:///c:/projects/FlowOffice-Backend/Dockerfile)
A multi-stage Dockerfile that:
1. **Node Stage**: Installs NPM dependencies and runs the Vite build (compiles CSS/JS assets).
2. **PHP/Apache Stage**: 
   - Uses `php:8.2-apache` as the base image.
   - Installs necessary system libraries and PHP extensions (including `pdo_pgsql` for Supabase).
   - Enables Apache `mod_rewrite`.
   - Configures Apache to use `public/` as the document root and listen on the `$PORT` environment variable.
   - Installs Composer and PHP dependencies (`--no-dev --optimize-autoloader`).
   - Copies built assets from the Node stage.
   - Sets correct directory permissions for `storage` and `bootstrap/cache`.
   - Sets the entrypoint to a custom `start.sh` script.

### [NEW] [.dockerignore](file:///c:/projects/FlowOffice-Backend/.dockerignore)
To prevent copying unnecessary files (like `vendor`, `node_modules`, `.env`, `.git`) into the Docker image, reducing image size and build time.

### [NEW] [start.sh](file:///c:/projects/FlowOffice-Backend/start.sh)
A script that will run when the container starts. It will:
- Cache Laravel configurations, routes, and views for production performance.
- Start the Apache web server in the foreground.

### [NEW] [render.yaml](file:///c:/projects/FlowOffice-Backend/render.yaml)
A Render Blueprint configuration file that defines:
- A Web Service using the Docker environment.
- The `preDeployCommand` to automatically run database migrations (`php artisan migrate --force`) before new code goes live.
- Essential environment variables mapping (like `APP_KEY`, `DB_CONNECTION`, etc.).

## Open Questions
- Do you have any specific PHP extensions you need other than the standard Laravel ones (pdo_pgsql, gd, zip, bcmath, mbstring, exif, pcntl)?
- Are you planning to use a standard `.env` on Render's dashboard for your secrets, or do you want me to configure a specific environment variables list in the `render.yaml`?

## Verification Plan

### Automated Tests
- I will run `docker build -t laravel-render .` locally (if Docker is available) or ensure the Dockerfile syntax is perfectly correct.
- I will verify the Apache configurations and the shell script syntaxes.

### Manual Verification
- You can push the code to your repository and deploy it via the Render Dashboard using the `render.yaml` or by selecting the repository and choosing the Docker runtime.
- We will verify that the app boots correctly and that Supabase database connections work.
