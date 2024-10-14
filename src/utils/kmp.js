// 计算 LPS 数组
const computeLPSArray = (pattern) => {
  const lps = new Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else if (len !== 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0;
      i++;
    }
  }
  return lps;
};

// KMP 搜索主体算法
export const kmpSearch = (text, pattern, ignoreCase = true) => {
  // TODO: ignoreCase 添加为可配置项
  const adjustedText = ignoreCase ? text.toLowerCase() : text;
  const adjustedPattern = ignoreCase ? pattern.toLowerCase() : pattern;

  if (adjustedPattern.length === 0) {
    return 0; // 处理空模式
  }

  const lps = computeLPSArray(adjustedPattern); // 预计算 lps 数组
  let i = 0;
  let j = 0;

  while (i < adjustedText.length) {
    if (adjustedText[i] === adjustedPattern[j]) {
      i++;
      j++;
    } else if (j !== 0) {
      j = lps[j - 1]; // 利用 lps 进行回溯
    } else {
      i++;
    }

    if (j === adjustedPattern.length) {
      return i - j; // 找到匹配位置
    }
  }
  return -1; // 未找到匹配
};

// 解析查询语句
export const parseQuery = (query) => {
  const includeTerms = [];
  const excludeTerms = [];
  let exactPhrases = [];
  const orConditions = [];

  // 处理带引号的短语，考虑前缀
  const exactMatches = query.match(/([-+|]?)\s*"([^"]+)"/g);
  let queryCopy = query;

  if (exactMatches) {
    exactPhrases = exactMatches.map((match) => {
      const prefix = match.trim()[0]; // 获取前缀
      const phrase = match.match(/"([^"]+)"/)[1]; // 提取短语内容

      // 根据前缀处理不同的逻辑
      switch (prefix) {
        case "-":
          excludeTerms.push(phrase);
          break;
        case "+":
          includeTerms.push(phrase);
          break;
        case "|":
          orConditions.push([phrase]);
          break;
        default:
          includeTerms.push(phrase);
          break;
      }

      return phrase;
    });

    // 从查询字符串中移除已处理的带引号短语
    queryCopy = query.replace(/([-+|]?)\s*"([^"]+)"/g, "");
  }

  // 处理剩余的不带引号的部分
  const terms = queryCopy.split(/\s+/);
  for (const term of terms) {
    const strippedTerm = term.replace(/^[-+|]/, ""); // 移除可能的前缀符号
    if (term.startsWith("-") && strippedTerm) {
      excludeTerms.push(strippedTerm);
    } else if (term.startsWith("+") && strippedTerm) {
      includeTerms.push(strippedTerm);
    } else if (term.includes("|")) {
      const subTerms = term.split("|").filter((t) => t); // 过滤空字符串
      if (subTerms.length > 0) {
        orConditions.push(subTerms);
      }
    } else if (strippedTerm) {
      // 检查剥离前缀后的项是否仍然有效
      includeTerms.push(strippedTerm);
    }
  }

  return { includeTerms, excludeTerms, exactPhrases, orConditions };
};

// 过滤数据
export const filterData = (data, query, fields = [], ignoreCase = true) => {
  const { includeTerms, excludeTerms, exactPhrases, orConditions } =
    parseQuery(query);

  const checkField = (itemValue) => {
    // 检查排除项
    if (
      excludeTerms.some((term) => kmpSearch(itemValue, term, ignoreCase) !== -1)
    ) {
      return false;
    }

    // 检查精确匹配项
    if (
      exactPhrases.length > 0 &&
      !exactPhrases.some(
        (phrase) => kmpSearch(itemValue, phrase, ignoreCase) !== -1,
      )
    ) {
      return false;
    }

    // 检查包含项
    const includeMatch = includeTerms.every(
      (term) => kmpSearch(itemValue, term, ignoreCase) !== -1,
    );

    // 检查 OR 逻辑
    const orMatch =
      orConditions.length === 0 ||
      orConditions.some((group) =>
        group.some((term) => kmpSearch(itemValue, term, ignoreCase) !== -1),
      );

    return includeMatch && orMatch;
  };

  return data.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return (
        typeof value === "string" &&
        checkField(ignoreCase ? value.toLowerCase() : value)
      );
    }),
  );
};

// 主函数
export const filterByQuery = (data, query, fields = [], ignoreCase = true) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid data input:", {
      receivedData: data,
      type: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : "N/A",
    });
    return [];
  }
  if (typeof query !== "string" || query.trim().length === 0) {
    console.error("Invalid query input:", {
      receivedQuery: query,
      type: typeof query,
      trimmedLength: typeof query === "string" ? query.trim().length : "N/A",
    });
    return [];
  }
  return filterData(data, query, fields, ignoreCase);
};
