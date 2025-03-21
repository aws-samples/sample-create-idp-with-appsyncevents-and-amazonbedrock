import { fetchAuthSession } from "@aws-amplify/auth";

export async function fetchAuthToken() {
  const session = await fetchAuthSession({ forceRefresh: true });
  const { accessToken } = session.tokens ?? {};
  console.log("access token", accessToken);
  return accessToken;
}
