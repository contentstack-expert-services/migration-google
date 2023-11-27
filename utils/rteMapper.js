const _ = require("lodash");
const checkTags = require("./checkTags")
const helper = require("../helper")
const paragraphWrapper = require("./paragraphWrapper")
const extractItemsBetweenTags = require("./extractItemsBetweenTags");
const accordionEntryConveter = require("./accordion");
const path = require("path");

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
  // console.log(JSON.stringify(body))
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
  return table;
}

const imageCreate = ({ data }) => {
  const keyValueObject = {
    alt: data?.altText,
  };
  if (data?.image?.image?.entries?.length) {
    for (const pair of data?.image?.image?.entries) {
      keyValueObject[pair?.key] = pair?.value;
    }
  }
  return {
    "type": "div",
    attrs: {
      alt: data?.altText,
      id: data?.contentId,
      height: data?.height,
      width: data?.width
    },
    uid: helper?.uidGenrator(),
    "children": [
      {
        "type": "img",
        "attrs": {
          "url": data?.image?.urlData,
          "style": {},
          "redactor-attributes": keyValueObject,
        },
        "uid": helper?.uidGenrator(),
        "children": [
          {
            "text": ""
          }
        ]
      },
    ]
  }
}

const snippetCreate = ({ data }) => {
  const snippetWrapper = {
    "type": "div",
    attrs: {
      type: "snippet",
      id: data?.contentId,
      name: data?.snippet?.name,
    },
    uid: helper?.uidGenrator(),
    "children": []
  }
  const obj = []
  const newData = [];
  data?.snippet?.items?.forEach((element) => {
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
  const paragraphArray = extractItemsBetweenTags(obj, "<p>", "</p>")
  let para = {};
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
  snippetWrapper.children = newData;
  return snippetWrapper;
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

    case "heading":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6": {
      let tag = helper?.getHeadingType({ headingType: type })
      if (tag === undefined) {
        tag = helper?.getHeadingType({ headingType })
      }
      return {
        "type": tag,
        "attrs": {},
        uid,
        "children": [
          {
            text: data?.text ?? text,
          }
        ]
      }
    }

    case "ACCORDION": {
      const entry = {};
      const all = []
      data?.items?.forEach((item) => {
        const comp = {};
        const obj = [];
        const newData = [];
        let para = {}
        comp.sdp_accordion_items_title = { "sdp_basic_rte": item?.title }
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
        comp.sdp_accordion_item_description = { "sdp_main_json_rte": rteMapper({ type: "doc" }) }
        comp.sdp_accordion_item_description.sdp_main_json_rte.children = newData;
        comp.sdp_item_aria_label = ""
        all?.push(comp);
      });
      entry.sdp_accordion_items = all;
      entry.title = "umesh";
      entry.uid = data?.contentId?.replace(/-/g, '');
      helper.writeFile({ path: path.join(__dirname, `../google/sdp_accordion_component/${entry?.uid}.json`), data: entry })
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
        "children": data?.body?.map((item) => {
          if (item?.text) {
            return item?.text;
          } else {
            for (const [key, value] of Object?.entries?.(item)) {
              if (_.isObject(value)) {
                return rteMapper({ type: value?.schemaType, data: value })
              } else {
                console.log("==>>>")
              }
            }
          }
        })
      }
    }

    case "UNORDERED_LIST": {
      return {
        uid,
        "type": "ul",
        "attrs": {},
        "children": ulCreater({ data: data?.items })
      }
    }

    case "ORDERED_LIST": {
      const attrs = {};
      if (data?.start) {
        attrs.start = data?.start;
      }
      return {
        uid,
        "type": "ol",
        attrs,
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
      return tableCreate({ data })
    }

    case "SNIPPET": {
      return snippetCreate({ data })
    }

    case "IMAGE_RICH_TEXT": {
      return imageCreate({ data });
    }

    case "CODE_TEXT": {
      return {
        "type": "p",
        "attrs": {
          "id": "code-text",
        },
        uid,
        "children": [
          {
            text: data?.code?.code,
            "inlineCode": true
          }
        ]
      }
    }

    case "BLOCK_QUOTE": {
      return {
        "type": "blockquote",
        "attrs": {
          "style": {},
          "redactor-attributes": {},
          "dir": "ltr"
        },
        uid,
        "children": data?.quote?.map((item) => {
          if (item?.text) {
            return item?.text;
          } else {
            for (const [key, value] of Object?.entries?.(item)) {
              if (_.isObject(value)) {
                return rteMapper({ type: value?.schemaType, data: value })
              } else {
                console.log("==>>>")
              }
            }
          }
        }) ?? [
            {
              text: ""
            }
          ],
      }
    }

    case "ANCHOR": {
      return {
        "type": "a",
        "attrs": {
          "url": `#${data?.anchor}`,
          "style": {},
          "redactor-attributes": {
            "href": data?.anchor,
          }
        },
        uid,
        "children": [
          {
            "text": data?.anchor,
            "attrs": {
              "style": {}
            },
            "bold": true
          }
        ]
      }
    }

    case "PROMO": {
      return {}
    }

    case "HORIZONTAL_RULE": {
      return {
        uid,
        "type": "hr",
        "children": [
          {
            "text": ""
          }
        ],
        "attrs": {
          "style": {},
          "redactor-attributes": {},
          "dir": "ltr"
        }
      }
    }

    case "VIDEO_RICH_TEXT_ELEMENT": {
      return {}
    }

    case "HTML_EMBED": {
      const htmlEntry = {
        "title": data?.ampFallbackUrl,
        "sdp_html_embed_raw_html": data?.rawHtml,
        "uid": data?.contentId?.replace(/-/g, ''),
      }
      helper.writeFile({ path: path.join(__dirname, `../google/sdp_html_embed_component/${htmlEntry?.uid}.json`), data: htmlEntry })
      return {
        uid,
        "type": "reference",
        "attrs": {
          "display-type": "block",
          "type": "entry",
          "class-name": "embedded-entry redactor-component block-entry",
          "entry-uid": data?.contentId?.replace(/-/g, ''),
          "locale": "en-us",
          "content-type-uid": "sdp_html_embed_component"
        }
      }
    }

  }
}


module.exports = rteMapper