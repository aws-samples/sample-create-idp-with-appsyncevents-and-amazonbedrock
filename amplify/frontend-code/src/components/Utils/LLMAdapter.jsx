class LLMAdapter {
  constructor(name) {
    if (this.constructor === LLMAdapter) {
      throw new Error(
        "LLMAdapter is an abstract class - it cannot be instantiated"
      );
    }
    this._name = name;
  }
  get name() {
    return this._name;
  }
  set name(newName) {
    this._name = newName;
  }
  async buildRestQuery(rawQuery) {
    throw new Error("buildRestQuery method must be implemented");
  }
  async buildRestResponse(rawResponse) {
    throw new Error("buildRestResponse method must be implemented");
  }
  async buildMessageSourceArray(systemMessageSourceArray) {
    throw new Error("buildMessageSourceArray method must be implemented");
  }
}

let bedrockAdapterInstance;
export class BedrockAdapter extends LLMAdapter {
  constructor() {
    super("Bedrock");
    if (bedrockAdapterInstance) {
      throw new Error("Only 1 BedrockAdapter instance can be created");
    }
    bedrockAdapterInstance = this;
  }
  async buildRestQuery(rawQuery) {
    return {
      path: "/assistant/bedrock",
      parameters: {
        prompt: rawQuery["prompt"],
        imageData: rawQuery["imageData"],
        userId: rawQuery["userId"],
        conversationId: rawQuery["sessionId"],
        messageId: rawQuery["messageId"],
      },
    };
  }
  async buildRestResponse(rawResponse) {
    var systemMessageSources =
      "sourceAttributions" in rawResponse ? rawResponse.sourceAttributions : [];
    var systemMessageImage = "image" in rawResponse ? rawResponse.image : "";
    console.log(rawResponse);
    var systemMessageSourceArray = await this.buildMessageSourceArray(
      systemMessageSources
    );
    return {
      sessionId: rawResponse.conversationId,
      systemMessage: rawResponse.systemMessage,
      systemMessageSources: systemMessageSourceArray,
      systemMessageImage: systemMessageImage,
    };
  }
  async buildMessageSourceArray(systemMessageSourceArray) {
    const messageSourceArray = [];
    systemMessageSourceArray.map((sourceItem) => {
      console.log(sourceItem);
      var sourceRetrievedReferences = sourceItem.retrievedReferences;
      console.log(sourceRetrievedReferences);
      var isSourceArrayEmpty =
        Array.isArray(sourceRetrievedReferences) &&
        !sourceRetrievedReferences.length;
      if (!isSourceArrayEmpty) {
        sourceRetrievedReferences.map((item) => {
          return messageSourceArray.push({
            location: JSON.stringify(item.location),
            snippet: JSON.stringify(item.content),
          });
        });
      }
      return {};
    });
    return messageSourceArray;
  }
}

let bedrockAdapter = Object.freeze(new BedrockAdapter());
export { bedrockAdapter };
