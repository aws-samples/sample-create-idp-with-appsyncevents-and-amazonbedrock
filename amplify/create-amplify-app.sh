# Define Amplify variables
AMPLIFY_PROJECT="amplify-idp"
AMPLIFY_BRANCH_NAME="staging"
AMPLIFY_APP_NAME="amplify-idp-app"

# Create Amplify app
response=$(aws amplify create-app --name "$AMPLIFY_APP_NAME")
AMPLIFY_APP_ID=$(echo $response | jq -r '.app.appId')

# Create Amplify branch
response=$(aws amplify create-branch --app-id "$AMPLIFY_APP_ID" --branch-name "$AMPLIFY_BRANCH_NAME")