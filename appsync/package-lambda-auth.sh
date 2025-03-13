#!/bin/bash
shopt -s expand_aliases
source $HOME/.bashrc

# Create unique name
random_suffix=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
zip_file_name="idp-lambda-auth-$random_suffix.zip"

# Add/update dependencies
pip install -r requirements.txt -t . --upgrade

# Zip Lambda project
zip -r $zip_file_name . -x "*.zip"

# Upload zip file to S3
aws s3 cp $zip_file_name s3://$IDP_LAMBDA_BUCKET_NAME

# Save environment variable
echo 'export LAMBDA_AUTH_PACKAGE_NAME="'$zip_file_name'"' >> ~/.bashrc
echo "Lambda auth package name created: $zip_file_name"

bash
