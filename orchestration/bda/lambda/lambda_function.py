import base64
import boto3
import json
import logging
import requests
import appsyncheader
import os

# Clients
appsync = boto3.client("appsync")
bedrock = boto3.client("bedrock-runtime")
bda = boto3.client('bedrock-data-automation')
bda_runtime = boto3.client('bedrock-data-automation-runtime')
s3 = boto3.client("s3")

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Request parameters
channel = os.environ["AppSyncApiChannel"]
host = os.environ["AppSyncApiUrl"]
endpoint = "/event"
region = os.environ["AWS_REGION"]
request_url = f"https://{host}{endpoint}"
bda_s3bucket = os.environ["BdaS3Bucket"]
bda_profile_arn = os.environ["DataAutomationProfileArn"]
bda_project_arn = os.environ["DataAutomationProjectArn"]

def call_websocket_endpoint(url, data):
    request = json.dumps({"channel": channel, "events": [json.dumps(data)]})
    logger.info(f"appsync request: {request}")
    headers = appsyncheader.getHeaders(request, host, endpoint)
    logger.info(f"appsync request headers: {headers}")
    response = requests.post(url, headers=headers, data=str(request), timeout=5)
    logger.info(f"appsync response: {response.json()}")
    return response


def retrieve_s3_object(bucket, key, isBdaInit):
    # retrieve the file content from S3
    response = s3.get_object(Bucket=bucket, Key=key)
    requestId = get_request_id(response)
    file_content = response["Body"].read()
    logger.info(f"file_content: {file_content}")
    return file_content, requestId

def to_json_content(file_content):
    return json.loads(file_content)

def get_request_id(response):
    response_id = response["ResponseMetadata"]["RequestId"]
    return response_id

def notify_appsync_endpoint(data):
    response = call_websocket_endpoint(request_url, data)
    return response

def send_message_notification(requestId, messageBody, messageType):
    notification = {
        "requestId": requestId,
        "messageBody": messageBody,
        "messageType": messageType
    }
    response = notify_appsync_endpoint(notification)
    return response

def send_status_notification(requestId, messageStatus, messageStatusType, messageType):
    notification = {
        "requestId": requestId,
        "messageStatus": messageStatus,
        "messageStatusType": messageStatusType,
        "messageType": messageType,
    }
    response = notify_appsync_endpoint(notification)
    return response

def start_bda_automation(bda_s3bucket, key):
    s3Uri = f"s3://{bda_s3bucket}"
    s3InputUri = f"{s3Uri}/{key}"
    s3OutputUri = f"{s3Uri}/inference_results"

    data_automation_project = bda.get_data_automation_project(projectArn=bda_project_arn)
    logger.info(f"data_automation_projects {data_automation_project}")
    data_automation_stage = data_automation_project['project']['projectStage']
    logger.info(f"data_automation_arn: {bda_project_arn} / data_automation_stage: {data_automation_stage}")

    logger.info(f"s3InputUri: {s3InputUri} / s3OutputUri: {s3OutputUri}")

    response = bda_runtime.invoke_data_automation_async(
        inputConfiguration={
            's3Uri': s3InputUri
        },
        outputConfiguration={
            's3Uri': s3OutputUri
        },
        dataAutomationConfiguration={
            'dataAutomationProjectArn': bda_project_arn,
            'stage': data_automation_stage
        },
        dataAutomationProfileArn=bda_profile_arn
    )
    return response

def copy_s3_document(bda_s3bucket, key, s3_data):
    response = s3.put_object(Bucket=bda_s3bucket, Key=key, Body=s3_data)
    return response

def lambda_handler(event, context):
    logger.info(f"event: {event}")
    messageType = "bda"

    # retrieve the bucket name and file key from the event
    bucket = event["detail"]["bucket"]["name"]
    key = event["detail"]["object"]["key"]

    # retrieve input details from the event
    isBdaInit = ("inputType" in event)

    # retrieve object from S3
    s3_data, requestId = retrieve_s3_object(bucket, key, isBdaInit)
    logger.info(f"s3_data: {s3_data}")

    if isBdaInit:
        copy_s3_document(bda_s3bucket, key, s3_data)
        start_bda_automation(bda_s3bucket, key)
        # status notification (bda pending)
        messageBody = "Pending"
    else:
        # message notification
        send_message_notification(requestId, to_json_content(s3_data), messageType)
        # status notification (bda completed)
        messageBody = "Completed"

    # status notification (bda completed)
    send_status_notification(requestId, messageBody, "status", messageType)
    return {"statusCode": 200, "body": messageBody}
