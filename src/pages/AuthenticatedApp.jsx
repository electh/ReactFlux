import App from "@/App"
import AppDataProvider from "@/components/AppDataProvider"

const AuthenticatedApp = () => (
  <AppDataProvider>
    <App />
  </AppDataProvider>
)

export default AuthenticatedApp
