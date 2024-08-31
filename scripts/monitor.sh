#!/bin/bash

# GreenLedger System Monitoring Script
# This script monitors system health, performance, and blockchain connectivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="/var/log/greenledger/monitor.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@greenledger.io}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"
API_URL="${API_URL:-http://localhost:5000}"
DATABASE_URL="${DATABASE_URL:-sqlite:./data/greenledger.db}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=5000  # milliseconds

echo_log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[$timestamp] INFO: $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] WARN: $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}"
            ;;
        "DEBUG")
            echo -e "${BLUE}[$timestamp] DEBUG: $message${NC}"
            ;;
    esac
    
    # Log to file if available
    if [[ -w "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] $level: $message" >> "$LOG_FILE"
    fi
}

check_system_resources() {
    echo_log "INFO" "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        echo_log "WARN" "High CPU usage: ${cpu_usage}%"
        send_alert "High CPU Usage" "CPU usage is at ${cpu_usage}%, threshold: ${CPU_THRESHOLD}%"
    else
        echo_log "INFO" "CPU usage: ${cpu_usage}% (OK)"
    fi
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used_memory * 100 / $total_memory" | bc)
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        echo_log "WARN" "High memory usage: ${memory_usage}%"
        send_alert "High Memory Usage" "Memory usage is at ${memory_usage}%, threshold: ${MEMORY_THRESHOLD}%"
    else
        echo_log "INFO" "Memory usage: ${memory_usage}% (OK)"
    fi
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        echo_log "WARN" "High disk usage: ${disk_usage}%"
        send_alert "High Disk Usage" "Disk usage is at ${disk_usage}%, threshold: ${DISK_THRESHOLD}%"
    else
        echo_log "INFO" "Disk usage: ${disk_usage}% (OK)"
    fi
}

check_application_health() {
    echo_log "INFO" "Checking application health..."
    
    # Frontend health check
    local frontend_response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null "$HEALTH_CHECK_URL" || echo "000:0")
    local frontend_status=$(echo $frontend_response | cut -d':' -f1)
    local frontend_time=$(echo $frontend_response | cut -d':' -f2)
    local frontend_time_ms=$(echo "$frontend_time * 1000" | bc)
    
    if [ "$frontend_status" = "200" ]; then
        if (( $(echo "$frontend_time_ms > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            echo_log "WARN" "Frontend responding slowly: ${frontend_time_ms}ms"
        else
            echo_log "INFO" "Frontend health: OK (${frontend_time_ms}ms)"
        fi
    else
        echo_log "ERROR" "Frontend health check failed: HTTP $frontend_status"
        send_alert "Frontend Down" "Frontend health check failed with HTTP status: $frontend_status"
    fi
    
    # Backend API health check
    local api_response=$(curl -s -w "%{http_code}:%{time_total}" -o /dev/null "$API_URL/health" || echo "000:0")
    local api_status=$(echo $api_response | cut -d':' -f1)
    local api_time=$(echo $api_response | cut -d':' -f2)
    local api_time_ms=$(echo "$api_time * 1000" | bc)
    
    if [ "$api_status" = "200" ]; then
        if (( $(echo "$api_time_ms > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            echo_log "WARN" "API responding slowly: ${api_time_ms}ms"
        else
            echo_log "INFO" "API health: OK (${api_time_ms}ms)"
        fi
    else
        echo_log "ERROR" "API health check failed: HTTP $api_status"
        send_alert "API Down" "API health check failed with HTTP status: $api_status"
    fi
}

check_database_connectivity() {
    echo_log "INFO" "Checking database connectivity..."
    
    # Simple database connection test
    if command -v sqlite3 &> /dev/null && [[ $DATABASE_URL == sqlite:* ]]; then
        local db_path=$(echo $DATABASE_URL | sed 's/sqlite://')
        if [ -f "$db_path" ]; then
            local db_test=$(sqlite3 "$db_path" "SELECT 1;" 2>&1)
            if [ "$db_test" = "1" ]; then
                echo_log "INFO" "Database connectivity: OK"
            else
                echo_log "ERROR" "Database connectivity failed: $db_test"
                send_alert "Database Error" "Database connectivity test failed: $db_test"
            fi
        else
            echo_log "ERROR" "Database file not found: $db_path"
            send_alert "Database Error" "Database file not found: $db_path"
        fi
    else
        echo_log "INFO" "Database connectivity check skipped (not SQLite or sqlite3 not available)"
    fi
}

check_blockchain_connectivity() {
    echo_log "INFO" "Checking blockchain connectivity..."
    
    # Check Ethereum mainnet connectivity
    local eth_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "https://mainnet.infura.io/v3/${INFURA_API_KEY}" || echo "")
    
    if [[ $eth_response == *"result"* ]]; then
        local block_number=$(echo $eth_response | jq -r '.result' | xargs printf "%d\n")
        echo_log "INFO" "Ethereum connectivity: OK (Block: $block_number)"
    else
        echo_log "ERROR" "Ethereum connectivity failed"
        send_alert "Blockchain Error" "Failed to connect to Ethereum mainnet"
    fi
    
    # Check Polygon connectivity
    local polygon_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}" || echo "")
    
    if [[ $polygon_response == *"result"* ]]; then
        local polygon_block=$(echo $polygon_response | jq -r '.result' | xargs printf "%d\n")
        echo_log "INFO" "Polygon connectivity: OK (Block: $polygon_block)"
    else
        echo_log "WARN" "Polygon connectivity failed"
    fi
}

check_ssl_certificates() {
    echo_log "INFO" "Checking SSL certificates..."
    
    local domains=("greenledger.io" "api.greenledger.io")
    
    for domain in "${domains[@]}"; do
        if command -v openssl &> /dev/null; then
            local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            if [ $? -eq 0 ]; then
                local expiry_date=$(echo "$cert_info" | grep notAfter | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry_date" +%s)
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ $days_until_expiry -lt 30 ]; then
                    echo_log "WARN" "SSL certificate for $domain expires in $days_until_expiry days"
                    send_alert "SSL Certificate Expiring" "SSL certificate for $domain expires in $days_until_expiry days"
                else
                    echo_log "INFO" "SSL certificate for $domain: OK ($days_until_expiry days remaining)"
                fi
            else
                echo_log "ERROR" "Failed to check SSL certificate for $domain"
            fi
        else
            echo_log "INFO" "SSL certificate check skipped (openssl not available)"
            break
        fi
    done
}

check_log_files() {
    echo_log "INFO" "Checking log files..."
    
    local log_directories=("/var/log/greenledger" "./logs" "./backend/logs")
    
    for log_dir in "${log_directories[@]}"; do
        if [ -d "$log_dir" ]; then
            # Check for error patterns in recent logs
            local error_count=$(find "$log_dir" -name "*.log" -mtime -1 -exec grep -i "error\|critical\|fatal" {} \; | wc -l)
            if [ "$error_count" -gt 10 ]; then
                echo_log "WARN" "High error count in logs: $error_count errors in last 24 hours"
                send_alert "High Error Rate" "Found $error_count errors in logs within the last 24 hours"
            else
                echo_log "INFO" "Log error count: $error_count (OK)"
            fi
            
            # Check log file sizes
            find "$log_dir" -name "*.log" -size +100M -exec basename {} \; | while read large_log; do
                echo_log "WARN" "Large log file detected: $large_log (>100MB)"
            done
        fi
    done
}

send_alert() {
    local subject=$1
    local message=$2
    
    # Send email alert if configured
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "GreenLedger Alert: $subject" "$ALERT_EMAIL"
        echo_log "INFO" "Alert sent via email: $subject"
    fi
    
    # Send Slack alert if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        local payload=$(cat <<EOF
{
    "text": "🚨 GreenLedger Alert: $subject",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Timestamp",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Server",
                    "value": "$(hostname)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
)
        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" > /dev/null
        echo_log "INFO" "Alert sent via Slack: $subject"
    fi
}

generate_report() {
    echo_log "INFO" "Generating monitoring report..."
    
    local report_file="/tmp/greenledger_monitor_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
GreenLedger System Monitoring Report
Generated: $(date)
Server: $(hostname)

=== System Information ===
Uptime: $(uptime -p)
Load Average: $(uptime | awk -F'load average:' '{print $2}')
Disk Usage: $(df -h / | awk 'NR==2 {print $5}') of $(df -h / | awk 'NR==2 {print $2}')
Memory Usage: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')

=== Process Information ===
$(ps aux --sort=-%cpu | head -10)

=== Network Connections ===
$(netstat -tuln | grep -E ':3000|:5000')

=== Recent Errors ===
$(tail -50 "$LOG_FILE" 2>/dev/null | grep -i error || echo "No recent errors found")

EOF
    
    echo_log "INFO" "Report generated: $report_file"
    
    # Send report via email if configured
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        mail -s "GreenLedger Daily Report - $(date +%Y-%m-%d)" "$ALERT_EMAIL" < "$report_file"
        echo_log "INFO" "Report sent via email"
    fi
}

main() {
    echo_log "INFO" "Starting GreenLedger system monitoring..."
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    # Run all checks
    check_system_resources
    check_application_health
    check_database_connectivity
    check_blockchain_connectivity
    check_ssl_certificates
    check_log_files
    
    # Generate report if requested
    if [ "$1" = "--report" ]; then
        generate_report
    fi
    
    echo_log "INFO" "Monitoring check completed"
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        cat << EOF
GreenLedger System Monitoring Script

Usage: $0 [OPTIONS]

Options:
    --report    Generate and send a detailed report
    --help      Show this help message

Environment Variables:
    ALERT_EMAIL             Email address for alerts
    HEALTH_CHECK_URL        Frontend health check URL
    API_URL                 Backend API base URL
    DATABASE_URL            Database connection URL
    SLACK_WEBHOOK           Slack webhook URL for alerts
    INFURA_API_KEY          Infura API key for blockchain checks

Examples:
    $0                      Run basic monitoring checks
    $0 --report             Run checks and generate report
    
    # Run with custom settings
    ALERT_EMAIL=admin@example.com $0 --report
EOF
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
