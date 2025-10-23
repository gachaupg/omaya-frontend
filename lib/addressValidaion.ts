interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateWalletAddress = (
  address: string,
  networkType: string
): ValidationResult => {
 

  // Normalize network type
  const normalizedNetwork = networkType.toUpperCase();

  switch (normalizedNetwork) {
    case "TRC20":
    case "TRON":
    case "TRC":
      if (!/^T[A-Za-z1-9]{33}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid BEP20 wallet address",
        };
      }
      break;
    case "BEP20":
    case "BSC":
    case "BINANCE":
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid BEP20 wallet address",
        };
      }
      break;
    case "ERC20":
    case "ETH":
    case "ETHEREUM":
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return {
          isValid: false,
          message: "Please enter a valid ERC20/ETH wallet address",
        };
      }
      break;
    case "BTC":
    case "BITCOIN":
      // Bitcoin addresses can be legacy (1...), segwit (3...), or native segwit (bc1...)
      // if (
      //   !/^(1|3)[A-Za-z0-9]{25,34}$/.test(address) &&
      //   !/^bc1[A-Za-z0-9]{25,90}$/.test(address)
      // ) {
      //   return {
      //     isValid: false,
      //     message: "Please enter a valid Bitcoin wallet address",
      //   };
      // }
      break;
    default:

      // Fallback validation for unknown network types
      // Check if it looks like a valid crypto address
      if (address.length >= 26 && address.length <= 90) {
        // Basic validation: check if it contains only valid characters
        const validChars = /^[A-Za-z0-9]+$/;
        if (validChars.test(address)) {
          return {
            isValid: true,
          };
        }
      }

      return {
        isValid: false,
        message: `Unsupported network type: ${networkType}. Supported networks: TRC20, BEP20, ERC20, ETH, BTC`,
      };
  }

  console.log("Validation successful for network:", normalizedNetwork);
  return {
    isValid: true,
  };
};
