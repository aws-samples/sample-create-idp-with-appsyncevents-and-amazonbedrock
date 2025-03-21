# Retrieve S3 bucket for IDP documents
s3_idp_bucket_stack_name="idp-s3-bucket-stack"
IDP_BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$s3_idp_bucket_stack_name" --query 'Stacks[0].Outputs[?OutputKey==`S3IdpDocBucket`].OutputValue' --output text)

idp_userpool_stack_name="idp-cognito-userpool-stack"
aws cloudformation create-stack --stack-name $idp_userpool_stack_name \
--template-body file://$idp_userpool_stack_name.yml \
--parameters ParameterKey=IdpBucketName,ParameterValue=$IDP_BUCKET_NAME \
--capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete --stack-name $idp_userpool_stack_name