echo "Create S3 bucket to upload Lambda code"
s3_bucket_stack_name="idp-lambda-s3-bucket-stack"
response=$(aws cloudformation create-stack \
--stack-name $s3_bucket_stack_name \
--capabilities CAPABILITY_IAM \
--template-body file://$s3_bucket_stack_name.yml)
aws cloudformation wait stack-create-complete --stack-name $s3_bucket_stack_name
IDP_LAMBDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpLambdaBucket`].OutputValue' --output text)
echo 'export IDP_LAMBDA_BUCKET_NAME="'$IDP_LAMBDA_BUCKET_NAME'"' >> ~/.bashrc
echo "S3 bucket name created: $IDP_LAMBDA_BUCKET_NAME"
source ~/.bashrc