echo "Create S3 bucket to upload documents"
s3_bucket_stack_name="idp-s3-bucket-stack"
response=$(aws cloudformation create-stack \
--stack-name idp-s3-bucket-stack \
--capabilities CAPABILITY_IAM \
--template-body file://idp-s3-bucket-stack.yml)
aws cloudformation wait stack-create-complete --stack-name $s3_bucket_stack_name
IDP_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpDocBucket`].OutputValue' --output text)
echo 'export IDP_BUCKET_NAME="'$IDP_BUCKET_NAME'"' >> ~/.bashrc
echo "S3 bucket name created: $IDP_BUCKET_NAME"
source ~/.bashrc