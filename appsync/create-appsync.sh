# Retrieve S3 bucket for Lambda zip package
s3_lambdacode_bucket_stack_name="idp-lambda-s3-bucket-stack"
IDP_LAMBDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_lambdacode_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpLambdaBucket`].OutputValue' --output text)

# Upload Lambda zip package in S3 bucket
aws s3 cp "./lambda-auth/$LAMBDA_AUTH_PACKAGE_NAME" s3://$IDP_LAMBDA_BUCKET_NAME

# Create AppSync Events API
echo "Create AppSync Events API"
appsync_events_stack_name="idp-appsync-stack"
aws cloudformation create-stack \
--stack-name $appsync_events_stack_name \
--capabilities CAPABILITY_IAM \
--template-body file://$appsync_events_stack_name.yml \
--parameters ParameterKey=LambdaAuthS3Bucket,ParameterValue=$IDP_LAMBDA_BUCKET_NAME ParameterKey=LambdaAuthS3Key,ParameterValue=$LAMBDA_AUTH_PACKAGE_NAME
aws cloudformation wait stack-create-complete --stack-name $appsync_events_stack_name