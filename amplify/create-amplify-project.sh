AMPLIFY_FRONTEND_CODE="frontend-code"
AMPLIFY_PROJECT="amplify-idp"

# Create Amplify project
npm create vite@latest $AMPLIFY_PROJECT --yes -- --template react-ts

# Create configuration file
(cd $AMPLIFY_FRONTEND_CODE; ./create_custom_configuration.sh "$1")

# Copy frontend code in Amplify project
cp -r $AMPLIFY_FRONTEND_CODE/* $AMPLIFY_PROJECT/;
cp $AMPLIFY_FRONTEND_CODE/.npmrc $AMPLIFY_PROJECT/;

# Build Amplify project
(cd $AMPLIFY_PROJECT; \
npm install aws-amplify; \
npm add @aws-amplify/ui-react; \
npm install @aws-amplify/ui-react-storage; \
npm install @floating-ui/react; \
npm install react-cropper; \
npm install react-json-view; \
npm run build; \
)