class Store {
  storage: ICacheStorage;
  constructor() {
    this.storage = {} as ICacheStorage;
  }
}

export default new Store();
