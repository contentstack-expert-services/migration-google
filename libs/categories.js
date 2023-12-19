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
const config = require("../config");
const { missingRefs } = require("../utils/aaray");
const traverseChildAndWarpChild = require("../utils/fromRedactor");
const globalFolder = config?.paths?.import?.filePath;
const folder = read(globalFolder);

const wrapperFragment = ({ children }) => {
  const newChildren = [];
  children?.forEach((item) => {
    if (item?.children?.length) {
      newChildren?.push({ ...item, children: wrapperFragment({ children: item?.children }) })
    } else {
      newChildren?.push(item);
    }
  })
  return traverseChildAndWarpChild(newChildren);
}

function categories() {
  folder?.forEach?.((item, index) => {
    if (item?.includes?.(".json") && item?.includes?.(config?.paths?.import?.categoryFolderName)) {
      const entry = {};
      const file = helper?.readFile({ path: `${globalFolder}/${item}` })
      if (file?.categoryId) {
        entry.uid = file?.categoryId?.replace?.(/-/g, '');
        console.log("=====>>>>>>>", file?.categoryId, file?.source?.category?.displayName, "(categories)");
        entry.sdp_category_display_name = rteMapper({ type: "doc" });
        entry.sdp_category_display_name.children = [rteMapper({ type: "paragraph", text: file?.source?.category?.displayName })]
        entry.title = `${file?.source?.category?.displayName} ${entry.uid} `;
        if (file?.parentCategoryId) {
          const isPresent = missingRefs?.find((item) => item?.uid === file?.parentCategoryId?.replace?.(/-/g, ''));
          if (isPresent?.uid === undefined) {
            entry.sdp_category_parent = [{
              "uid": file?.parentCategoryId?.replace?.(/-/g, ''),
              "_content_type_uid": "sdp_categories"
            }]
          }
        } else {
          entry.sdp_category_parent = []
        }
        if (file?.source?.category?.description?.length) {
          const sdp_main_json_rte = rteMapper({ type: "doc" });
          sdp_main_json_rte.children = wrapperFragment({ children: objectNester(file?.source?.category?.description) });
          entry.sdp_category_description = { sdp_main_json_rte }
        };
        entry.sdp_migration_data = {
          "bsp_entry_id": file?.categoryId,
          "bsp_entry_type": "",
          "connect_composer_id": "",
          "connect_composer_type": "",
          "sdp_article_buganizerid": "",
        }
        helper.handleFile({ locale: config?.locale, contentType: config?.contentTypes?.categories, entry, uid: entry?.uid })
      }
    }
  })
}

module.exports = categories;