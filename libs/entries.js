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
const { validated, articleChoices, missingRefs } = require("../utils/aaray");
const dateConverter = require("../utils/dateChnager");
const config = require("../config");
const globalFolder = config?.paths?.import?.filePath;
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



const itemWrapper = (items, title, audiencesData, deviceData) => {
  const result = [];
  items?.forEach((item, i) => {
    const newObj = {};
    const obj = {};
    const sdpHeadingRte = rteMapper({ type: "doc" })
    sdpHeadingRte?.children?.push(
      rteMapper({
        type: "heading",
        headingType: "HEADING_TYPE_3",
        text: item?.heading ?? ""
      })
    )
    const isfieldType = articleChoices?.find?.((ele) => ele?.key === item?.fieldType)
    let fieldType = null;
    if (isfieldType?.value) {
      fieldType = isfieldType?.value
    }
    obj.sdp_items_field_type = {
      sdp_article_field_type: fieldType,
    }
    obj.sdp_items_heading = {
      sdp_heading_title: item?.heading ?? "",
      sdp_heading_rte: sdpHeadingRte
    }
    const sdpMainRte = rteMapper({ type: "doc" })
    sdpMainRte?.children?.push(...objectNester(item?.body, title));
    if (sdpMainRte?.children?.length === 0) {
      sdpMainRte.children = [rteMapper({ type: "paragraph", text: "" })]
    }
    obj.sdp_items_main_body_rte = {
      sdp_main_json_rte: sdpMainRte
    }
    newObj.sdp_articles_user_dimensions = {
      "sdp_article_audience": {
        "sdp_audience": []
      },
      "sdp_article_device_auth_statuses": {
        "sdp_device_auth_status": []
      }
    }
    if (item?.audiences?.length) {
      const audiences = [];
      item?.audiences?.forEach((ele) => {
        for (const [key, value] of Object?.entries(audiencesData)) {
          if (value?.sdp_migration_data_reference?.bsp_entry_id === ele?.contentId) {
            audiences?.push({
              "uid": value?.uid ?? key,
              "_content_type_uid": config?.contentTypes?.audiance
            })
          }
        }
      })
      newObj.sdp_articles_user_dimensions = {
        "sdp_article_audience": {
          "sdp_audience": audiences ?? []
        },
      }
    }
    if (item?.devices?.length) {
      const devices = [];
      item?.devices?.forEach((ele) => {
        for (const [key, value] of Object?.entries(deviceData)) {
          if (value?.sdp_migration_data_reference?.bsp_entry_id === ele?.contentId) {
            devices?.push({
              "uid": value?.uid ?? key,
              "_content_type_uid": config?.contentTypes?.devices
            })
          }
        }
      })
      newObj.sdp_articles_user_dimensions = {
        ...newObj.sdp_articles_user_dimensions,
        "sdp_article_device_auth_statuses": {
          "sdp_device_auth_status": devices ?? []
        }
      }
    }
    newObj.sdp_items_main = [obj];
    result?.push(newObj);
  })
  return result;
}

function entries() {
  try {
    const audiencesData = helper?.readFile({ path: path.join(__dirname, `../google/entries/${config?.contentTypes?.audiance}/${config?.locale}`), readFileV2: true }) ?? {};
    const deviceData = helper?.readFile({ path: path.join(__dirname, `../google/entries/${config?.contentTypes?.devices}/${config?.locale}`), readFileV2: true }) ?? {};
    const taxonomyData = helper?.readFile({ path: path.join(__dirname, `../google/entries/${config?.contentTypes?.taxonomy}/${config?.locale}`), readFileV2: true }) ?? {};
    folder?.forEach?.((item, index) => {
      if (item?.includes?.(".json") && item?.includes?.(config?.paths?.import?.articleFolderName)) {
        const entry = {};
        const file = helper?.readFile({ path: `${globalFolder}/${item}` })
        if (file?.documentId && file?.title) {
          entry.uid = file?.documentId?.replace(/-/g, '');
          entry.title = file?.title;
          console.log("=====>>>>>>>", file?.documentId, file?.title, "(Knowledge Article)")
          entry.documentId = file?.documentId;
          entry.ownerName = file?.ownerName;
          entry.documentType = file?.documentType;
          entry.sdp_article_subtext = file?.source?.document?.subtext;
          entry.sdp_article_keywords = file?.source?.document?.keywords?.map((item) => item)?.join(",");
          entry.sdp_items_global_insert_items = itemWrapper(file?.source?.document?.items, file?.title, audiencesData, deviceData)
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
          const categories = [];
          file?.categoryIds?.forEach((item) => {
            const isPresent = missingRefs?.find((ele) =>
              ele?.uid === item?.replace?.(/-/g, '')
            )
            if (isPresent?.uid === undefined) {
              categories?.push({
                "uid": item?.replace?.(/-/g, ''),
                "_content_type_uid": "sdp_categories"
              })
            }
          })
          entry.sdp_articlemeta_data = {
            sdp_article_categories: categories
          };
          entry.sdp_user_dimension = {
            "sdp_article_audience": {
              "sdp_audience": []
            },
            "sdp_article_device_auth_statuses": {
              "sdp_device_auth_status": []
            }
          };
          if (file?.source?.document?.audiences?.length) {
            const audiences = [];
            file?.source?.document?.audiences?.forEach((item) => {
              for (const [key, value] of Object?.entries(audiencesData)) {
                if (value?.sdp_migration_data_reference?.bsp_entry_id === item?.contentId) {
                  audiences?.push({
                    "uid": value?.uid ?? key,
                    "_content_type_uid": config?.contentTypes?.audiance
                  })
                }
              }
            })
            entry.sdp_user_dimension.sdp_article_audience = {
              "sdp_audience": audiences,
            }
          }
          if (file?.source?.document?.devices?.length) {
            const devices = [];
            file?.source?.document?.devices?.forEach((item) => {
              for (const [key, value] of Object?.entries(deviceData)) {
                if (value?.sdp_migration_data_reference?.bsp_entry_id === item?.contentId) {
                  devices?.push({
                    "uid": value?.uid ?? key,
                    "_content_type_uid": config?.contentTypes?.devices
                  })
                }
              }
            })
            entry.sdp_user_dimension.sdp_article_device_auth_statuses = {
              "sdp_device_auth_status": devices,
            }
          }
          entry.sdp_article_taxonomy = {
            "sdp_article_taxonomy": []
          };
          if (file?.source?.document?.taxonomy) {
            const taxonomy = [];
            for (const [key, value] of Object?.entries(taxonomyData)) {
              if (value?.sdp_migration_data?.bsp_entry_id === file?.source?.document?.taxonomy?.contentId) {
                taxonomy?.push({
                  "uid": value?.uid ?? key,
                  "_content_type_uid": config?.contentTypes?.taxonomy
                })
              }
            }
            entry.sdp_article_taxonomy = {
              "sdp_article_taxonomy": taxonomy,
            };
          }
          if (file?.source?.document?.validationStatusChangeDate) {
            entry.sdp_article_validation_status.sdp_article_validation_status_change_date = dateConverter({ inputDate: file?.source?.document?.validationStatusChangeDate });
          }
          helper.handleFile({ locale: config?.locale, contentType: config?.contentTypes?.knowledgeArticle, entry, uid: entry?.uid })
        } else {
          console.log("=====>>>>>>>", "Knowledge Article Data Missing");
        }
      }
    })
  } catch (err) {
    console.log("🚀 ~ file: entries.js:122 ~ entries ~ err:", err)
  }
}


module.exports = entries;