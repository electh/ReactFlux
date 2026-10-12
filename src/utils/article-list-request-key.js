const articleListContentKeyFields = [
  "articleListRevision",
  "filterDate",
  "filterString",
  "infoFrom",
  "infoId",
]

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

const createArticleListRequestKey = ({ content, settings, info, sessionRevision }) => {
  const contentKey = pickFields(content, articleListContentKeyFields)
  const settingsKey = pickFields(settings, articleListSettingsKeyFields)

  if (info) {
    contentKey.infoFrom = info.from
    contentKey.infoId = info.id
  }
  if (contentKey.infoFrom === "home") {
    return JSON.stringify({
      articleListRevision: contentKey.articleListRevision,
      infoFrom: contentKey.infoFrom,
      infoId: contentKey.infoId,
      pageSize: settings.pageSize,
      showHiddenFeeds: settings.showHiddenFeeds,
      sessionRevision,
    })
  }

  if (["starred", "history"].includes(contentKey.infoFrom)) {
    settingsKey.orderBy = null
  }
  if (contentKey.infoFrom === "feed") {
    settingsKey.showHiddenFeeds = null
  }

  return JSON.stringify({ ...contentKey, ...settingsKey })
}

export default createArticleListRequestKey
