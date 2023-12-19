function checkTags(htmlString) {
  const tagRegex = /<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/g;
  const tags = htmlString.match(tagRegex) || [];
  const tagCount = {};
  let incompleteTag = null;
  let tagName = null;

  tags.forEach(tag => {
    let newtagName = tag?.replace(/<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/, '$1');
    if (newtagName === "p") {
      tagName = newtagName;
      tagCount[tagName] = (tagCount[tagName] || 0) + ((tag.startsWith('</p') || tag.startsWith('<p') ? -1 : 1));
      if (tagCount?.[tagName] < 1) {
        incompleteTag = tag;
      }
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

module.exports = checkTags;