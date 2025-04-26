import { fetchAuthSession } from "@aws-amplify/auth";

export async function fetchSession() {
  const session = await fetchAuthSession({ forceRefresh: true });
  console.log(`session: ${JSON.stringify(session)}`)
  return session;
}

export async function fetchTokens() {
  const session = await fetchSession();
  return session.tokens ?? {};
}

export async function fetchAuthToken() {
  const { accessToken } = await fetchTokens();
  return accessToken;
}

export async function fetchIdentityId() {
  const { identityId } = await fetchSession();
  return identityId.replace(":","-");
}