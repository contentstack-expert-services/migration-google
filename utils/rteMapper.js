
const helper = require("../helper/index")
const _ = require("lodash")

const ulCreater = ({ data }) => {
  const list = [];
  data?.forEach((item) => {
    list?.push(rteMapper({ type: item?.schemaType, data: item }))
  });
  return list;
}

const listCreater = ({ data }) => {
  const children = [];
  data?.forEach((item) => {
    for ([key, value] of Object?.entries?.(item)) {
      if (_.isObject(value)) {
        if (value?.schemaType) {
          children?.push(rteMapper({ type: value?.schemaType, data: value }))
        } else if (value?.text) {
          // children?.push({ text: value?.text, ...checkTags(value?.text) });
        }
      } else {
        console.log("🚀 ~ file: rteMapper.js:16 ~ listCreater ~ key, value:", key, value)
      }
    }
  })
  console.log("🚀 ~ file: rteMapper.js:15 ~ listCreater ~ children:", children)
}


const rteMapper = ({ type, text, value, headingType, contentTypeUid, attrs = {}, data }) => {
  const uid = helper?.uidGenrator();
  switch (type) {
    case "doc": {
      return {
        "type": "doc",
        uid,
        attrs,
        children: []
      }
    }
    case "sections":
    case "content": {
      return {
        "type": "div",
        attrs,
        uid,
        "children": []
      }
    };
    case "paragraph": {
      return {
        "type": "p",
        "attrs": {
          "id": type,
        },
        uid,
        "children": [
          {
            text,
          }
        ]
      }
    }
    case "link": {
      return {
        "type": "a",
        "attrs": {
          "url": value,
          "style": {},
          "redactor-attributes": {
            "href": value
          }
        },
        uid,
        "children": [
          {
            text
          }
        ]
      }
    }
    case "heading": {
      return {
        "type": helper?.getHeadingType({ headingType }),
        "attrs": {},
        uid,
        "children": [
          {
            text
          }
        ]
      }
    }
    case "inlineCode": {
      return {

      }
    }
    case "ACCORDION": {
      return {
        uid,
        "type": "reference",
        "attrs": {
          "display-type": "block",
          "type": "entry",
          "class-name": "embedded-entry redactor-component block-entry",
          "entry-uid": data?.contentId?.replace(/-/g, ''),
          "locale": "en-us",
          "content-type-uid": "sdp_accordion_component"
        }
      }
    }

    case "INTERNAL": {
      return {
        "type": "a",
        "attrs": {
          "url": data?.href,
          "style": {},
          "redactor-attributes": {
            "href": data?.href,
          }
        },
        uid,
        "children": [
          {
            // "text": data?.linkRichText?.map?.((item) => item?.text?.text).join(","),
            "text": data?.linkText,
            "attrs": {
              "style": {}
            },
            "bold": true
          }
        ]
      }
    }

    case "EXTERNAL": {
      return {
        "type": "a",
        "attrs": {
          "url": data?.href,
          "style": {},
          "redactor-attributes": {
            "href": data?.href,
            "target": data?.target,
          }
        },
        uid,
        "children": [
          {
            // "text": data?.linkRichText?.map?.((item) => item?.text?.text).join(","),
            "text": data?.linkText,
            "attrs": {
              "style": {}
            },
            "bold": true
          }
        ]
      }
    }

    case "INSET_BOX": {
      return {
        "type": "info",
        "attrs": data?.options,
        uid,
        "children": data?.body?.map((item) => item?.text)
      }
    }

    case "UNORDERED_LIST": {
      return {
        uid,
        "type": "ul",
        "children": ulCreater({ data: data?.items })
      }
    }

    case "LIST_ITEM": {
      return {
        "type": "li",
        "attrs": {},
        uid,
        "children": listCreater({ data: data?.items })
      }
    }
  }
}

module.exports = {
  rteMapper
}