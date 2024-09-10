export const generateKey = (functionName, ...arguments_) =>
  `${functionName}-${arguments_.join("-")}`;
