import { Image, useTheme, Flex, View } from "@aws-amplify/ui-react";
import { restApiAdapter } from "../Utils/ApiAdapter";
import { bedrockAdapter } from "../Utils/LLMAdapter";

import React, { useEffect, useState, useRef } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { events } from 'aws-amplify/data';

import chatbotIcon from "./chatbot_icon.png";
import CameraComponent from "./CameraComponent";

import { fetchAuthToken } from "../Utils/Auth"

const ChatbotComponent = () => {
  const { tokens } = useTheme();
  const [messages, setMessages] = useState([])
  const [room, setRoom] = useState('')
  const counterRef = useRef(null)

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
  const initialAssistantMessage = "How can I help you today?";
  const [chatState, setChatState] = useState(
    chatAssistantMessageRow(initialAssistantMessage)
  );
  const chatArea = useRef();
  const [chatConversationId, setChatConversationId] = useState();
  const [chatLastMessageId, setChatLastMessageId] = useState();
  const [chatSessionId, setChatSessionId] = useState();
  const LLMOptions = [bedrockAdapter];
  const [LLMOption] = React.useState(LLMOptions[0]);
  const apiAdapter = configureRestApiAdapter(LLMOption);

  function configureRestApiAdapter(llmOption) {
    restApiAdapter.configure(llmOption);
    return restApiAdapter;
  }

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
      <details>
        <summary>
          <b>
            <i>Image</i>
          </b>
        </summary>
        <Image
          src={sourceImage}
          alignSelf="stretch"
          objectFit="initial"
          objectPosition="50% 50%"
          backgroundColor={tokens.colors.purple[40]}
          height="100%"
          width="90%"
          opacity="100%"
          borderRadius={tokens.radii.xs}
        />
      </details>
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
        { cameraImage ? (
          <>
            <img id="cameraImageUserMessageArea" className="chatbotImageUserMessageArea" src={cameraImage} />
          </>) : (<></>)
        }
      </p>
    );
  }

  useEffect(() => {
    //const currentChatArea = chatArea.current;
    //currentChatArea.scrollTop = currentChatArea.scrollHeight;
    const refreshBoard = async () => {
      if (!room || !room.length) {
        return
      }
      let timeoutID
      var authToken = await fetchAuthToken()
      const pr = events.connect(`/default/${room}`/*, {authMode: "lambda"}*/)
      pr.then((channel) => {
        channel.subscribe({
          next: (data) => {
            setMessages((messages) => [...messages, data.message])
            if (timeoutID) {
              clearTimeout(timeoutID);
            }
            counterRef.current?.classList.add('animate-bounce')
            timeoutID = setTimeout(() => {
              counterRef.current?.classList.remove('animate-bounce')
            }, 3000);
          },
          error: (value) => console.error(value),          
        }, { authToken: authToken })
      })
      return () => {
        pr?.then((channel) => channel?.close())
      }
    };
    refreshBoard();
  }, [room])

  async function submitQuery(userId, event) {
    var cameraImageData;
    if(cameraImage){
      cameraImageData = cameraImage.split(",")[1]
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

  var appSyncEvent = true
  if(appSyncEvent) {
    return (
      <div className='max-w-screen-md mx-auto'>
        <h2 className='my-4 p-4 font-semibold text-xl'>AppSync Events - Messages</h2>
        <button
          type="button"
          className='border rounded-md px-4 py-2 items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-sky-200  shadow hover:bg-sky-200/90'
          onClick={() => {
            const room = prompt('Room:')
            if (room && room.length) {
              setMessages([])
              setRoom(room.trim().replace(/\W+/g, '-'))
            }
          }}
        >
          set room
        </button>
        <div className='my-4 border-b-2  border-sky-500 py-1 flex justify-between'>
          <div>
            {room ? (
              <span>
                Currently in room: <b>{room}</b>
              </span>
            ) : (
              <span>Pick a room to get started</span>
            )}
          </div>
          <div className='flex items-center uppercase text-xs tracking-wider font-semibold'>
            <div className='mr-2'>Messages count:</div>
            <span ref={counterRef} className='transition-all inline-flex items-center rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900'>{messages.length}</span></div>
        </div>
        <section id="messages" className='space-y-2'>
          {messages.map((message, index) => (
            <div
              key={index}
              className='border-b py-1 flex justify-between px-2'
            ><div>
                {message}
              </div>
              <div> </div>
            </div>
          ))}
        </section>
      </div>
    );
  } else {
    return (
      <Flex
        id="chatbot-interface"
        direction="row"
        gap="3rem"
        backgroundColor={tokens.colors.purple[20]}
        alignContent="flex-start" 
        alignItems="flex-start"
        justifyContent="flex-start">
        <Flex
          direction="column"
          gap="1rem"
          backgroundColor={tokens.colors.purple[20]}
          alignItems="center"
        >
          <div id="chatbot-chat" className="chatbotArea">
            <div id="chatbot-messages" className="chatbotTextArea" ref={chatArea}>
              {chatState}
            </div>
          </div>
          <div className="chatbotMenuColumnArea">
            <div>
              <form onSubmit={handleSubmit} className="chatbotFormArea">
                <div class="chatbotColumnArea">
                  { cameraImage ? (
                    <>
                      <img id="cameraImage" className="chatbotImageInputArea" src={cameraImage} />
                    </>) : (<></>)
                  }
                  <input
                    id="chatbotTextInputAreaId"
                    type="text"
                    placeholder="Ask me anything..."
                    width="50%"
                    value={state}
                    onChange={handleChange}
                  ></input>
                  { cameraButton ? 
                    (<div class="chatbotColumnArea">
                        <CameraComponent
                          setCameraImage={setCameraImage}
                          setState={setState}
                        />
                      </div>)
                    : (<></>)
                  }
                </div>
              </form>
            </div>
          </div>
          <View height="10px" />
        </Flex>
      </Flex>
    );
  }
};
export default ChatbotComponent;
