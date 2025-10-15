# 🐳 Docker Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Images Not Pulling

**Problem**: Docker containers fail to start because images can't be pulled from GitHub Container Registry.

**Symptoms**:
- Error: `Error response from daemon: pull access denied`
- Error: `Error response from daemon: unauthorized`
- Containers show "Image not found" status

**Solutions**:

#### A. Authentication Issues
```bash
# Check if you're logged in to GitHub Container Registry
docker login ghcr.io

# If not logged in, authenticate with your GitHub token
echo "your_github_token" | docker login ghcr.io -u your_username --password-stdin
```

#### B. Token Permissions
Make sure your GitHub token has the following permissions:
- `read:packages` - to pull images
- `write:packages` - to push images (for CI/CD)

#### C. Image Availability
```bash
# Check if images exist in the registry
docker pull ghcr.io/your_username/psyweb-backend:latest
docker pull ghcr.io/your_username/psyweb-frontend:latest
```

### 2. Container Startup Failures

**Problem**: Containers start but immediately stop or fail to run properly.

**Symptoms**:
- Containers show "Exited" status
- Error logs in `docker-compose logs`

**Solutions**:

#### A. Check Container Logs
```bash
# Check logs for all services
docker-compose -f docker-compose.prod.yml logs

# Check logs for specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs nginx
```

#### B. Check Container Status
```bash
# See detailed container status
docker-compose -f docker-compose.prod.yml ps

# See all containers (including stopped ones)
docker ps -a
```

#### C. Common Backend Issues
```bash
# Check if Django settings are correct
docker-compose -f docker-compose.prod.yml exec backend python manage.py check

# Check database migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 3. Network Connectivity Issues

**Problem**: Services can't communicate with each other or external services.

**Symptoms**:
- Frontend can't reach backend API
- Nginx can't proxy requests
- Database connection errors

**Solutions**:

#### A. Check Network Configuration
```bash
# List Docker networks
docker network ls

# Inspect the network
docker network inspect psyweb-network
```

#### B. Test Internal Connectivity
```bash
# Test backend connectivity from frontend container
docker-compose -f docker-compose.prod.yml exec frontend curl http://backend:8000/api/

# Test frontend connectivity from nginx container
docker-compose -f docker-compose.prod.yml exec nginx curl http://frontend:3000/
```

### 4. Port Conflicts

**Problem**: Ports are already in use by other services.

**Symptoms**:
- Error: `bind: address already in use`
- Services fail to start

**Solutions**:

#### A. Check Port Usage
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8000
```

#### B. Stop Conflicting Services
```bash
# Stop services using the ports
sudo systemctl stop nginx  # if nginx is running on host
sudo systemctl stop apache2  # if apache is running
```

#### C. Change Ports in docker-compose.prod.yml
```yaml
services:
  nginx:
    ports:
      - "8080:80"  # Use port 8080 instead of 80
```

### 5. Volume Mount Issues

**Problem**: Static files or media files not accessible.

**Symptoms**:
- Static files return 404
- Media files not loading
- Permission denied errors

**Solutions**:

#### A. Check Volume Mounts
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect psyweb_backend_static
```

#### B. Fix Permissions
```bash
# Fix ownership of mounted volumes
sudo chown -R 1000:1000 /opt/psyweb/staticfiles
sudo chown -R 1000:1000 /opt/psyweb/media
```

### 6. Memory and Resource Issues

**Problem**: Containers run out of memory or resources.

**Symptoms**:
- Containers killed by OOM killer
- Slow performance
- Out of memory errors

**Solutions**:

#### A. Check Resource Usage
```bash
# Check container resource usage
docker stats

# Check system resources
free -h
df -h
```

#### B. Optimize Container Resources
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 7. GitHub Actions Workflow Issues

**Problem**: CI/CD pipeline fails during deployment.

**Solutions**:

#### A. Check Secrets
Make sure these secrets are set in your GitHub repository:
- `SERVER_HOST` - Your server IP address
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key
- `GITHUB_TOKEN` - GitHub token with package permissions

#### B. Check SSH Connection
```bash
# Test SSH connection manually
ssh -i ~/.ssh/your_key user@your_server "echo 'SSH works'"
```

#### C. Check Docker on Server
```bash
# SSH into server and check Docker
ssh user@your_server "docker --version && docker-compose --version"
```

## Debugging Commands

### Quick Health Check
```bash
# Check all container status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=50

# Check resource usage
docker stats --no-stream
```

### Full Reset
```bash
# Stop and remove all containers
docker-compose -f docker-compose.prod.yml down

# Remove all images
docker rmi $(docker images -q)

# Remove all volumes
docker volume prune -f

# Pull fresh images and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Image Pull
```bash
# Login to registry
echo "your_token" | docker login ghcr.io -u your_username --password-stdin

# Pull images manually
docker pull ghcr.io/your_username/psyweb-backend:latest
docker pull ghcr.io/your_username/psyweb-frontend:latest

# Tag images for local use
docker tag ghcr.io/your_username/psyweb-backend:latest psyweb-backend:latest
docker tag ghcr.io/your_username/psyweb-frontend:latest psyweb-frontend:latest
```

## Monitoring and Maintenance

### Regular Health Checks
```bash
# Create a health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "=== Docker Health Check ==="
echo "Date: $(date)"
echo ""

echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Resource Usage:"
docker stats --no-stream

echo ""
echo "Recent Logs:"
docker-compose -f docker-compose.prod.yml logs --tail=10
EOF

chmod +x health-check.sh
```

### Log Rotation
```bash
# Set up log rotation for Docker
sudo tee /etc/logrotate.d/docker << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
```

## Getting Help

If you're still having issues:

1. **Check the logs**: Always start with `docker-compose logs`
2. **Verify configuration**: Check your `docker-compose.prod.yml` file
3. **Test connectivity**: Use `curl` or `wget` to test endpoints
4. **Check resources**: Ensure your server has enough memory and disk space
5. **Review permissions**: Make sure Docker has proper permissions

For additional help, check the Docker documentation or create an issue in your repository.
