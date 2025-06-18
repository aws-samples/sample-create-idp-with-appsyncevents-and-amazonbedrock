echo "Create S3 bucket to upload Lambda Authorizer code"
s3_bucket_stack_name="appsync-lambda-auth-s3-bucket-stack"
response=$(aws cloudformation create-stack \
--stack-name $s3_bucket_stack_name \
--capabilities CAPABILITY_IAM \
--template-body file://idp-lambda-s3-bucket-stack.yml)
aws cloudformation wait stack-create-complete --stack-name $s3_bucket_stack_name
APPSYNC_LAMBDA_AUTH_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpLambdaBucket`].OutputValue' --output text)
echo "S3 bucket name created: $APPSYNC_LAMBDA_AUTH_BUCKET_NAME"