const _ = require("lodash")


function isURL(url) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return urlRegex?.test?.(url);
}

function removeTags(inputString) {
  if (inputString?.includes("<g-snippet") || isURL(inputString)) {
    return inputString;
  }
  const htmlTagsRegex = /<[^>]*>/g;
  return `${_.replace(inputString, htmlTagsRegex, '')}`;
}

function replaceTags({ data }) {
  switch (data?.type) {
    case "p":
    case "a": {
      const newChildren = [];
      data?.children?.forEach?.((item) => {
        const aChildren = [];
        if (item?.type === "a") {
          item?.children?.forEach((aElement) => {
            aChildren?.push({ text: removeTags(aElement?.text) })
          })
          item.children = aChildren;
          newChildren?.push(item);
        } else if (item?.type === "ul" || item?.type === "ol") {
          newChildren?.push(item)
        } else {
          if (typeof item?.text !== "undefined") {
            newChildren?.push({ text: removeTags(item?.text) })
          } else {
            newChildren?.push(item)
          }
        }
      })
      data.children = newChildren;
      return data;
    }
    default: {
      return data;
    }

  }
}

module.exports = replaceTags;