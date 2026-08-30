import isURL from "validator/lib/isURL"

export const getAuthSessionKey = ({ server, token, username, password }) =>
  JSON.stringify([server, token, username, password])

const isValidAuth = (auth) => {
  const { server, token, username, password } = auth
  if (!server || !isURL(server, { require_protocol: true })) {
    return false
  }
  return token || (username && password)
}

export default isValidAuth
