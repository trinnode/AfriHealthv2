#!/bin/bash

# =============================================================================
# Foundry Contract Deployment Script
# =============================================================================
# This script automates Foundry contract deployment with support for:
# - Interactive deployment script path selection
# - Network selection (localhost/testnet/mainnet)  
# - Automatic Anvil spawning for localhost deployments
# - Diamond proxy standard (EIP-2535) detection and handling
# - RPC URL and private key management
# - Input validation and error handling
# =============================================================================

set -e  # Exit on any error

# Color codes for better terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
ANVIL_PID=""
DEPLOYMENT_SCRIPT=""
NETWORK=""
RPC_URL=""
PRIVATE_KEY=""
ANVIL_PORT="8545"

# =============================================================================
# Utility Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}    Foundry Contract Deployment Script${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# =============================================================================
# Input Validation Functions
# =============================================================================

validate_file_exists() {
    local file_path="$1"
    if [[ ! -f "$file_path" ]]; then
        print_error "File not found: $file_path"
        return 1
    fi
    return 0
}

validate_rpc_url() {
    local url="$1"
    if [[ ! "$url" =~ ^https?:// ]]; then
        print_error "Invalid RPC URL format. Must start with http:// or https://"
        return 1
    fi
    return 0
}

validate_private_key() {
    local key="$1"
    if [[ ${#key} -ne 64 ]] && [[ ${#key} -ne 66 ]]; then
        print_error "Invalid private key length. Must be 64 characters (without 0x) or 66 characters (with 0x)"
        return 1
    fi
    
    # Remove 0x prefix if present
    key="${key#0x}"
    
    # Check if it's a valid hex string
    if [[ ! "$key" =~ ^[0-9a-fA-F]{64}$ ]]; then
        print_error "Invalid private key format. Must be a valid hexadecimal string"
        return 1
    fi
    
    return 0
}

# =============================================================================
# Network Detection and Setup Functions
# =============================================================================

check_anvil_running() {
    if lsof -Pi :$ANVIL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

spawn_anvil() {
    print_step "Starting Anvil local blockchain..."
    
    # Kill any existing process on the port
    if check_anvil_running; then
        print_warning "Port $ANVIL_PORT is already in use. Attempting to free it..."
        local existing_pid=$(lsof -t -i:$ANVIL_PORT)
        if [[ -n "$existing_pid" ]]; then
            kill -9 $existing_pid 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Start Anvil in the background
    anvil --host 0.0.0.0 --port $ANVIL_PORT > anvil.log 2>&1 &
    ANVIL_PID=$!
    
    # Wait for Anvil to start
    local retries=0
    local max_retries=10
    
    while ! check_anvil_running && [ $retries -lt $max_retries ]; do
        sleep 1
        retries=$((retries + 1))
        echo -n "."
    done
    
    if check_anvil_running; then
        print_success "Anvil started successfully on port $ANVIL_PORT (PID: $ANVIL_PID)"
        
        # Set default Anvil values
        RPC_URL="http://127.0.0.1:$ANVIL_PORT"
        PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # Default Anvil key
        
        print_info "Using default Anvil account:"
        print_info "Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        print_info "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        print_info "Balance: 10000 ETH"
        echo ""
    else
        print_error "Failed to start Anvil after $max_retries attempts"
        return 1
    fi
}

cleanup_anvil() {
    if [[ -n "$ANVIL_PID" ]]; then
        print_step "Stopping Anvil (PID: $ANVIL_PID)..."
        kill $ANVIL_PID 2>/dev/null || true
        wait $ANVIL_PID 2>/dev/null || true
        print_success "Anvil stopped"
        
        # Clean up log file
        rm -f anvil.log
    fi
}

# =============================================================================
# Diamond Proxy Detection Functions
# =============================================================================

is_diamond_deployment() {
    local script_path="$1"
    local script_content
    
    if ! script_content=$(cat "$script_path" 2>/dev/null); then
        return 1
    fi
    
    # Check for Diamond-specific patterns
    if echo "$script_content" | grep -qi -E "(diamond|facet|diamondcut|eip.?2535|multi.?facet)" 2>/dev/null; then
        return 0
    fi
    
    return 1
}

print_diamond_info() {
    echo ""
    print_info "Diamond Proxy (EIP-2535) deployment detected!"
    print_info "The script will handle Diamond-specific deployment patterns including:"
    echo "  • Diamond proxy contract deployment"
    echo "  • Facet contract deployments"  
    echo "  • DiamondCut operations for facet registration"
    echo "  • Proper initialization handling"
    echo ""
}

# =============================================================================
# User Input Functions
# =============================================================================

select_deployment_script() {
    print_step "Looking for deployment scripts..."
    
    # Find all .s.sol files in script directory
    local script_files=()
    if [[ -d "script" ]]; then
        while IFS= read -r -d '' file; do
            script_files+=("$file")
        done < <(find script -name "*.s.sol" -type f -print0)
    fi
    
    if [[ ${#script_files[@]} -eq 0 ]]; then
        print_warning "No deployment scripts found in ./script directory"
        echo ""
        read -p "Please enter the relative path to your deployment script: " DEPLOYMENT_SCRIPT
        
        if ! validate_file_exists "$DEPLOYMENT_SCRIPT"; then
            return 1
        fi
    elif [[ ${#script_files[@]} -eq 1 ]]; then
        DEPLOYMENT_SCRIPT="${script_files[0]}"
        print_success "Found deployment script: $DEPLOYMENT_SCRIPT"
    else
        echo ""
        print_info "Multiple deployment scripts found:"
        echo ""
        
        PS3="Select a deployment script (1-${#script_files[@]}): "
        select script_choice in "${script_files[@]}"; do
            if [[ -n "$script_choice" ]]; then
                DEPLOYMENT_SCRIPT="$script_choice"
                print_success "Selected: $DEPLOYMENT_SCRIPT"
                break
            else
                print_error "Invalid selection. Please try again."
            fi
        done
    fi
    
    # Check if it's a Diamond deployment
    if is_diamond_deployment "$DEPLOYMENT_SCRIPT"; then
        print_diamond_info
    fi
    
    return 0
}

select_network() {
    echo ""
    print_step "Select deployment network:"
    echo ""
    
    local networks=("Localhost (Anvil)" "Testnet" "Mainnet")
    PS3="Choose network (1-3): "
    
    select network_choice in "${networks[@]}"; do
        case $network_choice in
            "Localhost (Anvil)")
                NETWORK="localhost"
                print_success "Selected: Localhost (Anvil)"
                break
                ;;
            "Testnet")
                NETWORK="testnet"
                print_success "Selected: Testnet"
                break
                ;;
            "Mainnet")
                NETWORK="mainnet"
                print_success "Selected: Mainnet"
                break
                ;;
            *)
                print_error "Invalid selection. Please choose 1, 2, or 3."
                ;;
        esac
    done
}

get_rpc_url() {
    echo ""
    while true; do
        read -p "Enter RPC URL: " RPC_URL
        
        if validate_rpc_url "$RPC_URL"; then
            print_success "RPC URL validated: $RPC_URL"
            break
        fi
    done
}

get_private_key() {
    echo ""
    print_warning "Private key input required"
    print_info "For security, consider using Foundry's encrypted keystore instead:"
    print_info "cast wallet import <account-name> --interactive"
    echo ""
    
    while true; do
        read -s -p "Enter private key (will be hidden): " PRIVATE_KEY
        echo ""
        
        if validate_private_key "$PRIVATE_KEY"; then
            # Ensure 0x prefix
            if [[ ! "$PRIVATE_KEY" =~ ^0x ]]; then
                PRIVATE_KEY="0x$PRIVATE_KEY"
            fi
            print_success "Private key validated"
            break
        fi
    done
}

# =============================================================================
# Deployment Functions
# =============================================================================

build_forge_command() {
    local cmd="forge script \"$DEPLOYMENT_SCRIPT\""
    
    # Add RPC URL
    cmd="$cmd --rpc-url \"$RPC_URL\""
    
    # Add private key
    cmd="$cmd --private-key \"$PRIVATE_KEY\""
    
    # Add broadcast flag
    cmd="$cmd --broadcast"
    
    # Add verification for non-localhost deployments
    if [[ "$NETWORK" != "localhost" ]]; then
        cmd="$cmd --verify"
    fi
    
    # Add verbosity for better debugging
    cmd="$cmd -vvvv"
    
    echo "$cmd"
}

execute_deployment() {
    local forge_cmd
    forge_cmd=$(build_forge_command)
    
    echo ""
    print_step "Preparing deployment..."
    print_info "Network: $NETWORK"
    print_info "RPC URL: $RPC_URL"
    print_info "Script: $DEPLOYMENT_SCRIPT"
    echo ""
    
    # Build contracts first
    print_step "Building contracts..."
    if ! forge build; then
        print_error "Contract compilation failed"
        return 1
    fi
    print_success "Contracts compiled successfully"
    
    echo ""
    print_step "Executing deployment..."
    print_info "Command: $forge_cmd"
    echo ""
    
    # Execute the deployment
    if eval "$forge_cmd"; then
        print_success "Deployment completed successfully!"
        
        # Show broadcast information
        if [[ -d "broadcast" ]]; then
            echo ""
            print_info "Deployment details saved in broadcast/ directory"
            local latest_run=$(find broadcast -name "run-*.json" | sort | tail -1)
            if [[ -n "$latest_run" ]]; then
                print_info "Latest deployment info: $latest_run"
            fi
        fi
        
        return 0
    else
        print_error "Deployment failed"
        return 1
    fi
}

# =============================================================================
# Main Script Logic
# =============================================================================

show_usage() {
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --script PATH    Deployment script path (relative)"
    echo "  -n, --network NAME   Network (localhost/testnet/mainnet)"
    echo "  -r, --rpc-url URL    RPC endpoint URL"
    echo "  -k, --private-key KEY Private key for deployment"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Interactive mode"
    echo "  $0 -s script/Deploy.s.sol -n localhost"
    echo "  $0 -s script/Deploy.s.sol -n testnet -r https://sepolia.infura.io/v3/KEY"
    echo ""
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--script)
                DEPLOYMENT_SCRIPT="$2"
                shift 2
                ;;
            -n|--network)
                NETWORK="$2"
                shift 2
                ;;
            -r|--rpc-url)
                RPC_URL="$2"
                shift 2
                ;;
            -k|--private-key)
                PRIVATE_KEY="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

validate_arguments() {
    # Validate deployment script if provided
    if [[ -n "$DEPLOYMENT_SCRIPT" ]] && ! validate_file_exists "$DEPLOYMENT_SCRIPT"; then
        return 1
    fi
    
    # Validate network if provided
    if [[ -n "$NETWORK" ]] && [[ ! "$NETWORK" =~ ^(localhost|testnet|mainnet)$ ]]; then
        print_error "Invalid network. Must be: localhost, testnet, or mainnet"
        return 1
    fi
    
    # Validate RPC URL if provided
    if [[ -n "$RPC_URL" ]] && ! validate_rpc_url "$RPC_URL"; then
        return 1
    fi
    
    # Validate private key if provided
    if [[ -n "$PRIVATE_KEY" ]] && ! validate_private_key "$PRIVATE_KEY"; then
        return 1
    fi
    
    return 0
}

setup_trap() {
    trap 'cleanup_anvil; exit 1' INT TERM EXIT
}

main() {
    print_header
    
    # Set up signal handlers
    setup_trap
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Validate provided arguments
    if ! validate_arguments; then
        exit 1
    fi
    
    # Check if Foundry is installed
    if ! command -v forge >/dev/null 2>&1; then
        print_error "Foundry not found. Please install Foundry first:"
        print_info "curl -L https://foundry.paradigm.xyz | bash"
        print_info "foundryup"
        exit 1
    fi
    
    # Interactive setup if not all arguments provided
    if [[ -z "$DEPLOYMENT_SCRIPT" ]]; then
        if ! select_deployment_script; then
            exit 1
        fi
    else
        print_success "Using deployment script: $DEPLOYMENT_SCRIPT"
        
        # Check if it's a Diamond deployment
        if is_diamond_deployment "$DEPLOYMENT_SCRIPT"; then
            print_diamond_info
        fi
    fi
    
    if [[ -z "$NETWORK" ]]; then
        select_network
    else
        print_success "Using network: $NETWORK"
    fi
    
    # Setup network-specific configuration
    case $NETWORK in
        "localhost")
            if ! spawn_anvil; then
                exit 1
            fi
            ;;
        "testnet"|"mainnet")
            if [[ -z "$RPC_URL" ]]; then
                get_rpc_url
            else
                print_success "Using RPC URL: $RPC_URL"
            fi
            
            if [[ -z "$PRIVATE_KEY" ]]; then
                get_private_key
            else
                print_success "Private key loaded"
            fi
            ;;
    esac
    
    # Execute deployment
    if execute_deployment; then
        echo ""
        print_success "🎉 Deployment completed successfully!"
        
        if [[ "$NETWORK" == "localhost" ]]; then
            echo ""
            print_info "Anvil is still running. Press Ctrl+C to stop it when you're done testing."
            
            # Keep Anvil running
            trap 'cleanup_anvil; exit 0' INT TERM
            echo ""
            print_step "Keeping Anvil running... Press Ctrl+C to stop"
            
            # Wait for interrupt
            while true; do
                sleep 1
            done
        fi
    else
        exit 1
    fi
}

# =============================================================================
# Script Execution
# =============================================================================

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi