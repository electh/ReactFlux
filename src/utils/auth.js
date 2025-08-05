import isURL from "validator/lib/isURL"

const isValidAuth = (auth) => {
  const { server, token, username, password } = auth
  if (!server || !isURL(server, { require_protocol: true })) {
    return false
  }
  return token || (username && password)
}

export default isValidAuth
