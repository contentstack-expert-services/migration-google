const read = require("fs-readdir-recursive");
const _ = require("lodash");
const toJsonSchema = require('to-json-schema');
const { contentMapper } = require("../utils/contentMapper");
const {
  flatten,
  separateSimilarStrings,
  filteredArraySection,
  separateSection,
  contentArray,
  objectNester
} = require("../utils");
const rteMapper = require("../utils/rteMapper");
const helper = require("../helper");
const path = require("path");
const globalFolder = "/Users/umesh.more/Documents/tmp 2";
const folder = read(globalFolder);

function categories() {
  folder?.forEach?.((item, index) => {
    if (item?.includes?.(".json") && item?.includes?.("bspcategories")) {
      const entry = {};
      const file = helper?.readFile({ path: `${globalFolder}/${item}` })
      entry.uid = file?.categoryId?.replace?.(/-/g, '');
      entry.category_display_name = rteMapper({ type: "doc" });
      entry.category_display_name.children = [rteMapper({ type: "paragraph", text: file?.source?.category?.displayName })]
      entry.title = file?.source?.category?.displayName;
      if (file?.parentCategoryId) {
        entry.sdp_category_parent = [
          {
            "uid": file?.parentCategoryId?.replace?.(/-/g, ''),
            "_content_type_uid": "sdp_categories"
          }
        ]
      } else {
        entry.sdp_category_parent = []
      }
      if (file?.source?.category?.description?.length) {
        entry.category_description = { json_rte: objectNester(file?.source?.category?.description) };
      }
      helper.handleFile({ locale: "en-us", contentType: "sdp_categories", entry, uid: entry?.uid })
    }
  })
}

module.exports = categories;