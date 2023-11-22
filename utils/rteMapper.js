const checkTags = require("./checkTags")
const helper = require("../helper")
const paragraphWrapper = require("./paragraphWrapper")
const _ = require("lodash");
const extractItemsBetweenTags = require("./extractItemsBetweenTags");

const ulCreater = ({ data }) => {
  const list = [];
  data?.forEach((item) => {
    list?.push(rteMapper({ type: item?.schemaType, data: item }))
  });
  return list;
}

const liCreate = ({ data }) => {
  const obj = [];
  const newData = [];
  let para = {};
  data?.forEach?.((item) => {
    for ([key, value] of Object?.entries?.(item)) {
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
  const paragraphArray = extractItemsBetweenTags(obj, "<p>", "</p>")
  paragraphArray?.result?.forEach((chd) => {
    if (chd?.tagName === "p" && chd?.hasIncomplete) {
      if (chd?.incompleteTag === "<p>") {
        para = rteMapper({ type: "paragraph", text: chd?.text })
      } else if (chd?.incompleteTag === "</p>") {
        para?.children?.push({ text: chd?.text })
      }
    } else {
      if (chd?.text && chd?.hasIncomplete === false) {
        para?.children?.push({ text: chd?.text })
      } else {
        para?.children?.push(chd)
      }
    }
  })
  obj?.forEach((item, index) => {
    if (typeof paragraphArray?.startIndex === "number" && typeof paragraphArray?.endIndex === "number") {
      if (paragraphArray?.startIndex === index) {
        newData?.push(para);
      }
      if (index > paragraphArray?.endIndex || index < paragraphArray?.startIndex) {
        if (item?.tagName === "p") {
          newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
        } else {
          newData?.push(item);
        }
      }
    } else {
      if (item?.tagName === "p") {
        newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
      } else {
        newData?.push(item);
      }
    }
  })
  return newData;
}

const pageComponentCreater = ({ item, type }) => {
  const newObjTr = {
    "type": "tr",
    "attrs": {},
    "children": [],
    "uid": helper?.uidGenrator(),
  };
  item?.cells?.forEach((head) => {
    console.log("🚀 ~ file: rteMapper.js:79 ~ item?.cells?.forEach ~ head:", head?.data)
    const tableHead = {
      type,
      "attrs": {},
      "children": [],
      "uid": helper?.uidGenrator()
    };
    const obj = [];
    const newData = [];
    let para = {};
    head?.data?.forEach?.((item) => {
      for ([key, value] of Object?.entries?.(item)) {
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
    const paragraphArray = extractItemsBetweenTags(obj, "<p>", "</p>")
    paragraphArray?.result?.forEach((chd) => {
      if (chd?.tagName === "p" && chd?.hasIncomplete) {
        if (chd?.incompleteTag === "<p>") {
          para = rteMapper({ type: "paragraph", text: chd?.text })
        } else if (chd?.incompleteTag === "</p>") {
          para?.children?.push({ text: chd?.text })
        }
      } else {
        if (chd?.text && chd?.hasIncomplete === false) {
          para?.children?.push({ text: chd?.text })
        } else {
          para?.children?.push(chd)
        }
      }
    })
    obj?.forEach((item, index) => {
      if (typeof paragraphArray?.startIndex === "number" && typeof paragraphArray?.endIndex === "number") {
        if (paragraphArray?.startIndex === index) {
          newData?.push(para);
        }
        if (index > paragraphArray?.endIndex || index < paragraphArray?.startIndex) {
          if (item?.tagName === "p") {
            newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
          } else {
            newData?.push(item);
          }
        }
      } else {
        if (item?.tagName === "p") {
          newData?.push(rteMapper({ type: "paragraph", text: item?.text }))
        } else {
          newData?.push(item);
        }
      }
    })
    tableHead.children = newData;
    newObjTr.children.push(tableHead);
  })
  return newObjTr;
}

const headerCreater = ({ data }) => {
  const header = {
    "uid": helper?.uidGenrator(),
    "type": "thead",
    "attrs": {},
    "children": []
  }
  data?.forEach((item) => {
    const children = pageComponentCreater({ item, type: "th" })
    header.attrs = { "grouping": item?.grouping }
    header?.children?.push(children);
  })
  return header;
}

const bodyCreater = ({ data }) => {
  const body = {
    "type": "tbody",
    "attrs": {
      "style": {},
      "redactor-attributes": {},
      "dir": "ltr"
    },
    "children": []
  }
  data?.forEach((item) => {
    const children = pageComponentCreater({ item, type: "td" })
    body?.children?.push(children);
  })
  // console.log("🚀 ~ file: rteMapper.js:117 ~ bodyCreater ~ body:", JSON.stringify(body))
  return body;
}

const tableCreate = ({ data }) => {
  const table = {
    "uid": helper?.uidGenrator(),
    "type": "table",
    "attrs": {
      "rows": 3,
      "cols": 2,
      "colWidths": [
        250,
        250
      ],
      "style": {},
      "redactor-attributes": {},
      "dir": "ltr"
    },
    "children": []
  }
  if (data?.headRows) {
    table?.children.push(headerCreater({ data: data?.headRows }))
  }
  if (data?.bodyRows) {
    table?.children.push(bodyCreater({ data: data?.bodyRows }))
  }
}


function rteMapper({ type, text, value, headingType, contentTypeUid, attrs = {}, data }) {
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
        children: liCreate({ data: data?.items }),
      }
    }

    case "TABLE": {
      tableCreate({ data })
    }
  }
}

module.exports = rteMapper