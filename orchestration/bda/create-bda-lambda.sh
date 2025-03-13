bda_eb_notif_stack_name="bda-eb-notif-stack"

# Retrieve S3 bucket for Lambda zip package
s3_lambdacode_bucket_stack_name="idp-lambda-s3-bucket-stack"
IDP_LAMBDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_lambdacode_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpLambdaBucket`].OutputValue' --output text)

# Retrieve AppSync details
appsync_events_stack_name="idp-appsync-stack"
APPSYNC_API=$(aws cloudformation describe-stacks --stack-name "$appsync_events_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`AppSyncEventsApiId`].OutputValue' --output text)
APPSYNC_API_URL=$(aws cloudformation describe-stacks --stack-name "$appsync_events_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`AppSyncEventsApiHttpUrl`].OutputValue' --output text)
APPSYNC_API_URL=$(echo $APPSYNC_API_URL | sed 's/https:\/\///g')

# Retrieve S3 bucket for IDP documents
s3_idp_bucket_stack_name="idp-s3-bucket-stack"
IDP_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_idp_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpDocBucket`].OutputValue' --output text)

# Retrieve BDA S3 bucket
#s3_bda_bucket_stack_name="bda-s3-bucket-stack"
#BDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bda_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpBdaBucket`].OutputValue' --output text)
BDA_BUCKET_NAME="$1"
aws cloudformation create-stack --stack-name "$bda_eb_notif_stack_name" --capabilities "CAPABILITY_IAM" --template-body file://bda-stack.yml --parameters ParameterKey=BdaS3Bucket,ParameterValue=$BDA_BUCKET_NAME ParameterKey=IdpS3Bucket,ParameterValue=$IDP_BUCKET_NAME ParameterKey=BedrockLambdaS3Bucket,ParameterValue=$IDP_LAMBDA_BUCKET_NAME ParameterKey=BedrockLambdaS3Key,ParameterValue=$BDA_LAMBDA_PACKAGE_NAME ParameterKey=AppSyncApi,ParameterValue=$APPSYNC_API ParameterKey=AppSyncApiUrl,ParameterValue=$APPSYNC_API_URL
aws cloudformation wait stack-create-complete --stack-name "$bda_eb_notif_stack_name"