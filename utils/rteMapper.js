
const helper = require("../helper/index")

const rteMapper = ({ type, text, value, headingType, entryUid, contentTypeUid, attrs = {}, data }) => {
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
    case "zippyList": {
      return {
        uid,
        "type": "reference",
        "attrs": {
          "display-type": "block",
          "type": "entry",
          "class-name": "embedded-entry redactor-component block-entry",
          "entry-uid": entryUid,
          "locale": "en-us",
          "content-type-uid": contentTypeUid
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

  }
}

module.exports = {
  rteMapper
}