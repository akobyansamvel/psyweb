#!/bin/bash

# 🐳 Improved Docker Deployment Script for psytest.su
# This script handles Docker deployment with proper error handling and logging

set -e  # Exit on any error

# Configuration
REGISTRY="ghcr.io"
REPO_OWNER="akobyansamvel"  # Replace with your GitHub username
IMAGE_NAME="psyweb"
SERVER_HOST="194.58.114.58"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a non-root user with docker group access."
    fi
    
    # Check if user is in docker group
    if ! groups | grep -q docker; then
        error "User is not in docker group. Please add user to docker group or run with sudo."
        exit 1
    fi
}

# Check Docker installation
check_docker() {
    log "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed!"
        exit 1
    fi
    
    # Test Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running!"
        exit 1
    fi
    
    success "Docker is properly installed and running"
}

# Authenticate with GitHub Container Registry
authenticate_registry() {
    log "Authenticating with GitHub Container Registry..."
    
    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        error "GITHUB_TOKEN environment variable is not set!"
        error "Please set it with: export GITHUB_TOKEN=your_token"
        exit 1
    fi
    
    # Login to registry
    if echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$REPO_OWNER" --password-stdin; then
        success "Successfully authenticated with GitHub Container Registry"
    else
        error "Failed to authenticate with GitHub Container Registry"
        exit 1
    fi
}

# Pull Docker images
pull_images() {
    log "Pulling Docker images..."
    
    local backend_image="${REGISTRY}/${REPO_OWNER}/${IMAGE_NAME}-backend:latest"
    local frontend_image="${REGISTRY}/${REPO_OWNER}/${IMAGE_NAME}-frontend:latest"
    
    # Pull backend image
    log "Pulling backend image: $backend_image"
    if docker pull "$backend_image"; then
        success "Backend image pulled successfully"
    else
        error "Failed to pull backend image"
        exit 1
    fi
    
    # Pull frontend image
    log "Pulling frontend image: $frontend_image"
    if docker pull "$frontend_image"; then
        success "Frontend image pulled successfully"
    else
        error "Failed to pull frontend image"
        exit 1
    fi
}

# Stop existing containers
stop_containers() {
    log "Stopping existing containers..."
    
    if [ -f "docker-compose.prod.yml" ]; then
        if docker-compose -f docker-compose.prod.yml down; then
            success "Existing containers stopped"
        else
            warning "Some containers may not have stopped properly"
        fi
    else
        warning "docker-compose.prod.yml not found, skipping container stop"
    fi
}

# Clean up unused images
cleanup_images() {
    log "Cleaning up unused Docker images..."
    docker image prune -f
    success "Cleanup completed"
}

# Start containers
start_containers() {
    log "Starting containers..."
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "docker-compose.prod.yml not found!"
        exit 1
    fi
    
    if docker-compose -f docker-compose.prod.yml up -d; then
        success "Containers started successfully"
    else
        error "Failed to start containers"
        exit 1
    fi
}

# Wait for containers to be ready
wait_for_containers() {
    log "Waiting for containers to be ready..."
    sleep 15
    
    # Check container status
    log "Checking container status..."
    docker-compose -f docker-compose.prod.yml ps
}

# Check container health
check_health() {
    log "Checking container health..."
    
    # Check if containers are running
    local backend_status=$(docker-compose -f docker-compose.prod.yml ps -q backend)
    local frontend_status=$(docker-compose -f docker-compose.prod.yml ps -q frontend)
    local nginx_status=$(docker-compose -f docker-compose.prod.yml ps -q nginx)
    
    if [ -n "$backend_status" ] && docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "psyweb-backend-prod.*Up"; then
        success "Backend container is running"
    else
        error "Backend container is not running properly"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    if [ -n "$frontend_status" ] && docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "psyweb-frontend-prod.*Up"; then
        success "Frontend container is running"
    else
        error "Frontend container is not running properly"
        docker-compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
    
    if [ -n "$nginx_status" ] && docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "psyweb-nginx-prod.*Up"; then
        success "Nginx container is running"
    else
        error "Nginx container is not running properly"
        docker-compose -f docker-compose.prod.yml logs nginx
        exit 1
    fi
}

# Show deployment summary
show_summary() {
    log "Deployment Summary:"
    echo "=================="
    echo "🌐 Application URL: http://$SERVER_HOST"
    echo "🔗 Frontend: http://$SERVER_HOST:3000"
    echo "🔗 Backend API: http://$SERVER_HOST:8000"
    echo "🔗 Admin: http://$SERVER_HOST:8000/admin"
    echo ""
    echo "📊 Container Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "📋 Recent Logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=10
}

# Main deployment function
main() {
    log "Starting Docker deployment for psytest.su..."
    
    check_permissions
    check_docker
    authenticate_registry
    stop_containers
    cleanup_images
    pull_images
    start_containers
    wait_for_containers
    check_health
    show_summary
    
    success "🎉 Docker deployment completed successfully!"
}

# Run main function
main "$@"
