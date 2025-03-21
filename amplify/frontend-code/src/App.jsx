import { Amplify } from "aws-amplify";

import { Authenticator, Button } from "@aws-amplify/ui-react";
import "./styles.css";

import HeaderComponent from "./components/Header/HeaderComponent";
import ClassifierComponent from "./components/Classifier/ClassifierComponent";

import customconfig from "./custom.configuration.json";
import { useState } from "react";

async function initConfiguration() {
  await Amplify.configure({
    ssr: true,
  });

  const appSyncAuthMode = customconfig.appSyncAuthMode;
  const appSyncEndpoint = customconfig.appSyncEndpoint;
  const identityPoolId = customconfig.identityPoolId;
  const userPoolId = customconfig.userPoolId;
  const userPoolClientId = customconfig.userPoolClientId;
  const region = customconfig.region;
  const uploadDocumentBucket = customconfig.uploadDocumentBucket;

  return await Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId: identityPoolId,
        userPoolId: userPoolId,
        userPoolClientId: userPoolClientId,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: "code",
        userAttributes: {
          email: {
            required: true,
          },
        },
      },
    },
    API: {
      Events: {
        endpoint: appSyncEndpoint,
        region: region,
        defaultAuthMode: appSyncAuthMode,
      },
    },
    Storage: {
      bucket: uploadDocumentBucket, //REQUIRED -  Amazon S3 bucket
      region: region, //OPTIONAL -  Amazon service region
      buckets: {
        "default-bucket": {
          bucketName: uploadDocumentBucket,
          region: region,
        },
      },
    },
  });
}
await initConfiguration();

const App = () => {
  const [tab, setTab] = useState("1");
  return (
    <Authenticator hideSignUp={true}>
      {({ signOut }) => (
        <main>
          <HeaderComponent />
          <ClassifierComponent customconfig={customconfig} />
          <div id="signout-button" className="signOutButton">
            <Button
              color="white"
              borderColor={"purple"}
              backgroundColor={"purple"}
              onClick={signOut}
              size="small"
            >
              Sign out
            </Button>
          </div>
        </main>
      )}
    </Authenticator>
  );
};
export default App;
