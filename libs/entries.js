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
const { validated, articleChoices } = require("../utils/aaray");
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
        console.log("=====>>>>>>>", file?.documentId)
        entry.uid = file?.documentId?.replace(/-/g, '');
        entry.title = file?.title;
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
        const missingRefs = [
          {
            uid: '000001887db6d690a1cbffb77dcb0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87d528affafdaf196c0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87d690a1cbff9720c10000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87d528affafdaf26800000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87dc7ca1fe7fef49160000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87d690a1cbff973a320000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001887d87dc7ca1fe7fef42600000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001857930d5bda3c5fff768d20006',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001885200d3f3a78fd3d111a50000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018851b5db35afe8d7ff609b0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018872c1dfe0abad76e7503b0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018872c6dfe0abad76e7519d0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018872cddfe0abad76ef790f0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018872cddfe0abad76ef816a0000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '0000018872cddfe0abad76ef87a70000',
            _content_type_uid: 'sdp_knowledge_article'
          },
          {
            uid: '000001857935d5bda3c5fff74fe80000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72a740000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001884f2fdb35afe8cf6ff6ef0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857924d5bda3c5fff7e0000000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff74fe80000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857924d5bda3c5fff7e0000000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001898d83d888a39b9f834bae0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff77bed0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff715720000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001884fb1d817a7dceff9ee7a0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff7076d0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff708d50000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff701d70000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001884f3cdb35afe8cf7f5f6f0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff75cc70000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff701d70000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff715720000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff75e8c0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff75e8c0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72a740000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72a740000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72a740000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff750810000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '0000018535cbd5bda3c5ffdf28520000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff751760000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff70a990000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff712040000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857942d5bda3c5ffd78d6d0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff711fe0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff707750000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001884f2fdb35afe8cf6ff6ef0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff75e8c0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff75e8c0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72da50000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72da50000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff74e160000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff72c380000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff709620000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff750810000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff751760000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff712040000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857931d5bda3c5fff70a990000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001872e16d8bfa7cfae5710ff0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001872e16d8bfa7cfae5710ff0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001872e16d8bfa7cfae5710ff0000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857935d5bda3c5fff751760000',
            _content_type_uid: 'sdp_categories'
          },
          {
            uid: '000001857927d5bda3c5fff779a60000',
            _content_type_uid: 'sdp_categories'
          }
        ]
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
      }
    })
  } catch (err) {
    console.log("🚀 ~ file: entries.js:122 ~ entries ~ err:", err)
  }
}


module.exports = entries;