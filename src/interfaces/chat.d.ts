interface IGetChatResponse extends IQuesAns {
  selection?: IStorageSelection;
}

interface IQuesAns {
  id: string;
  query: string;
  answer: string;
}

interface IMessage {
  content: string;
  role: string;
}

interface IGetChatRequest {
  sceneId: number;
  query: string;
}

interface IGetActionRequest {
  query: string;
  role: string;
}

interface IGetActionIntent {
  intent: string;
  value: string | boolean;
  message: string;
}

interface IGetActionResponse {
  response: IGetActionIntent;
}

interface IGetQuestionAnswerRequest {
  query: string;
  role: string;
}
