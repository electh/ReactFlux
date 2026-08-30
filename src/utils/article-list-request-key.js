const articleListContentKeyFields = ["filterDate", "filterString", "infoFrom", "infoId"]

const articleListSettingsKeyFields = [
  "orderBy",
  "orderDirection",
  "pageSize",
  "showHiddenFeeds",
  "showStatus",
]

const pickFields = (source, fields) => {
  const picked = {}

  for (const field of fields) {
    picked[field] = source[field]
  }

  return picked
}

const createArticleListRequestKey = ({ content, settings, info }) => {
  const contentKey = pickFields(content, articleListContentKeyFields)
  const settingsKey = pickFields(settings, articleListSettingsKeyFields)

  if (info) {
    contentKey.infoFrom = info.from
    contentKey.infoId = info.id
  }
  if (["starred", "history"].includes(contentKey.infoFrom)) {
    settingsKey.orderBy = null
  }
  if (["feed", "starred", "history"].includes(contentKey.infoFrom)) {
    settingsKey.showHiddenFeeds = null
  }

  return JSON.stringify({ ...contentKey, ...settingsKey })
}

export default createArticleListRequestKey
