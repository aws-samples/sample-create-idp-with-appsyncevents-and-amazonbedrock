from jose import jwk, jwt
from jose.utils import base64url_decode
import json
import logging
import os
import time
import urllib.request

logger = logging.getLogger()
logger.setLevel(logging.INFO)
REGION = os.environ["AWS_REGION"]
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
COGNITO_APP_CLIENT_ID = os.environ["COGNITO_APP_CLIENT_ID"]
keys_url = f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
with urllib.request.urlopen(keys_url) as f:
    response = f.read()
keys = json.loads(response.decode("utf-8"))["keys"]


def handler(event, context):
    logger.info(event)

    token_data = parse_token_data(event)
    if token_data["valid"] is False:
        return get_deny_policy()
    try:
        claims = validate_token(token_data["token"])
        requestContext = event["requestContext"]
        if "operation" in requestContext:
            return get_allow_policy()
    except Exception as e:
        logger.error(e)
    return get_deny_policy()


def parse_token_data(event):
    response = {"valid": False}
    if "authorizationToken" not in event:
        return response
    access_token = event["authorizationToken"]
    return {"valid": True, "token": access_token}


def get_allow_policy():
    return {
        "isAuthorized": True,
    }


def get_deny_policy():
    return {
        "isAuthorized": False,
    }


def validate_token(token):
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers["kid"]
    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(keys)):
        if kid == keys[i]["kid"]:
            key_index = i
            break
    if key_index == -1:
        print("Public key not found in jwks.json")
        return False
    # construct the public key
    public_key = jwk.construct(keys[key_index])
    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit(".", 1)
    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))
    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        print("Signature verification failed")
        return False
    print("Signature successfully verified")
    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)
    # additionally we can verify the token expiration
    if time.time() > claims["exp"]:
        print("Token is expired")
        return False
    # and the Audience  (use claims['client_id'] if verifying an access token)
    if claims["client_id"] != COGNITO_APP_CLIENT_ID:
        print("Token was not issued for this audience")
        return False
    # now we can use the claims
    return claims
