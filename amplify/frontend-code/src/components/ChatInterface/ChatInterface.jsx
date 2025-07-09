import React, { useState, useEffect, useRef } from 'react';
import { VisuallyHidden } from "@aws-amplify/ui-react";
import ReactJson from 'react-json-view';
import './ChatInterface.css';
import robotIcon from '../../robot-icon.webp';
import CameraComponent from './CameraComponent.jsx';
import { uploadData } from "aws-amplify/storage";
import { events } from "aws-amplify/data";
import { fetchIdentityId } from "../Utils/Auth";
import { Buffer } from "buffer";

// JSON Tree Container with ReactJson
const JsonTreeContainer = ({ data, title = "JSON Data" }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };
  
  return (
    <div className="json-tree-wrapper">
      <div className="json-tree-header">
        <span className="json-tree-title">{title}</span>
        <button 
          className="json-copy-btn"
          onClick={copyToClipboard}
          title="Copy JSON to clipboard"
        >
          {copySuccess ? '✓' : '📋'}
        </button>
      </div>
      <div className="json-tree-container">
        <ReactJson 
          src={data}
          theme="rjv-default"
          collapsed={1}
          displayDataTypes={false}
          displayObjectSize={true}
          enableClipboard={false}
          indentWidth={2}
          iconStyle="triangle"
          shouldCollapse={(field) => {
            // Collapse objects and arrays by default
            return field.type === 'object' || field.type === 'array';
          }}
          style={{
            backgroundColor: 'transparent',
            fontSize: '13px',
            fontFamily: 'Courier New, monospace',
            textAlign: 'left',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
};

const ChatInterface = ({ customconfig }) => {
  const [messages, setMessages] = useState([]);
  const [lastMessageId, setLastMessageId] = useState();
  const [bdaMessage, setBdaMessage] = useState(null);
  const [classificationMessage, setClassificationMessage] = useState([]);
  const [docUploadStatus, setDocUploadStatus] = useState("-");
  const [docAnalysisStatus, setDocAnalysisStatus] = useState("-");
  const [docClassificationStatus, setDocClassificationStatus] = useState("-");
  const [uploadedImage, setUploadedImage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [cameraImage, setCameraImage] = useState();

  const initialAssistantMessage = 
    "Please upload your file. Once done, I will share my analysis here.";
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const classificationTimeoutRef = useRef(null);
  const acceptedFileTypes = [
    ".pdf",
    ".png", 
    ".jpg",
    ".jpeg"
  ];
  const hiddenInput = React.useRef(null);
  const [room, setRoom] = useState();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Only scroll to bottom when new messages are added (not on initial load)
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  // Update analysis status when messages are received
  useEffect(() => {
    if (!messages.length > 0)
      return;
    setDocAnalysisStatus(docAnalysisStatus);
    
  }, [messages, docAnalysisStatus]);

  // Update classification status when classification messages are received  
  useEffect(() => {
    if (classificationMessage.length > 0 && docClassificationStatus === "Processing") {
      setDocClassificationStatus("Completed");
      // Clear timeout when classification completes successfully
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
        classificationTimeoutRef.current = null;
      }
    }
  }, [classificationMessage, docClassificationStatus]);

  // Set up classification timeout when status changes to Processing
  useEffect(() => {
    if (docClassificationStatus === "Processing") {
      // Clear any existing timeout
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
      }
      
      // Set new timeout for 1 minute (60000ms)
      classificationTimeoutRef.current = setTimeout(() => {
        console.log("Classification timeout reached - setting status to Failed");
        setDocClassificationStatus("Failed");
        classificationTimeoutRef.current = null;
      }, 60000); // 1 minute timeout
      
      console.log("Classification timeout started - will fail in 1 minute if no response");
    } else if (docClassificationStatus === "Completed" || docClassificationStatus === "Failed") {
      // Clear timeout when classification is completed or failed
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
        classificationTimeoutRef.current = null;
      }
    }
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (classificationTimeoutRef.current) {
        clearTimeout(classificationTimeoutRef.current);
        classificationTimeoutRef.current = null;
      }
    };
  }, [docClassificationStatus]);

  // Ensure scroll starts at top on initial load
  useEffect(() => {

    const refreshBoard = async () => {
      var idToken = await fetchIdentityId();
      setRoom(idToken);
      
      // Use the idToken directly instead of room state to avoid race condition
      if (!idToken || !idToken.length) {
        return;
      }
      const pr = events.connect(`/default/channel/${idToken}`);
      pr.then((channel) => {
        channel.subscribe(
          {
            next: (data) => {
              console.log(JSON.stringify(data));
              var dataEvent = data.event;
              var currentMessageId = dataEvent.requestId;
              var messageType = dataEvent.messageType;
              if (messageType == "status") {
                var messageStatusType = dataEvent.messageStatusType;
                var messageStatus = dataEvent.messageStatus;
                if (messageStatusType == "analysis") {
                  setDocAnalysisStatus(messageStatus);
                }
              } else if (messageType == "analysis") {
                // Set analysis status to processing when first chunk arrives
                if (docAnalysisStatus === "Pending" || docAnalysisStatus === "-") {
                  setDocAnalysisStatus("Processing");
                }
                
                var docAnalysisMessageChunk = dataEvent.messageChunk;
                var docAnalysisMessageChunkIndex = dataEvent.messageChunkIndex;
                var docAnalysisMessageChunkObject = {
                  index: docAnalysisMessageChunkIndex,
                  chunk: docAnalysisMessageChunk,
                };
                console.log(
                  `docAnalysisMessageChunkObject: ${JSON.stringify(
                    docAnalysisMessageChunkObject
                  )}`
                );
                setLastMessageId(currentMessageId);
                setMessages((messages) => [
                  ...messages,
                  docAnalysisMessageChunkObject,
                ]);
              } else if (messageType == "bda") {
                var bdaMessage = dataEvent.messageBody;
                var messageStatusType = dataEvent.messageStatusType;
                var messageStatus = dataEvent.messageStatus;
                if (messageStatusType != "status") {
                  // Set classification status to processing when first message arrives
                  if (docClassificationStatus === "Pending" || docClassificationStatus === "-") {
                    setDocClassificationStatus("Processing");
                  }
                  
                  console.log(`bdaMessage: ${JSON.stringify(bdaMessage)}`);
                  var docClassificationMessageChunk = bdaMessage.document_class?.type || bdaMessage.image_class?.type;
                  var docClassificationMessageChunkIndex = 0;
                  var docClassificationMessageChunkObject = {
                    index: docClassificationMessageChunkIndex,
                    chunk: docClassificationMessageChunk,
                  };
                  setBdaMessage(bdaMessage);
                  setClassificationMessage((classificationMessage) => [
                    ...classificationMessage,
                    docClassificationMessageChunkObject,
                  ]);
                } else {
                  setDocClassificationStatus(messageStatus);
                }
              }
            },
            error: (value) => console.error(value),
          }
        );
      });
      return () => {
        pr?.then((channel) => channel?.close());
      };
    };
    refreshBoard();

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []); // Remove room dependency to avoid infinite loop

  function getChatMessage() {
    if (messages.length === 0) {
      return initialAssistantMessage;
    } else {
      return sortArray(messages)
        .map((message) => message.chunk)
        .join("");
    }
  }

  function resetState() {
    setDocUploadStatus("-");
    setDocAnalysisStatus("-");
    setDocClassificationStatus("-");
    setMessages([]);
    setClassificationMessage([]);
    setBdaMessage(null);
    
    // Clear classification timeout
    if (classificationTimeoutRef.current) {
      clearTimeout(classificationTimeoutRef.current);
      classificationTimeoutRef.current = null;
    }
  }

  const onFilePickerChange = async (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }
    const image = files[0];
    try {
      const result = await uploadDocument(
        `documents/${image.name}`,
        image,
        false
      );
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      // Reset the input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  async function uploadDocument(documentPath, blobData, isCameraUpload) {
    try {
      console.log("Starting upload document process...");
      resetState();
      
      var encodedBlobData = blobData;
      if (isCameraUpload) {
        encodedBlobData = blobData.replace(/^data:image\/\w+;base64,/, "");
        encodedBlobData = Buffer.from(encodedBlobData, "base64");
      }
      var documentData = encodedBlobData;
      
      console.log("Setting upload status to 'Pending...'");
      setDocUploadStatus("Pending...");
      
      var identityId = await fetchIdentityId();
      console.log("Identity ID fetched:", identityId);
      
      if (!customconfig || !customconfig.uploadDocumentBucket) {
        throw new Error("Upload configuration is missing");
      }
      
      console.log("Uploading to bucket:", customconfig.uploadDocumentBucket);
      var uploadResponse = await uploadData({
        path: `${identityId}/${documentPath}`,
        data: documentData,
        options: {
          bucket: {
            bucketName: customconfig.uploadDocumentBucket,
            region: customconfig.region,
          },
        },
      }).result;
      
      var encodedImage = blobData;
      if (!isCameraUpload) {
        //convert array buffer to base64
        var imageArrayBuffer = await blobData.arrayBuffer();
        encodedImage = btoa(
          new Uint8Array(imageArrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
      } else {
        encodedImage = encodedImage.replace(/^data:image\/\w+;base64,/, "");
      }
      
      setUploadedImage(encodedImage);
      setDocUploadStatus("Completed");
      setDocAnalysisStatus("Pending");
      setDocClassificationStatus("Pending");
      console.log("Upload completed successfully");
      return uploadResponse;
    } catch (error) {
      console.error("Upload failed:", error);
      setDocUploadStatus("Failed");
      throw error;
    }
  }

  function sortArray(messages) {
    if (messages.length < 2) {
      return messages;
    }
    console.log(
      `messages: ${JSON.stringify(
        messages
      )} type: ${typeof messages} isarray: ${Array.isArray(messages)}`
    );
    var sortedArray = messages.sort(
      (messageA, messageB) => messageA.index - messageB.index
    );
    return sortedArray;
  }

  const handleCameraClick = () => {
    setShowCamera(true);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="avatar-container">
            <div className="avatar">
              <img src={robotIcon} alt="Robot Assistant" className="avatar-image" />
            </div>
            <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
          </div>
          <div className="chat-title">
            <h3>Assistant</h3>
            <p className="status-text">{isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-btn" onClick={() => hiddenInput.current.click()}>📎</button>
          <VisuallyHidden>
            <input
              type="file"
              tabIndex={-1}
              ref={hiddenInput}
              onChange={onFilePickerChange}
              multiple={true}
              accept={acceptedFileTypes.join(",")}
            />
          </VisuallyHidden>          
          <button className="action-btn" onClick={handleCameraClick}>📷</button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Upload:</span>
          <span className={`status-value ${docUploadStatus.toLowerCase().replace(' ', '-')}`}>
            {docUploadStatus}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Analysis:</span>
          <span className={`status-value ${docAnalysisStatus.toLowerCase().replace(' ', '-')}`}>
            {docAnalysisStatus}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Classification:</span>
          <span className={`status-value ${docClassificationStatus.toLowerCase().replace(' ', '-')}`}>
            {docClassificationStatus}
          </span>
        </div>
      </div>

      <div className="chat-main-layout">
        {/* Left Side - Chat Messages */}
        <div className="chat-messages-section">
          <div className="chat-messages" ref={messagesContainerRef}>
        {/* Display messages. If no messages, display initial assistant message */}        
        <div className="message-wrapper bot">
          <div className="message bot">
            <div className="message-content">
              <p>{getChatMessage()}</p>
            </div>
          </div>
        </div>      
                
        {/* Display classification messages and BDA data */}
        {(classificationMessage.length > 0 || bdaMessage) && (
          <div className="message-wrapper bot">
            <div className="message bot">
              <div className="message-content">
                {bdaMessage && (
                  <div className="bda-section">
                    <JsonTreeContainer 
                      data={bdaMessage.inference_result} 
                      title={`Classification: ${sortArray(classificationMessage).map(msg => msg.chunk).join("")}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {isTyping && (
          <div className="message-wrapper bot typing-indicator">
            <div className="message bot">
              <div className="typing-animation">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right Panel - Document Preview (only show when image is uploaded) */}
        {uploadedImage && (
          <div className="right-panel">
            <div className="right-panel-header">
              <h4>📄 Document Preview</h4>
            </div>
            <div className="right-panel-content">
              <div className="document-preview">
                <img 
                  src={`data:image/png;base64,${uploadedImage}`} 
                  alt="Document preview" 
                  className="preview-image"
                  onError={(e) => {
                    e.target.src = `data:image/jpeg;base64,${uploadedImage}`;
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showCamera && (          
        <CameraComponent 
          setCameraImage={setCameraImage}
          uploadDocument={uploadDocument}
          setShowCamera={setShowCamera}
        />
      )}

    </div>
  );
};

export default ChatInterface;
