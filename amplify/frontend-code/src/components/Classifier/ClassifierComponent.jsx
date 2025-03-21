import { Button, Image, useTheme, VisuallyHidden } from "@aws-amplify/ui-react";
import { restApiAdapter } from "../Utils/ApiAdapter";
import { bedrockAdapter } from "../Utils/LLMAdapter";

import React, { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { events } from "aws-amplify/data";

import chatbotIcon from "./chatbot_icon.png";
import CameraComponent from "./CameraComponent";

import { fetchAuthToken } from "../Utils/Auth";
import { uploadData } from "aws-amplify/storage";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { Buffer } from "buffer";

const ClassifierComponent = (props) => {
  const { tokens } = useTheme();
  const [lastMessageId, setLastMessageId] = useState();
  const [lastMessage, setLastMessage] = useState("");
  const [bdaMessage, setBdaMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [classificationMessage, setClassificationMessage] = useState([]);

  const [room, setRoom] = useState("channel");
  const counterRef = useRef(null);
  const [uploadedImage, setUploadedImage] = React.useState();
  const acceptedFileTypes = ["image/png", "image/jpeg"];

  const [cameraButton] = useState(true);
  const [cameraImage, setCameraImage] = useState();

  const [state, setState] = useState();
  const [chatbotIconState] = useState(
    <Image
      src={chatbotIcon}
      objectFit="initial"
      objectPosition="50% 50%"
      backgroundColor={tokens.colors.purple[40]}
      height="10%"
      width="100%"
      opacity="100%"
      borderRadius={tokens.radii.sq}
    />
  );

  const [docUploadStatus, setDocUploadStatus] = useState("-");
  const [docClassificationStatus, setDocClassificationStatus] = useState("-");
  const [docAnalysisStatus, setDocAnalysisStatus] = useState("-");
  const [classificationState, setClassificationState] = useState(<></>);

  const initialAssistantMessage =
    "Please upload your file. Once done, I will share my analysis here.";
  const [chatState, setChatState] = useState(
    chatAssistantMessageRow(initialAssistantMessage)
  );
  const chatArea = useRef();
  const [chatConversationId, setChatConversationId] = useState();
  const [chatLastMessageId, setChatLastMessageId] = useState();
  const [chatSessionId, setChatSessionId] = useState();
  const hiddenInput = React.useRef(null);
  const LLMOptions = [bedrockAdapter];
  const [LLMOption] = React.useState(LLMOptions[0]);
  const apiAdapter = configureRestApiAdapter(LLMOption);

  function configureRestApiAdapter(llmOption) {
    restApiAdapter.configure(llmOption);
    return restApiAdapter;
  }

  function resetState() {
    setDocUploadStatus("-");
    setDocAnalysisStatus("-");
    setDocClassificationStatus("-");
    setMessages([]);
    setClassificationMessage([]);
    setBdaMessage("");
  }

  const onFilePickerChange = async (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }
    const image = files[0];
    const result = await uploadDocument(
      `documents/${image.name}`,
      image,
      false
    );
  };

  function chatAssistantMessageSourceRow(assistantMessageSources) {
    if (
      !Array.isArray(assistantMessageSources) ||
      assistantMessageSources.length <= 0
    )
      return;

    const assistantMessageSourceRender = assistantMessageSources.map(
      (item, index) => {
        return (
          <div key={index}>
            <i>
              <p>
                Source {index + 1}: {item.location}
              </p>
              <p>{item.snippet}</p>
            </i>
          </div>
        );
      }
    );

    return (
      <details>
        <summary>
          <b>
            <i>Sources</i>
          </b>
        </summary>
        {assistantMessageSourceRender}
      </details>
    );
  }

  function chatAssistantMessageImageRow(assistantMessageImage) {
    if (!assistantMessageImage) return;
    var sourceImage = `data:image/png;base64,${assistantMessageImage}`;
    return (
      <img
        id="cameraImageUserMessageArea"
        className="chatbotImageUserMessageArea"
        src={sourceImage}
      />
    );
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

  async function uploadDocument(documentPath, blobData, isCameraUpload) {
    resetState();
    var encodedBlobData = blobData;
    if (isCameraUpload) {
      encodedBlobData = blobData.replace(/^data:image\/\w+;base64,/, "");
      encodedBlobData = Buffer.from(encodedBlobData, "base64");
    }
    var documentData = encodedBlobData;
    console.log("upload document");
    setDocUploadStatus("Uploading...");
    var uploadResponse = await uploadData({
      path: documentPath,
      data: documentData,
      options: {
        bucket: {
          bucketName: props.customconfig.uploadDocumentBucket,
          region: props.customconfig.region,
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
    return uploadResponse;
  }

  function classificationStatusMessageRow() {
    return (
      <>
        <table className="classificationStatusRow">
          <tbody>
            <tr>
              <td className="classificationStatusMessage">
                <b> Upload: </b> {docUploadStatus}
                <br />
                <b> Classification: </b> {docClassificationStatus}
                <br />
                <b> Analysis: </b> {docAnalysisStatus}
                <br />
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  function classificationTypeMessageRow() {
    return (
      <>
        <table className="classificationTypeRow">
          <tbody>
            <tr>
              <td className="classificationTypeMessage">
                <>
                  {
                    <>
                      {" "}
                      <b> Type: </b>{" "}
                      {classificationMessage.length == 0
                        ? "-"
                        : getClassificationState()}{" "}
                    </>
                  }
                </>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  function classificationImageMessageRow() {
    var docImage = uploadedImage;
    return (
      <>
        <table className="imageRow">
          <tbody>
            <tr>
              <td className="imageMessage">
                <>
                  {docImage ? (
                    <>{chatAssistantMessageImageRow(docImage)}</>
                  ) : (
                    <></>
                  )}
                </>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  function chatAssistantMessageRow(
    assistantMessage,
    assistantMessageSources,
    assistantMessageImage
  ) {
    var assistantMessageSourceList = chatAssistantMessageSourceRow(
      assistantMessageSources
    );
    var assistantMessageImageList = chatAssistantMessageImageRow(
      assistantMessageImage
    );
    return (
      <>
        <table className="chatRow">
          <tbody>
            <tr>
              <td className="chatIconMessage">{chatbotIconState}</td>
              <td className="chatMessage">
                <b> Assistant: </b> {assistantMessage}
                {assistantMessageSourceList}
                {assistantMessageImageList}
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  }

  function chatUserMessageRow(userMessage, cameraImage) {
    return (
      <p>
        <b> User: </b>
        {userMessage}
        <br />
        {cameraImage ? (
          <>
            <img
              id="cameraImageUserMessageArea"
              className="chatbotImageUserMessageArea"
              src={cameraImage}
            />
          </>
        ) : (
          <></>
        )}
      </p>
    );
  }

  useEffect(() => {
    const refreshBoard = async () => {
      if (!room || !room.length) {
        return;
      }
      var authToken = await fetchAuthToken();
      const pr = events.connect(`/default/${room}`);
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
                  console.log(`bdaMessage: ${JSON.stringify(bdaMessage)}`);
                  var docClassificationMessageChunk =
                    bdaMessage.document_class.type;
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
          },
          { authToken: authToken }
        );
      });
      return () => {
        pr?.then((channel) => channel?.close());
      };
    };
    refreshBoard();
  }, [room]);

  async function submitQuery(userId, event) {
    var cameraImageData;
    if (cameraImage) {
      cameraImageData = cameraImage.split(",")[1];
    }
    const query = {
      prompt: state,
      imageData: cameraImageData,
      userId: userId,
      conversationId: chatConversationId,
      messageId: chatLastMessageId,
      sessionId: chatSessionId,
    };
    console.log(query);
    const response = await apiAdapter.submitPrompt(query);
    console.log(response);
    setChatConversationId(response.conversationId);
    setChatLastMessageId(response.lastMessageId);
    setChatSessionId(response.sessionId);
    const systemMessage = response.systemMessage;
    const systemMessageSources = response.systemMessageSources;
    const systemMessageImage = response.systemMessageImage;
    const systemChatbotMessage = chatAssistantMessageRow(
      systemMessage,
      systemMessageSources,
      systemMessageImage
    );
    return systemChatbotMessage;
  }

  async function handleSubmit(event) {
    console.log(event);
    const userChatbotMessage = chatUserMessageRow(state, cameraImage);
    const chatbotMessage = (
      <>
        {chatState}
        {userChatbotMessage}
      </>
    );
    setChatState(chatbotMessage);
    setState("");
    event.preventDefault();

    const { username } = await getCurrentUser();
    var systemChatbotMessage = {};

    try {
      systemChatbotMessage = await submitQuery(username, event);
      const chatbotState = (
        <>
          {chatbotMessage}
          {systemChatbotMessage}
        </>
      );

      setChatState(chatbotState);
    } catch (e) {
      console.error("Request failed", e);
      return;
    }
  }

  async function handleChange(event) {
    setState(event.target.value);
  }

  function getBdaMessageState() {
    if (bdaMessage) {
      return chatAssistantMessageRow(
        JSON.stringify(bdaMessage.inference_result)
      );
    }
  }

  function getClassifierChatState() {
    if (messages.length === 0) {
      return chatAssistantMessageRow(initialAssistantMessage);
    } else {
      return chatAssistantMessageRow(
        sortArray(messages)
          .map((message) => message.chunk)
          .join("")
      );
    }
  }

  function getClassificationState() {
    console.log(
      `classificationMessage: ${JSON.stringify(classificationMessage)}`
    );
    var sortedClassificationMessage = sortArray(classificationMessage);
    console.log(
      `sortedClassificationMessage: ${JSON.stringify(
        sortedClassificationMessage
      )}`
    );
    return sortedClassificationMessage.map((message) => message.chunk).join("");
  }

  return (
    <div>
      <div className="classifierMenuColumnArea">
        <div class="classifierColumnArea">
          <CameraComponent
            uploadDocument={uploadDocument}
            setCameraImage={setCameraImage}
            setState={setState}
          />
        </div>
        <div className="classifierColumnArea">
          <button
            className="fileAttachmentButton"
            size="small"
            onClick={() => hiddenInput.current.click()}
          />
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
        </div>
      </div>
      <div id="classifier-parenttable" className="classifierParentTableArea">
        <div id="classifier-tablearea" className="classifierTableArea">
          <div id="classifier-area" className="classifierArea">
            <div id="classifier-textarea" className="classifierTextArea">
              {getBdaMessageState()}
              {getClassifierChatState()}
            </div>
          </div>
        </div>
        <div id="classifier-tablearea2" className="classifierTableArea">
          <div
            id="classifier-classificationtype-section"
            className="classificationTypeSection"
          >
            {classificationTypeMessageRow()}
          </div>
          <div
            id="classifier-uploadedimage-section"
            className="uploadedImageSection"
          >
            {classificationImageMessageRow()}
          </div>
          <div id="classifier-documentlist" className="classifierDocList">
            {classificationStatusMessageRow()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ClassifierComponent;
