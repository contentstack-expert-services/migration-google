const helper = require("../helper");
const _ = require("lodash");
const toJsonSchema = require('to-json-schema');
const { contentMapper } = require("../utils/contentMapper");

const globalfileds = [
  {
    display_nmae: "User Dimensions",
    uid: "sdp_page_user_dimensions",
    keys: ["audiences", "devices"],
  }
];

const contentTypesSchema = {
  globalExcludeFileds: ["schema_type"],
  content_types: [
    {
      display_name: "Audience",
      uid: "sdp_audience",
      key: "audiences",
      schema: [],
      excludeFileds: [],
    },
    {
      display_name: "Device Auth Status",
      uid: "device_auth_status",
      key: "devices",
      schema: [],
      excludeFileds: [],
    }
  ]
}


function content_types() {
  try {
    const entry = helper?.readFile({ path: "./data/complex_article.json" });
    for (let i = 0; i < contentTypesSchema?.content_types?.length; i++) {
      const contentTypedField = [];
      const contentType = contentTypesSchema?.content_types?.[i];
      const fieldKey = _.get(entry, contentType?.key);
      const jsonSchema = toJsonSchema(fieldKey);
      for (const [key, value] of Object.entries(jsonSchema?.properties)) {
        if (!contentTypesSchema?.globalExcludeFileds?.includes(key)) {
          contentTypedField?.push(contentMapper({ type: value?.type, name: key, uid: key }));
        }
      }
      const Ct = {
        display_name: contentType?.display_name,
        uid: contentType?.uid,
        schema: contentTypedField,
      }
      helper?.writeFile({ path: `./google/content_types/${Ct?.uid}.json`, data: JSON.stringify(Ct) })
    }
  } catch (err) {
    console.log("🚀 ~ file: content_type.js:7 ~ content_types ~ err:", err)
    throw err;
  }
}

module.exports = content_types;