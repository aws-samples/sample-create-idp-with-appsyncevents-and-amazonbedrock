touch src/custom.configuration.json

# Define stack names
appSyncStackName="idp-appsync-stack"
documentBucketStackName="idp-s3-bucket-stack"
userPoolStackName="idp-cognito-userpool-stack"

# Retrieve stack details
identityPoolId=$(aws cloudformation describe-stacks --stack-name "$userPoolStackName" --output 'text' --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue')
userPoolId=$(aws cloudformation describe-stacks --stack-name "$userPoolStackName" --output 'text' --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue')
userPoolClientId=$(aws cloudformation describe-stacks --stack-name "$userPoolStackName" --output 'text' --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue')
appSyncEndpoint=$(aws cloudformation describe-stacks --stack-name "$appSyncStackName" --output 'text' --query 'Stacks[0].Outputs[?OutputKey==`AppSyncEventsApiHttpUrl`].OutputValue')
appSyncHttpEndpoint="https://$appSyncEndpoint/event"
appSyncAuthMode="userPool"
region="$1"
uploadDocumentBucket=$(aws cloudformation describe-stacks --stack-name "$documentBucketStackName" --output 'text' --query 'Stacks[0].Outputs[?OutputKey==`S3IdpDocBucket`].OutputValue')

echo "{ \
    \"identityPoolId\":\"$identityPoolId\", \
    \"userPoolId\":\"$userPoolId\", \
    \"userPoolClientId\":\"$userPoolClientId\", \
    \"appSyncEndpoint\":\"$appSyncHttpEndpoint\", \
    \"appSyncAuthMode\":\"$appSyncAuthMode\", \
    \"region\":\"$region\", \
    \"uploadDocumentBucket\":\"$uploadDocumentBucket\" \
}" > src/custom.configuration.json