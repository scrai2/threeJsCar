const $id = (id: string, element?: HTMLElement) =>
  element ? element.querySelector(`#${id}`) : document.getElementById(id);

const $query = (selector: string, element?: HTMLElement) =>
  element ? element.querySelector(selector) : document.querySelector(selector);

const $queryAll = (selector: string, element?: HTMLElement) =>
  element
    ? element.querySelectorAll(selector)
    : document.querySelectorAll(selector);

const clearChatInputField = () => {
  const chatInputElement = $query(`.chat-input`);
  if (chatInputElement) {
    (chatInputElement as HTMLInputElement).value = "";
  }
};

export { $id, $query, $queryAll, clearChatInputField };
