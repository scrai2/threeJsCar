import apiClient from "./apiClient";

const getAction = async (reqObj: IGetActionRequest) => {
  const { query, role } = reqObj;
  const { data } = await apiClient.post<IGetActionResponse>("/get_action/", {
    messages: [{ content: query, role }],
  });
  return data;
};

const getQuestionAnswer = async (reqObj: IGetQuestionAnswerRequest) => {
  const { query, role } = reqObj;

  // const baseURL = process.env.BASE_URL;

  const data = await fetch(`https://vyom-api.exsq.ai/ask_question/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ content: query, role }],
    }),
  });
  return data.body?.getReader();
};

// const getMessages = () => {
//   const chats = localStorage.getChats();
//   let messages = [] as IMessage[];
//   if (chats.length === 0) {
//     return messages;
//   } else if (chats.length <= 3) {
//     chats.forEach((chat) => {
//       messages.push({ content: chat.query, role: "user" });
//       messages.push({ content: chat.answer, role: "assistant" });
//     });
//   } else {
//     chats.slice(-3).forEach((chat) => {
//       messages.push({ content: chat.query, role: "user" });
//       messages.push({ content: chat.answer, role: "assistant" });
//     });
//   }
//   return messages;
// };

export const ChatService = { getAction, getQuestionAnswer };
