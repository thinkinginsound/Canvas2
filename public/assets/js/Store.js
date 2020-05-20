class UserStore {
  constructor () {
    this._data = {};
  }

  set (id, value) {
    if(!this._data.hasOwnProperty(id))return false;
    this._data[id] = value;
    return true;
  }

  add(id, value){
    this._data[id] = value;
  }

  remove(id){
    if(!this._data.hasOwnProperty(id))return false;
    this._data[id] = undefined;
    delete this._data[id];
    return true;
  }

  get (id, defaultResult) {
    if(!this._data.hasOwnProperty(id))return defaultResult;
    return this._data[id];
  }
}

const Store = new UserStore();
Object.freeze(Store);

export default Store;
