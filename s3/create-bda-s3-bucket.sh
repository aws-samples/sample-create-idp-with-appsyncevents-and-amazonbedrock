echo "Create S3 bucket to upload documents"
s3_bucket_stack_name="bda-s3-bucket-stack"
response=$(aws cloudformation create-stack \
--stack-name bda-s3-bucket-stack \
--capabilities CAPABILITY_IAM \
--template-body file://bda-s3-bucket-stack.yml)
aws cloudformation wait stack-create-complete --stack-name $s3_bucket_stack_name
BDA_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3KnowledgeBaseDocBucket`].OutputValue' --output text)
echo 'export BDA_BUCKET_NAME="'$BDA_BUCKET_NAME'"' >> ~/.bashrc
bash
echo "S3 bucket name created: $BDA_BUCKET_NAME"