const stringSimilarity = require('string-similarity');
const _ = require("lodash");
const rteMapper = require('./rteMapper');
const helper = require('../helper');
const replaceTags = require('./replaceTags');

function formatName(input) {
  return input
    ?.replace(/_+/g, ' ')              // Replace underscores with spaces
    ?.replace(/\b(\w)/g, (match) => match?.toUpperCase());  // Capitalize the first letter of each word
}

function flatten(data) {
  var result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + "." + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
}

const filteredArraySection = (inputArray) => [...new Set(inputArray?.map?.((element) => element?.split(".")?.[0]))];

const separateSection = (inputArray, searchStrings, type = "sections", isCut = false) => {
  const result = [];
  searchStrings?.forEach?.((element) => {
    let keys = inputArray?.filter?.((item) => item?.includes(element))
    if (keys?.length) {
      if (isCut) {
        keys = keys?.map((key) => {
          return key?.split(`${element}.`)?.[1]
        });
      }
      result.push({ keys })
    }
  });
  return { type, sections: result }
}

const contentArray = (strings) => {
  const regex = /content\[\d+\]/g;
  const data = strings.map?.((str) => {
    const isStr = str?.match(regex) || []
    if (isStr?.length >= 1) {
      return isStr?.[0]
    } else {
      console.log("Content is present than one", str?.length)
    }
  });
  if (data?.length) {
    return [...new Set(data)];
  } else {
    return []
  }
};

function checkTags(htmlString) {
  const tagRegex = /<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/g;
  const tags = htmlString.match(tagRegex) || [];
  const tagCount = {};
  let incompleteTag = null;
  let tagName = null;

  tags.forEach(tag => {
    tagName = tag.replace(/<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/, '$1');
    tagCount[tagName] = (tagCount[tagName] || 0) + ((tag.startsWith('</p') || tag.startsWith('<p') ? -1 : 1));
    if (tagCount?.[tagName] < 1) {
      incompleteTag = tag;
    }
  });
  let hasIncomplete = false;
  Object?.entries(tagCount)?.forEach(([key, value]) => {
    if (value !== (0 || -2)) {
      hasIncomplete = true;
    }
  });
  return {
    hasIncomplete,
    incompleteTag,
    tagName
  };
}

const paragraphWrapper = (data) => {
  let obj = {};
  const newData = [];
  const paragraphArray = extractItemsBetweenTags(data, "<p>", "</p>");
  paragraphArray?.result?.forEach((chd) => {
    if (chd?.tagName === "i" ||
      chd?.tagName === "br" ||
      chd?.tagName === "b" ||
      chd?.tagName === "article" ||
      chd?.tagName === "section") {
      const paraData = rteMapper({ type: "paragraph", text: chd?.text });
      newData?.push(replaceTags({ data: paraData }))
    } else {
      if (chd?.tagName === "p" || chd?.tagName === null) {
        const paraData = rteMapper({ type: "paragraph", text: chd?.text });
        newData?.push(replaceTags({ data: paraData }))
      } else {
        newData?.push(chd)
      }
    }
  })
  return newData;
}



const objectNester = (body, title) => {
  const children = [];
  body?.forEach?.((item) => {
    for ([key, value] of Object?.entries?.(item)) {
      if (_.isObject(value)) {
        if (value?.schemaType) {
          const data = rteMapper({ type: value?.schemaType, data: value, entryName: title });
          children?.push(data)
        } else if (value?.text) {
          children?.push({ text: value?.text, contentId: helper?.uidGenrator(), ...checkTags(value?.text) });
        }
      } else {
        console.log(`${key} : ${value}`);
      }
    }
  })
  // console.log("=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> outer", JSON.stringify(children))
  return paragraphWrapper(children)
}

const extractItemsBetweenTags = (data, startTag, endTag) => {
  let result = [];
  let indexs = [];
  let startIndex = null;
  let endIndex = null;
  let newEndIndex = null;
  let newStartIndex = null;
  let isInBetween = false;
  data?.forEach((item, index) => {
    let prevStartIndex = newStartIndex;
    let prevEndIndex = newEndIndex;
    if (item?.incompleteTag === startTag) {
      newStartIndex = index;
      startIndex = index;
      isInBetween = true;
      obj = rteMapper({ type: "paragraph", text: helper.removeTags(item?.text) })
      result.push({ index, ...obj });
    } else if (isInBetween) {
      if (item?.incompleteTag === endTag) {
        endIndex = index;
        newEndIndex = index;
        isInBetween = false;
        if (result?.[prevStartIndex]?.children?.length) {
          if (item?.text) {
            result[prevStartIndex].children?.push({ text: helper.removeTags(item?.text) })
          } else {
            result[prevStartIndex].children?.push(item)
          }
        } else {
          result.push(item);
        }
      } else {
        if (result?.[prevStartIndex]?.children?.length) {
          if (item?.text && (item?.hasIncomplete === false || item?.hasIncomplete)) {
            result[prevStartIndex].children?.push({ text: helper.removeTags(item?.text) })
          } else {
            result[prevStartIndex].children?.push(item)
          }
        } else {
          if (item?.type === "a") {
            result.push(replaceTags({ data: item }))
          } else {
            result.push(item);
          }
        }
      }
    } else {
      result.push(item);
    }
    if ((prevStartIndex !== newStartIndex || prevEndIndex !== newEndIndex) && newStartIndex < newEndIndex) {
      indexs?.push({ startIndex: newStartIndex, endIndex: newEndIndex })
    }
  })
  return { startIndex, endIndex, result, indexs };
}

module.exports = {
  formatName,
  flatten,
  filteredArraySection,
  separateSection,
  contentArray,
  objectNester,
  paragraphWrapper,
  extractItemsBetweenTags,
}
