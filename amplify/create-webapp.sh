#!/bin/bash

# if region not provided as an argument, attempt to set the region
region="$1"
if [ -z "$region" ]; then
    region=$(aws ec2 describe-availability-zones --output text --query 'AvailabilityZones[0].[RegionName]')
fi

# if not able to set the region, exit
if [ -z "$region" ]; then
    echo "Please provide the AWS region as an argument."
    exit 1
fi

# Script to run Amplify setup scripts sequentially
echo "Starting Amplify setup process..."

# Check if the scripts exist and are executable
if [ ! -x "./create-amplify-project.sh" ]; then
    echo "Error: create-amplify-project.sh not found or not executable"
    exit 1
fi

if [ ! -x "./create-amplify-app.sh" ]; then
    echo "Error: create-amplify-app.sh not found or not executable"
    exit 1
fi

# Run the first script
echo "Running create-amplify-project.sh..."
./create-amplify-project.sh "$region"
if [ $? -ne 0 ]; then
    echo "Error: create-amplify-project.sh failed"
    exit 1
fi

# Run the second script
echo "Running create-amplify-app.sh..."
./create-amplify-app.sh
if [ $? -ne 0 ]; then
    echo "Error: create-amplify-app.sh failed"
    exit 1
fi

echo "Amplify setup completed successfully!"
