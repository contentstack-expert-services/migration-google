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

module.exports = extractItemsBetweenTags;