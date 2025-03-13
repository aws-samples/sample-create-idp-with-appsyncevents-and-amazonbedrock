import { fetchAuthToken } from "./Auth"
import { post } from "aws-amplify/api";
import customconfig from "../../custom.configuration.json";

class ApiAdapter {
    constructor (llmAdapter) {
      if(this.constructor === ApiAdapter){
        throw new Error("ApiAdapter is an abstract class - it cannot be instantiated");
      }
      this._llmAdapter = llmAdapter;
    }
    async submitPrompt(query) {
      throw new Error("submitPrompt method must be implemented")
    }
}

let restApiInstance;
class RestApi extends ApiAdapter {
    constructor() {
        super()
        if(restApiInstance) {
          throw new Error("Only 1 RestAPI instance can be created")
        }
        restApiInstance = this;
    }  
    async submitPrompt(rawQuery) {
        console.log(rawQuery)
        const restQuery = await this._llmAdapter.buildRestQuery(rawQuery);
        console.log(restQuery)
        const restOperation = post({
          apiName: customconfig.apiName,
          path: restQuery.path,
          options: {
            body: {
              ...restQuery.parameters
            },
            headers: {
              Authorization: await fetchAuthToken(),
            },
          },
        });
        const { body } = await restOperation.response;
        console.log(`POST call succeeded ${body}`);
        const rawResponseJson = await body.json();
        const response = this._llmAdapter.buildRestResponse(rawResponseJson);
        return response;
    }
    async configure(llmAdapter) {
      super._llmAdapter = llmAdapter;
    }    
}

let restApiAdapter = new RestApi();
export {restApiAdapter};