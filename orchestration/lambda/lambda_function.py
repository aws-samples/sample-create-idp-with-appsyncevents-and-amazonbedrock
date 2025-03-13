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

# Models
modelId = os.environ["BedrockModelName"]


def call_websocket_endpoint(url, data):
    request = json.dumps({"channel": channel, "events": [json.dumps(data)]})
    logger.info(f"appsync request: {request}")
    headers = appsyncheader.getHeaders(request, host, endpoint)
    logger.info(f"appsync request headers: {headers}")
    response = requests.post(url, headers=headers, data=str(request), timeout=5)
    logger.info(f"appsync response: {response.json()}")
    return response


def retrieve_s3_object(bucket, key):
    # retrieve the file content from S3
    response = s3.get_object(Bucket=bucket, Key=key)
    file_content = response["Body"].read()
    file_b64content = base64.b64encode(file_content).decode()
    return file_b64content


def get_request_id(response):
    response_id = response["ResponseMetadata"]["RequestId"]
    return response_id


def invoke_model(prompt, promptType, data):
    user_message = {
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/png", "data": data},
            },
            {"type": "text", "text": prompt},
        ],
    }
    messages = [user_message]

    # prepare the request body for Claude3 Bedrock model
    body = json.dumps(
        {
            "messages": messages,
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
        }
    )

    # invoke Claude3 Bedrock model with response streaming
    response = bedrock.invoke_model_with_response_stream(
        body=body,
        modelId=modelId,
        accept="application/json",
        contentType="application/json",
    )

    # get request id
    requestId = get_request_id(response)

    # send "processing" status to appsync endpoint
    send_status_notification(requestId, "Processing...", promptType, "status")

    # send response as streaming data to appsync endpoint
    messageBody = send_stream_notification(requestId, response, promptType)

    return response, messageBody


def notify_appsync_endpoint(data):
    response = call_websocket_endpoint(request_url, data)
    return response


def send_stream_notification(requestId, response, promptType):
    index = 0
    messageBody = ""

    for stream in response["body"]:
        if stream:
            chunk = json.loads(stream["chunk"]["bytes"])
            logger.info(f"chunk: {chunk}")
            if chunk["type"] == "content_block_delta":
                notification = {
                    "requestId": requestId,
                    "messageChunk": chunk["delta"]["text"],
                    "messageChunkIndex": index,
                    "messageType": promptType,
                }
                response = notify_appsync_endpoint(notification)
                logger.info(f"response: {response}")
                messageBody = messageBody + chunk["delta"]["text"]
                index = index + 1
    logger.info(f"messageBody: {messageBody}")

    return messageBody


def send_status_notification(requestId, messageStatus, messageStatusType, messageType):
    notification = {
        "requestId": requestId,
        "messageStatus": messageStatus,
        "messageStatusType": messageStatusType,
        "messageType": messageType,
    }
    response = notify_appsync_endpoint(notification)
    return response


def lambda_handler(event, context):
    logger.info(f"event: {event}")

    # retrieve the bucket name and file key from the event
    bucket = event["detail"]["bucket"]["name"]
    key = event["detail"]["object"]["key"]

    # retrieve prompt details from the event
    prompt = event["prompt"]
    promptType = event["promptType"]

    # retrieve object from S3
    s3_data = retrieve_s3_object(bucket, key)

    # Submit prompt with object data to Bedrock model
    response, messageBody = invoke_model(prompt, promptType, s3_data)

    # status notification (pending)
    requestId = get_request_id(response)
    send_status_notification(requestId, "Completed", promptType, "status")

    return {"statusCode": 200, "body": messageBody}
