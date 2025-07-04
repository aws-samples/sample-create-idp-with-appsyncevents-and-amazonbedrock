import { Amplify } from "aws-amplify";

import { Authenticator, Button } from "@aws-amplify/ui-react";
import "./styles.css";

import customconfig from "./custom.configuration.json";
import { useState, useEffect } from "react";

import './App.css';
import ChatInterface from './components/ChatInterface/ChatInterface.jsx';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setIsLoaded(true);
    // Generate random particles for background animation
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3, // Elegant size range (3-9px)
      duration: Math.random() * 5 + 4, // Slow, graceful animation (4-9s)
    }));
    setParticles(newParticles);
  }, []);

  return (
    <Authenticator hideSignUp={true}>
      {({ signOut }) => (
        <div className="App">
          {/* Animated background particles */}
          <div className="particles-container">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDuration: `${particle.duration}s`,
                  animationDelay: `${particle.id * 0.1}s`
                }}
              />
            ))}
          </div>

          <header className={`App-header ${isLoaded ? 'loaded' : ''}`}>
            {/* Sign Out Button */}
            <div className="sign-out-container">
              <button className="sign-out-btn" onClick={signOut}>
                🚪 Sign Out
              </button>
            </div>
            
            <div className="content-wrapper">          
              <div className="chat-main-section">
                <ChatInterface customconfig={customconfig}/>
              </div>              
            </div>
          </header>
        </div>
      )}
    </Authenticator>
  );
};
export default App;
