#!/bin/bash

# Create unique name
random_suffix=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
zip_file_name="idp-lambda-auth-$random_suffix.zip"

# Add/update dependencies
pip install -r requirements.txt -t . --upgrade

# Zip Lambda project
zip -r $zip_file_name . -x "*.zip"

# Export package name
export LAMBDA_AUTH_PACKAGE_NAME=$zip_file_name
