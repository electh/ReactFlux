import { useContext } from "react"

import { ContentContext } from "@/components/Content/ContentContext"

const useContentContext = () => useContext(ContentContext)

export default useContentContext
