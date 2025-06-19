#!/bin/bash

# Script to deploy the AppSync API with Lambda authorizer
# This script calls package-lambda-auth.sh and create-appsync.sh in sequence

echo "Starting deployment process..."

# Step 1: Package the Lambda authorizer
echo "Step 1: Packaging Lambda authorizer..."
cd $CURRENT_DIR/appsync/lambda-auth; source ../package-lambda-auth.sh
if [ $? -ne 0 ]; then
    echo "Error: Failed to package Lambda authorizer. Exiting."
    exit 1
fi
echo "Lambda authorizer packaged successfully."

# Step 2: Create the AppSync API
echo "Step 2: Creating AppSync API..."
cd $CURRENT_DIR/appsync/; ./create-appsync.sh
if [ $? -ne 0 ]; then
    echo "Error: Failed to create AppSync API. Exiting."
    exit 1
fi
echo "AppSync API created successfully."

echo "Deployment completed successfully!"
