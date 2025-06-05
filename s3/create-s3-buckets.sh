#!/bin/bash

echo "===== Creating S3 Buckets ====="

# Function to execute a script and check its status
execute_script() {
    local script_name=$1
    echo ""
    echo "Executing $script_name..."
    
    if [ -x "$script_name" ]; then
        ./$script_name
        if [ $? -eq 0 ]; then
            echo "✅ $script_name completed successfully"
        else
            echo "❌ $script_name failed with exit code $?"
        fi
    else
        echo "❌ Error: $script_name is not executable or doesn't exist"
        chmod +x "$script_name" 2>/dev/null && echo "Made $script_name executable, retrying..." && ./$script_name
    fi
    
    echo ""
}

# Create Amplify App S3 bucket
execute_script "create-amplifyapp-s3-bucket.sh"

# Create AppSync Auth Lambda S3 bucket
execute_script "create-appsync-authlambda-s3-bucket.sh"

# Create BDA S3 bucket
execute_script "create-bda-s3-bucket.sh"

# Create IDP S3 bucket
execute_script "create-idp-s3-bucket.sh"

# Create Lambda S3 bucket
execute_script "create-lambda-s3-bucket.sh"

echo "===== S3 bucket creation scripts have been executed ====="

# Display all created bucket names
echo ""
echo "===== Created S3 Buckets ====="
echo "AMPLIFY_APP_BUCKET_NAME: $AMPLIFY_APP_BUCKET_NAME"
echo "APPSYNC_AUTH_LAMBDA_BUCKET_NAME: $APPSYNC_AUTH_LAMBDA_BUCKET_NAME"
echo "BDA_BUCKET_NAME: $BDA_BUCKET_NAME"
echo "IDP_BUCKET_NAME: $IDP_BUCKET_NAME"
echo "LAMBDA_BUCKET_NAME: $LAMBDA_BUCKET_NAME"
