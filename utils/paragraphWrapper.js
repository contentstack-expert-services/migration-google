


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

module.exports = paragraphWrapper;