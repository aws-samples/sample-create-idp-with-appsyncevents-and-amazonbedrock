#Pre-requisites: Enable Claude 3 Sonnet model in Amazon Bedrock
export CURRENT_DIR=$(pwd)

echo "Enable execution on shell script files"
find . -name '*.sh' -exec chmod +x {} +

echo "Step 1. Create S3 bucket for IdP documents"
(cd $CURRENT_DIR/s3; ./s3/create-idp-s3-bucket.sh)

echo "Step 2. Create S3 bucket for Lambda function"
(cd $CURRENT_DIR/s3; ./s3/create-lambda-s3-bucket.sh)

echo "Step 3. Create S3 bucket for AppSync Auth Lambda function"
(cd $CURRENT_DIR/s3; ./create-appsync-authlambda-s3-bucket.sh)

echo "Step 4. Create Cognito user pool & identity pool"
(cd $CURRENT_DIR/cognito; ./create-cognito-userpool.sh)

#(cd $CURRENT_DIR/cognito; ./create-cognito-testuser.sh #your-email-address#)

echo "Step 5. Package Lambda Authorizer function code"
(cd $CURRENT_DIR/appsync/lambda-auth; ../package-lambda-auth.sh)

echo "Step 6. Create AppSync Events API"
(cd $CURRENT_DIR/appsync/; ./create-appsync.sh)

echo "Step 7. Package Lambda function code used by Step Functions state machine"
(cd $CURRENT_DIR/orchestration/lambda; ../package-lambda.sh)

echo "Step 8. Package Lambda function code for Bedrock Data Automation"
(cd $CURRENT_DIR/orchestration/bda/lambda; ../package-bda-lambda.sh)

#Set up Bedrock Data Automation

echo "Step 9. Enable EventBridge notification on Bedrock Data Automation's S3 bucket"
# TODO - Input BDA S3 bucket name
BDA_BUCKET_NAME="bedrock-bda-us-west-2-c631a9e3-8450-4d2d-9226-3cfb74bfebe8"
aws s3api put-bucket-notification-configuration --bucket $BDA_BUCKET_NAME --notification-configuration='{ "EventBridgeConfiguration": {} }'

echo "Step 10. Create Lambda function for Bedrock Data Automation"
(cd $CURRENT_DIR/orchestration/bda; ./create-bda-lambda.sh $BDA_BUCKET_NAME)

echo "Step 11. Create Step Functions state machine and Lambda function"
(cd $CURRENT_DIR/orchestration/; ./create-state-machine.sh)

echo "Step 12. Create Amplify Project"
(cd $CURRENT_DIR/amplify/; ./create-amplify-project.sh)

echo "Step 13. Create Amplify App"
(cd $CURRENT_DIR/amplify/; ./create-amplify-app.sh)

echo "Step 14. Create bucket for Amplify App"
(cd $CURRENT_DIR/s3; ./create-amplifyapp-s3-bucket.sh)

echo "Step 15. Deploy Amplify App"
(cd $CURRENT_DIR/amplify/amplify-idp; ./deploy.sh)