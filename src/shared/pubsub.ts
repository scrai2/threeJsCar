import { PUBSUB_CONSTANTS } from "../utils/constants";
type EventCallback = (...args: any[]) => void;

class PubSub {
  private events: { [key: string]: EventCallback[] } = {};

  subscribe(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  unsubscribe(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  publish(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event].forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event ${event} subscribers:`, error);
      }
    });
  }

  clear() {
    if (this.events[PUBSUB_CONSTANTS.CHAT_QUERY_RESOLVED]) {
      this.events = {
        chatQueryResolved: this.events[PUBSUB_CONSTANTS.CHAT_QUERY_RESOLVED],
      };
    } else {
      this.events = {};
    }
  }
}

export default new PubSub();
