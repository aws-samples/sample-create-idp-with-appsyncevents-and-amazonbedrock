echo "Create S3 bucket to upload Amplify app code"
s3_bucket_stack_name="idp-amplifyapp-s3-bucket-stack"
response=$(aws cloudformation create-stack \
--stack-name $s3_bucket_stack_name \
--capabilities CAPABILITY_IAM \
--template-body file://$s3_bucket_stack_name.yml)
aws cloudformation wait stack-create-complete --stack-name $s3_bucket_stack_name
AMPLIFY_APP_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3AmplifyAppBucket`].OutputValue' --output text)
echo 'export AMPLIFY_APP_BUCKET_NAME="'$AMPLIFY_APP_BUCKET_NAME'"' >> ~/.bashrc
echo "S3 bucket name created: $AMPLIFY_APP_BUCKET_NAME"
source ~/.bashrc