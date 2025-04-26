AMPLIFY_FRONTEND_CODE="frontend-code"
AMPLIFY_PROJECT="amplify-idp"

# Create Amplify project
npm create vite@latest $AMPLIFY_PROJECT --yes -- --template react-ts

# Create configuration file
pwd
(cd $AMPLIFY_FRONTEND_CODE; ./create_custom_configuration.sh)

# Copy frontend code in Amplify project
cp -rT $AMPLIFY_FRONTEND_CODE/ $AMPLIFY_PROJECT/;

# Build Amplify project
(cd $AMPLIFY_PROJECT; \
npm install aws-amplify; \
npm add @aws-amplify/ui-react; \
npm install @aws-amplify/ui-react-storage; \
npm install @floating-ui/react; \
npm install react-cropper; \
npm run build; \
)