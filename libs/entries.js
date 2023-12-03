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
const { validated } = require("../utils/aaray");
const globalFolder = "/Users/umesh.more/Documents/tmp 2";
const folder = read(globalFolder);


const createContent = (type, item) => {
  const data = rteMapper({ type });
  return data;
}

const contentWrapper = (content) => {
  const contentPresent = contentArray(content)
  const separateData = separateSection(content, contentPresent, "content", true)
  const data = rteMapper({ type: separateData?.type, attrs: { id: separateData?.type } })
  separateData?.sections?.forEach?.((item) => {
    data?.children?.push(createContent(separateData?.type, item));
  })
  return data;
}

const createSection = (keys, newData) => {
  const data = rteMapper({ type: "sections", attrs: {} })
  const content = [];
  keys?.keys?.forEach?.((item) => {
    if (item?.includes?.(".sectionId") && helper?.getValue(newData, item)) {
      data.attrs = { "section-id": helper?.getValue(newData, item) }
    }
    if (item?.includes?.(".heading")) {
      const headingData = helper?.getValue(newData, item);
      console.log("🚀 ~ file: entries.js:36 ~ createSection ~ headingData:", headingData)
      data?.children?.push(rteMapper({ type: "heading", headingType: "HEADING_TYPE_3", text: helper?.getValue(newData, item) }))
    }
    if (item?.includes?.(".content")) {
      content?.push(item);
    }
  })
  if (content?.length) {
    // data?.children?.push(contentWrapper(content))
  } else {
    console.log("Content Not found");
  }
  // console.log("🚀 ~ file: entries.js:23 ~ createSection ~ ", "=>> ")
  // console.log("🚀 ~ file: entries.js:23 ~ createSection ~ data:", JSON.stringify(data), data)
  return data;
}


const sectionWrapper = (section, newData) => {
  const data = rteMapper({ type: section?.type, attrs: { id: section?.type } })
  section?.sections?.forEach?.((item) => {
    const sectionElement = createSection(item, newData);
    data?.children?.push(sectionElement);
  })
  return data;
}



const itemWrapper = (items, title) => {
  const result = [];
  items?.forEach((item, i) => {
    const obj = {};
    const sdpHeadingRte = rteMapper({ type: "doc" })
    sdpHeadingRte?.children?.push(
      rteMapper({
        type: "heading",
        headingType: "HEADING_TYPE_3",
        text: item?.heading ?? ""
      })
    )
    obj.sdp_items_field_type = {
      sdp_article_field_type: item?.fieldType
    }
    obj.sdp_items_heading = {
      sdp_heading_title: item?.heading ?? "",
      sdp_heading_rte: sdpHeadingRte
    }
    const sdpMainRte = rteMapper({ type: "doc" })
    sdpMainRte?.children?.push(...objectNester(item?.body, title));
    obj.sdp_items_main_body_rte = {
      sdp_main_json_rte: sdpMainRte
    }
    result?.push(obj);
  })
  return result;
}

function entries() {
  try {
    folder?.forEach?.((item, index) => {
      if (item?.includes?.(".json") && item?.includes?.("bsparticles")) {
        const entry = {};
        const file = helper?.readFile({ path: `${globalFolder}/${item}` })
        entry.uid = file?.documentId?.replace(/-/g, '');
        entry.title = file?.title;
        entry.documentId = file?.documentId;
        entry.ownerName = file?.ownerName;
        entry.documentType = file?.documentType;
        entry.sdp_article_subtext = file?.source?.document?.subtext;
        entry.sdp_article_keywords = file?.source?.document?.keywords?.map((item) => item)?.join(",");
        entry.sdp_items_global_insert_items = [{ sdp_items_main: itemWrapper(file?.source?.document?.items, file?.title) }]
        entry.migration = {
          "bsp_entry_id": file?.documentId?.replace(/-/g, ''),
          "bsp_entry_type": file?.documentType,
          "connect_composer_id": "",
          "connect_composer_type": "",
          "sdp_article_buganizerid": file?.source?.document?.buganizerId,
        };
        entry.sdp_article_validation_status = {
          "sdp_article_validation_status_name": file?.source?.document?.validationStatus?.displayName,
          "sdp_article_validation_status": validated?.find((item) => item.type === file?.source?.document?.validationStatus?.displayName)?.value ?? "not-validated",
          "sdp_article_validation_status_change_date": null
        };
        entry.seo = {
          "sdp_meta_title": "",
          "sdp_meta_description": "",
          "sdp_keywords": "",
          "sdp_enable_search_indexing": true
        };
        entry.sdp_articlemeta_data = {
          sdp_article_categories: file?.categoryIds?.map((item) => {
            return {
              "uid": item?.replace?.(/-/g, ''),
              "_content_type_uid": "sdp_categories"
            }
          })
        };
        if (file?.source?.document?.validationStatusChangeDate) {
          entry.sdp_article_validation_status.sdp_article_validation_status_change_date = file?.source?.document?.validationStatusChangeDate;
        }
        helper.handleFile({ locale: "en-us", contentType: "sdp_knowledge_article", entry, uid: entry?.uid })
      }
    })
  } catch (err) {
    console.log("🚀 ~ file: entries.js:122 ~ entries ~ err:", err)
  }
}


module.exports = entries;