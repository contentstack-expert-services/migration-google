const _ = require("lodash");
const checkTags = require("../utils/checkTags");
const rteMapper = require("./rteMapper");

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


module.exports = objectNester;