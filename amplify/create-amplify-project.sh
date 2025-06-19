# if region not provided as an argument, attempt to set the region
region=$1
if [ -z "$region" ]; then
    region=$(aws ec2 describe-availability-zones --output text --query 'AvailabilityZones[0].[RegionName]')
fi

# if not able to set the region, exit
if [ -z "$region" ]; then
    echo "Please provide the AWS region as an argument."
    exit 1
fi

AMPLIFY_FRONTEND_CODE="frontend-code"
AMPLIFY_PROJECT="amplify-idp"

# Create Amplify project
npm create vite@latest $AMPLIFY_PROJECT --yes -- --template react-ts

# Create configuration file
(cd $AMPLIFY_FRONTEND_CODE; ./create_custom_configuration.sh $region)

# Copy frontend code in Amplify project
cp -r $AMPLIFY_FRONTEND_CODE/* $AMPLIFY_PROJECT/;

# Build Amplify project
(cd $AMPLIFY_PROJECT; \
npm install aws-amplify; \
npm add @aws-amplify/ui-react; \
npm install @aws-amplify/ui-react-storage; \
npm install @floating-ui/react; \
npm install react-cropper; \
npm run build; \
)