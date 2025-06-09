interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateWalletAddress = (
  address: string,
  networkType: string
): ValidationResult => {
  switch (networkType) {
    case "TRC20":
      if (!/^T[A-Za-z1-9]{33}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid TRC20 wallet address",
        };
      }
      break;
    case "BEP20":
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid BEP20 wallet address",
        };
      }
      break;
    case "ERC20":
    case "ETH":
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid ERC20/ETH wallet address",
        };
      }
      break;
    default:
      return {
        isValid: false,
        message: "Unsupported network type",
      };
  }

  return {
    isValid: true,
  };
};
