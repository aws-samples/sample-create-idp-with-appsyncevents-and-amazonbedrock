import datetime
import hashlib
import hmac
import os

# Header details
algorithm = "AWS4-HMAC-SHA256"
signed_headers = (
    "accept;content-encoding;content-type;host;x-amz-date;x-amz-security-token"
)

# Request parameters
method = "POST"
service = "appsync"
region = os.environ["AWS_REGION"]


def getCanonicalRequest(payload, host, endpoint, datestamp, amzdate):
    # Create the canonical request
    canonical_uri = endpoint
    canonical_querystring = ""

    # Create the canonical request
    canonical_headers = (
        "accept:"
        + "application/json, text/javascript"
        + "\n"
        + "content-encoding:"
        + "amz-1.0"
        + "\n"
        + "content-type:"
        + "application/json; charset=UTF-8"
        + "\n"
        + "host:"
        + host
        + "\n"
        + "x-amz-date:"
        + amzdate
        + "\n"
        + "x-amz-security-token:"
        + getSessionToken()
        + "\n"
    )
    payload_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    canonical_request = (
        method
        + "\n"
        + canonical_uri
        + "\n"
        + canonical_querystring
        + "\n"
        + canonical_headers
        + "\n"
        + signed_headers
        + "\n"
        + payload_hash
    )

    # Create the string to sign
    algorithm = "AWS4-HMAC-SHA256"
    credential_scope = datestamp + "/" + region + "/" + service + "/" + "aws4_request"
    string_to_sign = (
        algorithm
        + "\n"
        + amzdate
        + "\n"
        + credential_scope
        + "\n"
        + hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()
    )

    return string_to_sign, credential_scope


def sign(key, msg):
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def getSignatureKey(key, dateStamp, regionName, serviceName):
    kDate = sign(("AWS4" + key).encode("utf-8"), dateStamp)
    kRegion = sign(kDate, regionName)
    kService = sign(kRegion, serviceName)
    kSigning = sign(kService, "aws4_request")
    return kSigning


def getSessionToken():
    return os.environ["AWS_SESSION_TOKEN"]


def getTemporaryCredentials():
    access_key = os.environ["AWS_ACCESS_KEY_ID"]
    secret_key = os.environ["AWS_SECRET_ACCESS_KEY"]
    session_token = getSessionToken()
    return access_key, secret_key, session_token


def getHeaders(payload, host, endpoint):
    # Create a datetime object for signing
    t = datetime.datetime.now(datetime.UTC)
    amzdate = t.strftime("%Y%m%dT%H%M%SZ")
    datestamp = t.strftime("%Y%m%d")

    # getTemporaryCredentials
    access_key, secret_key, session_token = getTemporaryCredentials()

    # String to sign
    string_to_sign, credential_scope = getCanonicalRequest(
        payload, host, endpoint, datestamp, amzdate
    )

    # Sign the string
    signing_key = getSignatureKey(secret_key, datestamp, region, service)
    signature = hmac.new(
        signing_key, (string_to_sign).encode("utf-8"), hashlib.sha256
    ).hexdigest()
    authorization_header = (
        algorithm
        + " "
        + "Credential="
        + access_key
        + "/"
        + credential_scope
        + ", "
        + "SignedHeaders="
        + signed_headers
        + ", "
        + "Signature="
        + signature
    )

    return {
        "accept": "application/json, text/javascript",
        "content-encoding": "amz-1.0",
        "content-type": "application/json; charset=UTF-8",
        "Host": host,
        "x-amz-date": amzdate,
        "X-Amz-Security-Token": session_token,
        "Authorization": authorization_header,
    }
