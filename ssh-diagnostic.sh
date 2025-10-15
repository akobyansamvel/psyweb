#!/bin/bash

# 🔍 SSH Diagnostic Script for psytest.su
# This script helps diagnose SSH connection issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="194.58.114.58"
SERVER_USER="root"  # Change this to your SSH user

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

# Check if SSH key exists
check_ssh_key() {
    log "Checking SSH key..."
    if [ -f ~/.ssh/id_rsa ]; then
        success "SSH private key found"
        ls -la ~/.ssh/id_rsa
    else
        error "SSH private key not found at ~/.ssh/id_rsa"
        exit 1
    fi
    
    if [ -f ~/.ssh/id_rsa.pub ]; then
        success "SSH public key found"
        echo "Public key:"
        cat ~/.ssh/id_rsa.pub
    else
        warning "SSH public key not found at ~/.ssh/id_rsa.pub"
    fi
}

# Test network connectivity
test_network() {
    log "Testing network connectivity..."
    
    # Ping test
    echo "Ping test:"
    ping -c 3 $SERVER_HOST || warning "Ping failed"
    
    # Port test
    echo "Port 22 test:"
    nc -zv $SERVER_HOST 22 || error "Port 22 not accessible"
    
    # Telnet test
    echo "Telnet test:"
    timeout 10 telnet $SERVER_HOST 22 || warning "Telnet test failed"
}

# Test SSH connection with different options
test_ssh_connection() {
    log "Testing SSH connection with different options..."
    
    # Test 1: Basic connection
    echo "Test 1: Basic SSH connection"
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null $SERVER_USER@$SERVER_HOST "echo 'Basic connection successful'" || warning "Basic connection failed"
    
    # Test 2: With verbose output
    echo "Test 2: SSH with verbose output"
    ssh -vvv -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null $SERVER_USER@$SERVER_HOST "echo 'Verbose connection successful'" || warning "Verbose connection failed"
    
    # Test 3: With different authentication methods
    echo "Test 3: SSH with specific authentication"
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o PreferredAuthentications=publickey -o PubkeyAuthentication=yes -o PasswordAuthentication=no $SERVER_USER@$SERVER_HOST "echo 'Auth-specific connection successful'" || warning "Auth-specific connection failed"
    
    # Test 4: With keep-alive
    echo "Test 4: SSH with keep-alive"
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o ServerAliveInterval=10 -o ServerAliveCountMax=3 -o TCPKeepAlive=yes $SERVER_USER@$SERVER_HOST "echo 'Keep-alive connection successful'" || warning "Keep-alive connection failed"
}

# Check SSH server configuration
check_ssh_server() {
    log "Checking SSH server configuration..."
    
    # Try to get SSH server version
    echo "SSH server version:"
    timeout 10 nc $SERVER_HOST 22 < /dev/null || warning "Could not get SSH server info"
    
    # Try to get SSH server banner
    echo "SSH server banner:"
    timeout 10 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o BatchMode=yes $SERVER_USER@$SERVER_HOST "echo 'Banner test'" 2>&1 | head -5 || warning "Could not get SSH server banner"
}

# Test with different SSH clients
test_ssh_clients() {
    log "Testing different SSH clients..."
    
    # Test with ssh command
    echo "Testing with ssh command:"
    which ssh && ssh -V || warning "ssh command not found"
    
    # Test with different SSH options
    echo "Testing with different SSH options:"
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o AddressFamily=inet $SERVER_USER@$SERVER_HOST "echo 'IPv4 connection successful'" || warning "IPv4 connection failed"
    
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o AddressFamily=inet6 $SERVER_USER@$SERVER_HOST "echo 'IPv6 connection successful'" || warning "IPv6 connection failed"
}

# Generate SSH config
generate_ssh_config() {
    log "Generating SSH config file..."
    
    cat > ~/.ssh/config << EOF
Host $SERVER_HOST
    HostName $SERVER_HOST
    User $SERVER_USER
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    GlobalKnownHostsFile /dev/null
    ConnectTimeout 30
    ServerAliveInterval 10
    ServerAliveCountMax 3
    TCPKeepAlive yes
    AddressFamily inet
    PreferredAuthentications publickey
    PubkeyAuthentication yes
    PasswordAuthentication no
    BatchMode yes
    IdentitiesOnly yes
    IdentityFile ~/.ssh/id_rsa
EOF
    
    success "SSH config generated"
    echo "SSH config content:"
    cat ~/.ssh/config
}

# Test with generated config
test_with_config() {
    log "Testing SSH connection with generated config..."
    
    ssh $SERVER_HOST "echo 'SSH connection with config successful'" || warning "SSH connection with config failed"
}

# Main diagnostic function
main() {
    log "Starting SSH diagnostic for $SERVER_USER@$SERVER_HOST..."
    
    check_ssh_key
    test_network
    check_ssh_server
    test_ssh_clients
    generate_ssh_config
    test_with_config
    test_ssh_connection
    
    log "SSH diagnostic completed!"
    echo ""
    echo "If all tests failed, check:"
    echo "1. SSH key is properly added to server's ~/.ssh/authorized_keys"
    echo "2. SSH service is running on server: sudo systemctl status ssh"
    echo "3. Firewall allows SSH connections: sudo ufw status"
    echo "4. Server is accessible from your network"
    echo "5. SSH user has proper permissions"
}

# Run main function
main "$@"
