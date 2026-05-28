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

  if (info) {
    contentKey.infoFrom = info.from
    contentKey.infoId = info.id
  }

  return JSON.stringify({
    ...contentKey,
    ...pickFields(settings, articleListSettingsKeyFields),
  })
}

export default createArticleListRequestKey
