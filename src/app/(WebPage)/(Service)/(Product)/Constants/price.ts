export const PLATFORM_FEE = 0.05;

export const getFinalPrice = (price: number) => {
  return +(price * (1 + PLATFORM_FEE)).toFixed(2);
};

export const getPlatformFee = (price: number) => {
  return +(price * PLATFORM_FEE).toFixed(2);
};