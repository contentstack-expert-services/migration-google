const stringSimilarity = require('string-similarity');

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

module.exports = {
  formatName,
  flatten,
  filteredArraySection,
  separateSection,
  contentArray
}
