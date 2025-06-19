#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Step 1: Package the main Lambda function
echo "Step 1: Packaging main Lambda function..."
cd $CURRENT_DIR/orchestration/lambda; source ../package-lambda.sh
echo "Main Lambda function packaging complete."

# Step 2: Package the BDA Lambda function
echo "Step 2: Packaging BDA Lambda function..."
cd $CURRENT_DIR/orchestration/bda/lambda; source ../package-bda-lambda.sh
echo "BDA Lambda function packaging complete."

# Step 3: Create the BDA Lambda function
echo "Step 3: Creating BDA Lambda function..."
cd $CURRENT_DIR/orchestration/bda; ./create-bda-lambda.sh
echo "BDA Lambda function creation complete."

# Step 4: Create the state machine
echo "Step 4: Creating state machine..."
cd $CURRENT_DIR/orchestration/; ./create-state-machine.sh
echo "State machine creation complete."

echo "Deployment process completed successfully!"
