const stringSimilarity = require('string-similarity');
const _ = require("lodash");
const rteMapper = require('./rteMapper');

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
    tagCount[tagName] = (tagCount[tagName] || 0) + ((tag.startsWith('</') || tag.startsWith('<') ? -1 : 1));
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
  const paragraphArray = extractItemsBetweenTags(data, "<p>", "</p>")
  paragraphArray?.result?.forEach((chd) => {
    if (chd?.tagName === "p" && chd?.hasIncomplete) {
      if (chd?.incompleteTag === "<p>") {
        obj = rteMapper({ type: "paragraph", text: chd?.text })
      } else if (chd?.incompleteTag === "</p>") {
        obj?.children?.push({ text: chd?.text })
      }
    } else {
      if (chd?.text && chd?.hasIncomplete === false) {
        // console.log("🚀 ~ file: index.js:108 ~ paragraphArray?.result?.forEach ~ chd?.incompleteTag:", chd?.text && chd?.incompleteTag === null)
        obj?.children?.push({ text: chd?.text })
      } else {
        obj?.children?.push(chd)
      }
    }
  })
  data?.forEach((item, index) => {
    if (paragraphArray?.startIndex && paragraphArray?.endIndex) {
      if (paragraphArray?.startIndex === index) {
        newData?.push(obj);
      }
      if (index > paragraphArray?.endIndex || index < paragraphArray?.startIndex) {
        if (item?.tagName === "p") {
          newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
        } else {
          newData?.push(item);
        }
      }
    } else {
      if (item?.tagName === "p") {
        newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
      } else {
        newData?.push(item);
      }
    }
  })
  return newData;
}



const objectNester = (body) => {
  const children = [];
  body?.forEach?.((item) => {
    for ([key, value] of Object?.entries?.(item)) {
      if (_.isObject(value)) {
        if (value?.schemaType) {
          children?.push(rteMapper({ type: value?.schemaType, data: value }))
        } else if (value?.text) {
          children?.push({ text: value?.text, ...checkTags(value?.text) });
        }
      } else {
        console.log(`${key} : ${value}`);
      }
    }
  })
  return paragraphWrapper(children)
}

const extractItemsBetweenTags = (data, startTag, endTag) => {
  let result = [];
  let startIndex = null;
  let endIndex = null;
  let isInBetween = false;
  data?.forEach((item, index) => {
    if (item?.incompleteTag === startTag) {
      startIndex = index;
      isInBetween = true;
      result.push(item);
    } else if (isInBetween) {
      if (item?.incompleteTag === endTag) {
        endIndex = index;
        isInBetween = false;
        result.push(item);
      } else {
        result.push(item);
      }
    }
  })
  return { startIndex, endIndex, result };
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
