#!/bin/bash

# Define Amplify variables
AMPLIFY_PROJECT="amplify-idp"
AMPLIFY_PROJECT_PACKAGE="$AMPLIFY_PROJECT.zip"

# Retrieve S3 bucket to upload Amplify zip package
s3_amplifyapp_bucket_stack_name="idp-amplifyapp-s3-bucket-stack"
AMPLIFY_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_amplifyapp_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3AmplifyAppBucket`].OutputValue' --output text)

# Retrieve App Id and branch name
AMPLIFY_APP_ID=$(aws amplify list-apps --query 'apps[?name==`amplify-idp-app`].appId' | jq -r '.[0]')
AMPLIFY_BRANCH_NAME="staging"

# Package Amplify app
npm run build

# Uplaod Amplify app package
(cd dist; \
zip -r "$AMPLIFY_PROJECT_PACKAGE" .; \
aws s3 cp "$AMPLIFY_PROJECT_PACKAGE" s3://$AMPLIFY_BUCKET_NAME \
)

# Deploy Amplify app
aws amplify start-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "$AMPLIFY_BRANCH_NAME" --source-url "s3://$AMPLIFY_BUCKET_NAME/$AMPLIFY_PROJECT_PACKAGE"

# Echo Amplify App URL
AMPLIFY_APP_DOMAIN=$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query "app.defaultDomain" --output text)
echo "Amplify URL: https://$AMPLIFY_BRANCH_NAME.$AMPLIFY_APP_DOMAIN"