import axios from "axios";


const defaultOptions = {
  baseURL: 'https://vyom-api.kubepipe.in',
  headers: {
    "Content-Type": "application/json",
  },
};

const instance = axios.create(defaultOptions);

export default instance;
