const _ = require("lodash");
const checkTags = require("./checkTags")
const rteMapper = require("./rteMapper");


const accordionEntryConveter = ({ data }) => {
  data?.items?.forEach((item) => {
    const obj = [];
    item?.description?.forEach((element) => {
      for ([key, value] of Object?.entries?.(element)) {
        if (_.isObject(value)) {
          if (value?.schemaType) {
            obj?.push(rteMapper({ type: value?.schemaType, data: value }))
          } else if (value?.text) {
            obj?.push({ text: value?.text, ...checkTags(value?.text) });
          }
        } else {
          console.log(`${key} : ${value}`);
        }
      }
    })
    console.log(obj)
  });
}


module.exports = accordionEntryConveter;