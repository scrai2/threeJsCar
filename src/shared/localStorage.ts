import cacheStorage from "./cacheStorage";

export class LocalStorage {
  key: string;
  constructor() {
    this.key = "container";
  }

  getItem(): ILocalStorage {
    const data = sessionStorage.getItem(this.key);
    return data ? JSON.parse(data) : "";
  }

  setItem(data: ILocalStorage) {
    data.date = new Date().getTime();
    sessionStorage.setItem(this.key, JSON.stringify(data));
  }

  clearStorage() {
    sessionStorage.removeItem(this.key);
  }

  isStorageValid() {
    let isValid = true;
    const data = this.getItem();
    if (data && data.date) {
      var diff = (new Date().getTime() - data.date) / 1000 / 60;
      diff = Math.abs(Math.round(diff));
      if (diff >= 120) {
        isValid = false;
      }
    }
    return isValid;
  }

  init(chats: IQuesAns[]) {
    const data = this.getItem();
    if (!data) {
      this.setItem({
        chats: [...chats],
        date: new Date().getTime(),
      });
    }
  }

  getChats() {
    const data = this.getItem();
    if (data) {
      return data.chats;
    } else {
      return [] as IQuesAns[];
    }
  }

  setChat(chat: IQuesAns) {
    const data = this.getItem();
    if (data) {
      this.setItem({ ...data, chats: [...data.chats, chat] });
    }
  }
}

export default new LocalStorage();
