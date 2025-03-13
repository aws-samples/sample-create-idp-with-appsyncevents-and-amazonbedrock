appsync_events_stack_name="idp-appsync-stack"

APPSYNC_API=$(aws cloudformation describe-stacks --stack-name "$appsync_events_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`AppSyncEventsApiId`].OutputValue' --output text)
APPSYNC_API_URL=$(aws cloudformation describe-stacks --stack-name "$appsync_events_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`AppSyncEventsApiHttpUrl`].OutputValue' --output text)
APPSYNC_API_URL=$(echo $APPSYNC_API_URL | sed 's/https:\/\///g')

# Retrieve S3 bucket for Lambda zip package
s3_lambdacode_bucket_stack_name="idp-lambda-s3-bucket-stack"
IDP_LAMBDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_lambdacode_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpLambdaBucket`].OutputValue' --output text)

# Upload Lambda zip package in S3 bucket
aws s3 cp "./lambda/$LAMBDA_PACKAGE_NAME" s3://$IDP_LAMBDA_BUCKET_NAME

# Retrieve S3 bucket for IDP documents
s3_idp_bucket_stack_name="idp-s3-bucket-stack"
IDP_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_idp_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpDocBucket`].OutputValue' --output text)

idp_state_machine_stack_name="idp-state-machine-stack"
aws cloudformation create-stack --stack-name "$idp_state_machine_stack_name" --capabilities "CAPABILITY_IAM" --template-body file://idp-state-machine-stack.yml --parameters ParameterKey=BedrockLambdaS3Bucket,ParameterValue=$IDP_LAMBDA_BUCKET_NAME ParameterKey=BedrockLambdaS3Key,ParameterValue=$LAMBDA_PACKAGE_NAME ParameterKey=IdpS3Bucket,ParameterValue=$IDP_BUCKET_NAME ParameterKey=AppSyncApi,ParameterValue=$APPSYNC_API ParameterKey=AppSyncApiUrl,ParameterValue=$APPSYNC_API_URL
aws cloudformation wait stack-create-complete --stack-name "$idp_state_machine_stack_name"
