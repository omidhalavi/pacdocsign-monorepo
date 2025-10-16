#!/bin/bash
# test/scripts/run-all-tests.sh

echo "🚀 GCS Security Testing Suite"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️ $message${NC}"
            ;;
    esac
}

# Function to run tests with error handling
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo ""
    print_status "INFO" "Running $test_name..."
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval $test_command; then
        print_status "SUCCESS" "$test_name completed successfully"
        return 0
    else
        print_status "ERROR" "$test_name failed"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "test/package.json" ]; then
    print_status "ERROR" "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "test/node_modules" ]; then
    print_status "INFO" "Installing test dependencies..."
    cd test && npm install && cd ..
fi

# Phase 1: Pre-deployment tests
echo ""
print_status "INFO" "PHASE 1: Pre-deployment Tests"
echo "=================================="

run_test "Secret Manager Verification" "cd test && node scripts/verify-secrets.js"
SECRETS_RESULT=$?

run_test "File Access Verification" "cd test && node scripts/verify-file-access.js"
FILE_ACCESS_RESULT=$?

run_test "Pre-deployment Document Access Tests" "cd test && npm run test:file-access"
DOCUMENT_ACCESS_RESULT=$?

run_test "Pre-deployment Secret Manager Tests" "cd test && npm run test:security"
SECRET_MANAGER_RESULT=$?

# Phase 2: Post-deployment tests (simulated)
echo ""
print_status "INFO" "PHASE 2: Post-deployment Tests (Simulated)"
echo "=============================================="

run_test "New Authentication Tests" "cd test && npm run test:new-auth"
NEW_AUTH_RESULT=$?

run_test "API Endpoint Tests" "cd test && npm run test:api-endpoints"
API_ENDPOINTS_RESULT=$?

# Phase 3: Rollback verification tests
echo ""
print_status "INFO" "PHASE 3: Rollback Verification Tests"
echo "======================================="

run_test "Rollback Verification Tests" "cd test && npm run test:rollback"
ROLLBACK_RESULT=$?

# Summary
echo ""
print_status "INFO" "TEST SUMMARY"
echo "============"

TOTAL_TESTS=6
PASSED_TESTS=0

if [ $SECRETS_RESULT -eq 0 ]; then
    print_status "SUCCESS" "Secret Manager Verification: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "Secret Manager Verification: FAILED"
fi

if [ $FILE_ACCESS_RESULT -eq 0 ]; then
    print_status "SUCCESS" "File Access Verification: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "File Access Verification: FAILED"
fi

if [ $DOCUMENT_ACCESS_RESULT -eq 0 ]; then
    print_status "SUCCESS" "Document Access Tests: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "Document Access Tests: FAILED"
fi

if [ $SECRET_MANAGER_RESULT -eq 0 ]; then
    print_status "SUCCESS" "Secret Manager Tests: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "Secret Manager Tests: FAILED"
fi

if [ $NEW_AUTH_RESULT -eq 0 ]; then
    print_status "SUCCESS" "New Authentication Tests: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "New Authentication Tests: FAILED"
fi

if [ $ROLLBACK_RESULT -eq 0 ]; then
    print_status "SUCCESS" "Rollback Verification Tests: PASSED"
    ((PASSED_TESTS++))
else
    print_status "ERROR" "Rollback Verification Tests: FAILED"
fi

echo ""
echo "📊 Overall Results: $PASSED_TESTS/$TOTAL_TESTS tests passed"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_status "SUCCESS" "All tests passed! Ready for deployment."
    exit 0
elif [ $PASSED_TESTS -ge 4 ]; then
    print_status "WARNING" "Most tests passed. Review failed tests before deployment."
    exit 1
else
    print_status "ERROR" "Multiple tests failed. Do not deploy until issues are resolved."
    exit 1
fi
