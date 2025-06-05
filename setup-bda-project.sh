#!/bin/bash
set -e

echo "Setting up Bedrock Data Automation project using CloudFormation..."

# Define stack name
STACK_NAME="bda-project-stack"

# Check if stack already exists
echo "Checking if stack $STACK_NAME already exists..."
do_stack_exist=$(aws cloudformation describe-stacks --stack-name $STACK_NAME 2>/dev/null || true)

if [ -n "$do_stack_exist" ]; then
  echo "Stack $STACK_NAME already exists. Updating stack..."
  aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://bda-project-stack.yml \
    --capabilities CAPABILITY_IAM
else
  echo "Creating new stack $STACK_NAME..."
  aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://bda-project-stack.yml \
    --capabilities CAPABILITY_IAM
fi

# Wait for stack creation/update to complete
echo "Waiting for stack operation to complete..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME 2>/dev/null || \
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME

# Check if stack creation was successful
if [ $? -ne 0 ]; then
  echo "Stack operation failed. Check CloudFormation events for details."
  exit 1
fi

echo "Stack operation completed successfully."

# Get outputs from the stack
echo "Retrieving stack outputs..."
BDA_PROJECT_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='BDAProjectArn'].OutputValue" --output text)
BLUEPRINT_ARN=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='BlueprintArn'].OutputValue" --output text)
BLUEPRINT_STAGE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='BlueprintStage'].OutputValue" --output text)

# Save environment variables
echo "Saving environment variables..."
if grep -q "export BDA_PROJECT_ARN" ~/.bashrc; then
  # Update existing environment variable
  sed -i "s|export BDA_PROJECT_ARN=.*|export BDA_PROJECT_ARN=\"$BDA_PROJECT_ARN\"|g" ~/.bashrc
else
  # Add new environment variable
  echo 'export BDA_PROJECT_ARN="'$BDA_PROJECT_ARN'"' >> ~/.bashrc
fi

if grep -q "export BLUEPRINT_ARN" ~/.bashrc; then
  sed -i "s|export BLUEPRINT_ARN=.*|export BLUEPRINT_ARN=\"$BLUEPRINT_ARN\"|g" ~/.bashrc
else
  echo 'export BLUEPRINT_ARN="'$BLUEPRINT_ARN'"' >> ~/.bashrc
fi

if grep -q "export BLUEPRINT_STAGE" ~/.bashrc; then
  sed -i "s|export BLUEPRINT_STAGE=.*|export BLUEPRINT_STAGE=\"$BLUEPRINT_STAGE\"|g" ~/.bashrc
else
  echo 'export BLUEPRINT_STAGE="'$BLUEPRINT_STAGE'"' >> ~/.bashrc
fi

# Apply changes to current shell
source ~/.bashrc

echo "BDA project created: $BDA_PROJECT_ARN"
echo "Blueprint ARN: $BLUEPRINT_ARN"
echo "Blueprint Stage: $BLUEPRINT_STAGE"
echo "Setup complete!"