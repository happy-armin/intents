import { PRICE_API_URL, UNIV3POOL_ADDRESSES } from "@/config/constants";
import { apiService } from "@/services/apiService";

export const getTokenPrice = async (symbol) => {
  const poolAddress = UNIV3POOL_ADDRESSES.find(
    (pool) => pool.symbol === symbol
  );

  if (!poolAddress) {
    return null;
  }

  const API_URL = PRICE_API_URL + poolAddress.address;

  const result = await apiService.tokenPrice(API_URL);

  return result.pair.priceUsd;
};
