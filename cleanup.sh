#!/bin/bash

# if region not provided as an argument, exit
if [ -z "$1" ]; then
    echo "Please provide the AWS region as an argument."
    exit 1
fi

aws_region=$1

# Delete the stacks for the core resources
echo "Deleting the stacks with core resources..."

aws cloudformation delete-stack --stack-name bda-project-stack --region $aws_region
aws cloudformation wait stack-delete-complete --stack-name bda-project-stack --region $aws_region

aws cloudformation delete-stack --stack-name idp-state-machine-stack --region $aws_region
aws cloudformation wait stack-delete-complete --stack-name idp-state-machine-stack --region $aws_region

aws cloudformation delete-stack --stack-name bda-eb-notif-stack --region $aws_region
aws cloudformation wait stack-delete-complete --stack-name bda-eb-notif-stack --region $aws_region

aws cloudformation delete-stack --stack-name idp-appsync-stack --region $aws_region
aws cloudformation wait stack-delete-complete --stack-name idp-appsync-stack --region $aws_region

aws cloudformation delete-stack --stack-name idp-cognito-userpool-stack --region $aws_region
aws cloudformation wait stack-delete-complete --stack-name idp-cognito-userpool-stack --region $aws_region

echo "Deletion completed for stacks with core resources"

# Delete the AWS Amplify app

echo "Deleting the AWS Amplify app..."

AMPLIFY_APP_ID=$(aws amplify list-apps --query 'apps[?name==`amplify-idp-app`].appId' --region $aws_region | jq -r '.[0]')
aws amplify delete-app --app-id $AMPLIFY_APP_ID --region $aws_region

echo "Deletion completed for AWS Amplify app"

# Delete the S3 buckets

echo "Deleting the stacks with the S3 buckets..."

aws cloudformation delete-stack --stack-name idp-amplifyapp-s3-bucket-stack --region $aws_region
aws cloudformation delete-stack --stack-name bda-s3-bucket-stack --region $aws_region
aws cloudformation delete-stack --stack-name appsync-lambda-auth-s3-bucket-stack --region $aws_region
aws cloudformation delete-stack --stack-name idp-lambda-s3-bucket-stack --region $aws_region
aws cloudformation delete-stack --stack-name idp-s3-bucket-stack --region $aws_region

echo "Deletion completed for the stacks with the S3 buckets"
