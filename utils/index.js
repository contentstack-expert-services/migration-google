const stringSimilarity = require('string-similarity');
const _ = require("lodash");
const rteMapper = require('./rteMapper');
const helper = require('../helper');

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
  // console.log("🚀 ~ file: index.js:101 ~ paragraphWrapper ~ paragraphArray:", paragraphArray?.result)
  // const indexing = [];
  // paragraphArray?.indexs?.forEach((ind) => {
  //   const comp = [];
  //   data?.forEach((item, index) => {
  //     if (ind?.startIndex !== null && ind?.startIndex <= index && index <= ind?.endIndex) {
  //       comp?.push(item);
  //     }
  //   })
  //   let obj = {};
  //   comp?.forEach((chd) => {
  //     if (chd?.tagName === "p" && chd?.hasIncomplete) {
  //       if (chd?.incompleteTag === "<p>") {
  //         obj = rteMapper({ type: "paragraph", text: chd?.text })
  //         obj.attrs = { contentId: chd?.contentId }
  //       } else if (chd?.incompleteTag === "</p>") {
  //         obj?.children?.push({ text: chd?.text })
  //       }
  //     } else {
  //       if (chd?.text && chd?.hasIncomplete === false) {
  //         obj?.children?.push({ text: chd?.text })
  //       } else {
  //         obj?.children?.push(chd)
  //       }
  //     }
  //   })
  //   indexing?.push({ ...ind, result: obj })
  // })
  // const newTry = [];
  // data?.forEach((ele) => {
  //   const dat = indexing?.find((item) => {
  //     if (item?.result?.attrs?.contentId === ele?.contentId) {
  //       return item?.result
  //     }
  //   })
  //   if (dat?.result) {
  //     newTry?.push(dat?.result)
  //   } else {
  //     newTry?.push(ele)
  //   }
  // })
  console.log(" ============>>>>>>>>>>>>>>>>>>> ");
  // console.log(JSON.stringify(newTry))
  // const newFinalDAta = [];
  // newTry?.forEach((item, index) => {
  //   if (item?.attrs?.["display-type"]) {
  //     newFinalDAta?.push(item);
  //   } else if (item?.type === "p") {
  //     newFinalDAta?.push(item);
  //   } else {
  //     let notAdd = true;
  //     paragraphArray?.result?.forEach((ele) => {
  //       if (item?.contentId !== undefined) {
  //         if (item?.contentId !== ele?.contentId) {
  //           notAdd = false;
  //         }
  //       } else if (item?.uid !== undefined) {
  //         if (item?.uid !== ele?.uid) {
  //           notAdd = false;
  //         }
  //       } else {
  //         console.log("bach gaya", item)
  //       }
  //     })
  //     if (notAdd !== true) {
  //       newFinalDAta?.push(item);
  //     }
  //   }
  // })

  paragraphArray?.result?.forEach((chd) => {
    if (chd?.tagName === "i" || chd?.tagName === "br" || chd?.tagName === "b") {
      newData?.push(rteMapper({ type: "paragraph", text: chd?.text }))
    } else {
      if (chd?.tagName === "p" || chd?.tagName === null) {
        newData?.push(rteMapper({ type: "paragraph", text: chd?.text }))
      } else {
        newData?.push(chd)
      }
    }
  })
  // paragraphArray?.result?.forEach((chd) => {
  //   if (chd?.tagName === "p" && chd?.hasIncomplete) {
  //     if (chd?.incompleteTag === "<p>") {
  //       obj = rteMapper({ type: "paragraph", text: chd?.text })
  //     } else if (chd?.incompleteTag === "</p>") {
  //       obj?.children?.push({ text: chd?.text })
  //     }
  //   } else {
  //     if (chd?.text && chd?.hasIncomplete === false) {
  //       obj?.children?.push({ text: chd?.text })
  //     } else {
  //       obj?.children?.push(chd)
  //     }
  //   }
  // })

  // data?.forEach((item, index) => {
  //   if (typeof paragraphArray?.startIndex === "number" && typeof paragraphArray?.endIndex === "number") {
  //     if (paragraphArray?.startIndex === index) {
  //       newData?.push(obj);
  //     } else {
  //       if (index > paragraphArray?.endIndex || index < paragraphArray?.startIndex) {
  //         if (item?.tagName === "p") {
  //           newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
  //         } else {
  //           if (item?.tagName === null) {
  //             newData?.push({ text: item?.text, myra: "myra" });
  //           } else {
  //             newData?.push(item);
  //           }
  //         }
  //       }
  //     }
  //   } else {
  //     if (item?.tagName === "p") {
  //       newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
  //     } else {
  //       if (item?.tagName === null) {
  //         newData?.push({ text: item?.text, nutan: "nutan" });
  //       } else {
  //         newData?.push(item);
  //       }
  //     }
  //   }
  // })
  return newData;
}



const objectNester = (body, title) => {
  const children = [];
  body?.forEach?.((item) => {
    for ([key, value] of Object?.entries?.(item)) {
      if (_.isObject(value)) {
        if (value?.schemaType) {
          children?.push(rteMapper({ type: value?.schemaType, data: value, entryName: title }))
        } else if (value?.text) {
          children?.push({ text: value?.text, contentId: helper?.uidGenrator(), ...checkTags(value?.text) });
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
      obj = rteMapper({ type: "paragraph", text: item?.text })
      result.push({ index, ...obj });
    } else if (isInBetween) {
      if (item?.incompleteTag === endTag) {
        endIndex = index;
        newEndIndex = index;
        isInBetween = false;
        if (result?.[prevStartIndex]?.children?.length) {
          if (item?.text) {
            result[prevStartIndex].children?.push({ text: item?.text })
          } else {
            result[prevStartIndex].children?.push(item)
          }
        } else {
          result.push(item);
        }
      } else {
        if (result?.[prevStartIndex]?.children?.length) {
          if (item?.text && (item?.hasIncomplete === false || item?.hasIncomplete)) {
            result[prevStartIndex].children?.push({ text: item?.text })
          } else {
            result[prevStartIndex].children?.push(item)
          }
        } else {
          result.push(item);
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
