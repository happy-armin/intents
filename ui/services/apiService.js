import { API_URL } from "@/config/constants";

const { default: axios } = require("axios");

const axiosInstance = axios.create({
  baseURL: API_URL,
});

export const apiService = {
  submitOrder: async (data) => {
    const response = await axiosInstance.post("/", data);
    return response.data;
  },
  tokenPrice: async (url) => {
    const priceAxiosInstance = axios.create({
      baseURL: url,
    });

    const response = await priceAxiosInstance.get("/");
    return response.data;
  },
};
