import { CHAT_HEADER, PUBSUB_CONSTANTS } from "../../utils/constants";
import ChatIcon from "../../../images/ChatIcon.png";
import ProfileIcon from "../../../images/ProfileIcon.png";
import FrameIcon from "../../../images/FrameIcon.png";
import UserIcon from "../../../images/UserIcon.png";
import CollapseIcon from "../../../images/CollapseIcon.png";
import { $id, $query } from "../../utils/dom";
import "../../scss/main.scss";
import { ChatService } from "../../services/chat";
import pubsub from "../../shared/pubsub";
import { attachChatIntentEvents } from "../chat-intent/chatIntent";
import chatIconSvg from "../../assests/icons/icons.svg";
import { $cameraQuery } from "../../entity-models/camera";

export const loadChat = (container: string) => {
  const visualizerContainer = $id(container);
  if (visualizerContainer) {
    visualizerContainer.insertAdjacentHTML(
      "beforeend",
      renderChat([
      
      ])
    );
    attachChatCollapseEvent();
    attachChatSubmitEvent();
    attachVoiceInputEvent();
    pubsub.subscribe(PUBSUB_CONSTANTS.CHAT_QUERY_RESOLVED, (chat: IQuesAns) => {
      const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      chatHistory.push(chat);
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    
      const chatListContainer = $query(".chat-list-container");
      const chatList = $query(".chat-list");
      if (chatList && chatListContainer) {
        chatList.insertAdjacentHTML("beforeend", renderQuery(chat));
        (chatListContainer as Element).scrollTop = (chatListContainer as Element).scrollHeight;
      }
    });
    
  }
};

export const renderQuery = ({ answer, query, id }: IQuesAns) => {
  return `
    <div class="chat-list-item query-${id}">
      <img src=${ProfileIcon}/>
      <p>${query}</p>
    </div>
    <div class="chat-list-item answer-${id}">
      <img src=${UserIcon}/>
      <p class="answer-p-${id}">${answer}</p>
    </div>
  `;
};

export const renderChat = (chats: IQuesAns[]) => {
  return `
    <div class="chat-container">
      <div class="chat-header">
        <svg class ="chat-bot">
          <use xlink:href="${chatIconSvg}#messangerIcon"></use>
        </svg>
        <div class="chat-heading h3-b">
          <h3>${CHAT_HEADER}</h3>
          <p class="label">Voice-Enabled Car Configuration</p>
        </div>
        <svg class="chat-collapse-icon rotate">
            <use xlink:href="${chatIconSvg}#arrowIcon" ></use>
        </svg>
      </div>
      <div class="chat-body">
        <div class="chat-list-container">
          <ul class="chat-list">
            ${chats.map((chat) => renderQuery(chat)).join("")}
          </ul>
        </div>
        <div class="chat-input-container">
          <input type="text" class="chat-input" placeholder="Type your message...">
          <svg class="voice-input radius-50">
            <use xlink:href="${chatIconSvg}#micIcon" ></use>
          </svg>
          <button class="chat-submit disable">
            <svg>
              <use xlink:href="${chatIconSvg}#submitIcon" ></use>
            </svg> 
          </button>
          <div class="typing hidden">
            <span></span>
            <span></span>
            <span></span>
        </div>
        </div>
      </div>
    </div>
  `;
};

export const attachChatCollapseEvent = () => {
  const toggleButton = $query('.chat-collapse-icon');
  const chatWindow = $query('.chat-container');
  const chatHeader = $query('.chat-header');

  if (toggleButton && chatWindow && chatHeader) {
    chatHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleButton.classList.toggle("rotate");
      chatWindow.classList.toggle("chat-open");
    });

    chatWindow.addEventListener('mousedown', (e) => e.stopPropagation());
    chatWindow.addEventListener('mouseup', (e) => e.stopPropagation());
    chatWindow.addEventListener('mousemove', (e) => e.stopPropagation());
    chatWindow.addEventListener('wheel', (e) => e.stopPropagation());
  }
};



export const attachVoiceInputEvent = () => {
  const startListeningBtn = $query(".voice-input") as HTMLElement;
  const inputField = $query(".chat-input") as HTMLInputElement;
  const chatSubmitButton = $query(`.chat-submit`)!;
  let recognition: SpeechRecognition | null = null;

  const startListening = () => {
    startListeningBtn.classList.add("pulse");
    recognition = new ((window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition)();
    recognition!.lang = "en-US";


    recognition!.start();
    recognition!.start = () => {
      console.log("Speech recognition started");
    };

    recognition!.onresult = (event: SpeechRecognitionEvent) => {
      const speechToText: string =
        event.results[event.results.length - 1][0].transcript;
      inputField.value += speechToText;
      inputField.focus();
      console.log("Speech to text: ", speechToText);
    };

    recognition!.onend = () => {
      console.log("Speech recognition ended");
     
    };

    recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error occurred: " + event.error);
    };
  };

  const stopListening = async () => {
    if (recognition) {
      startListeningBtn.classList.remove("pulse");
      recognition.stop();
      await chatSubmitHandler(inputField, chatSubmitButton);
      console.log("Stopped speech recognition");
    }
  };

  if (startListeningBtn) {
    startListeningBtn.addEventListener("mousedown", startListening);
    startListeningBtn.addEventListener("mouseup", stopListening);
  } else {
    console.error("Voice input button not found.");
  }
};

export let controlsEnabled = true

export const attachChatSubmitEvent = () => {
  const chatInputField = $query(`.chat-input`) as HTMLInputElement;
  const chatSubmitButton = $query(`.chat-submit`);

  // Add event listeners for focus and blur
  chatInputField.addEventListener("focus", () => {
    controlsEnabled = false; // Disable movement controls when focused
  });

  chatInputField.addEventListener("blur", () => {
    controlsEnabled = true; // Re-enable movement controls when not focused
  });

  if (chatInputField && chatSubmitButton) {
    chatInputField.addEventListener("input", () => {
      if (chatInputField.value.trim() !== "") {
        chatSubmitButton.classList.remove("disable");
      } else {
        chatSubmitButton.classList.add("disable");
      }
    });

    chatInputField.addEventListener("keydown", async (event) => {
      if (
        (event as KeyboardEvent).key === "Enter" &&
        chatInputField.value.trim() !== ""
      ) {
        await chatSubmitHandler(chatInputField, chatSubmitButton);
      }
    });

    chatSubmitButton.addEventListener("click", async () => {
      await chatSubmitHandler(chatInputField, chatSubmitButton);
    });
  }
};


export const chatSubmitHandler = async (
  chatInputElement: HTMLInputElement,
  chatSubmitButton: Element
) => {
  if (chatInputElement.value.trim()) {
    try {
      $query(".chat-input-container")?.classList.add("disable");
      ($query(".voice-input") as HTMLElement).style.cursor = "not-allowed";
      // const sceneId = localStorage.getCurrentSceneId();
      chatSubmitButton.classList.add("disable");
      chatSubmitButton.classList.add("hide");
      $query(".typing")?.classList.remove("hidden");
      const queryText = chatInputElement.value.trim();

      // Publish the query
      pubsub.publish(PUBSUB_CONSTANTS.CHAT_QUERY_PUBLISHED, queryText);

      const { response } = await ChatService.getAction({
        query: queryText,
        role: "user",
      });
      await attachChatIntentEvents(queryText, response);
    } catch (err: any) {
      console.log(err);
    } finally {
      $query(".chat-input-container")?.classList.remove("disable");
      chatSubmitButton.classList.remove("hide");
      $query(".typing")?.classList.add("hidden");
      ($query(".voice-input") as HTMLElement).style.cursor = "pointer";

      // Clear the chat input field after submitting
      chatInputElement.value = "";
    }
  }
};


export const chatLoading = () => {
  return `
  <div class="typing">
  <span class="dot-width dot-color speed"></span>
  <span class="dot-width dot-color speed"></span>
  <span class="dot-width dot-color speed"></span>
</div>`;
};