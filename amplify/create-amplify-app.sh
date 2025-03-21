# Define Amplify variables
AMPLIFY_PROJECT="amplify-idp"
AMPLIFY_BRANCH_NAME="staging"
AMPLIFY_APP_NAME="amplify-idp-app"

# Create Amplify app
response=$(aws amplify create-app --name "$AMPLIFY_APP_NAME")
AMPLIFY_APP_ID=$(echo $response | jq -r '.app.appId')

# Create Amplify branch
response=$(aws amplify create-branch --app-id "$AMPLIFY_APP_ID" --branch-name "$AMPLIFY_BRANCH_NAME")

# Save environment variable
echo 'export AMPLIFY_APP_ID="'$AMPLIFY_APP_ID'"' >> ~/.bashrc
echo "AMPLIFY_APP_ID: $AMPLIFY_APP_ID"
echo 'export AMPLIFY_BRANCH_NAME="'$AMPLIFY_BRANCH_NAME'"' >> ~/.bashrc
echo "AMPLIFY_BRANCH_NAME: $AMPLIFY_BRANCH_NAME"
source ~/.bashrc