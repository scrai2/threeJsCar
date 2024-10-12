import axios from "axios";


const defaultOptions = {
  baseURL: 'https://vyom-api.exsq.ai',
  headers: {
    "Content-Type": "application/json",
  },
};

const instance = axios.create(defaultOptions);

export default instance;
