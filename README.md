##  Create a real-time Intelligent document processing solution using AWS AppSync Events, AWS Step Functions and Amazon Bedrock Data Automation

This repository contains samples to provision an intelligent document processing solution with a web application used to upload documents for processing.

**Solution diagram**

![Solution diagram](idp-diagram.png)

You can follow the below pre-requisites and steps to deploy the solution in an AWS account.

**Pre-requisites**

To follow along and set up this solution, you must have the following:
* An AWS account
* A device with access to your AWS account with the following:
    * Python 3.12 installed
    * Node.js 20.12.0 installed
    * [The AWS Amplify CLI set up](http://docs.amplify.aws/react/start/manual-installation/)
    * [Latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions)
* Enable [Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) to the Claude 3 Sonnet model in Amazon Bedrock

**Deployment steps**

Complete the following steps to provision the solution:

**Step 1**: Grant execution permissions for shell script files

```bash
chmod +x ./init-env.sh && source ./init-env.sh
```

**Step 2**: Setup Bedrock Data Automation project & sample blueprint

```bash
./setup-bda-project.sh
```

**Step 3**: Create S3 buckets used in this solution

```bash
cd $CURRENT_DIR/s3; ./create-s3-buckets.sh
```

**Step 4**: Create Cognito user pool & identity pool (set the **EMAIL_ARG** variable to your email address)

```bash
# TODO: Set the EMAIL_ARG variable to your email address 
EMAIL_ARG="#replace-with-your-email-address#"
cd $CURRENT_DIR/cognito; ./create-cognito-userpool.sh)
(cd $CURRENT_DIR/cognito; ./create-cognito-testuser.sh $EMAIL_ARG)
```

**Important note:** This step will also create a user in your user pool, you should receive an email with a temporary password in this format: "Your username is **#your-email-address#** and temporary password is **#temporary-password#**.". Keep note of your login details (email address and temporary password) as this will be used later when testing the web application.

**Step 5**: Create AppSync Events API

```bash
cd $CURRENT_DIR/appsync/; ./create-appsync-api.sh
```

**Step 6**: Create the AWS Step Functions state machine (including AWS Lambda functions) by running the following scripts:

```bash
cd $CURRENT_DIR/orchestration/; ./create-orchestration.sh
```

**Step 7**: Create the web application with AWS Amplify

```bash
cd $CURRENT_DIR/amplify/; ./create-webapp.sh
```

**Step 8**: Deploy the web application

```bash
cd $CURRENT_DIR/amplify/amplify-idp; ./deploy.sh
```

Once the solution is deployed:
* Open the AWS Amplify App **URL** in your navigator
* Login with your **email address** and **temporary password** (you should have recorded these details in **Step 3**)
* Once done, when prompted, enter a **new password** and choose **Change Password**
* You should now be able to see a **chat interface**, to **upload a document** (or **capture a picture** from your camera)
* Once done, you should see a **summary** of the document along with a **classification** and **specific fields extracted**

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.