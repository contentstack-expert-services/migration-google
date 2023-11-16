const read = require("fs-readdir-recursive");
const toJsonSchema = require('to-json-schema');
const { contentMapper } = require("../utils/contentMapper");
const { flatten, separateSimilarStrings, filteredArraySection, separateSection, contentArray } = require("../utils");
const { rteMapper } = require("../utils/rteMapper");
const helper = require("../helper");
const _ = require("lodash");
const globalFolder = "/Users/umesh.more/Downloads/tmp";
const folder = read(globalFolder);


const createContent = (type, item) => {
  const data = rteMapper({ type });
  // console.log("🚀 ~ file: entries.js:13 ~ createContent ~ data:", data)
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

function checkTags(htmlString) {
  const tagRegex = /<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/g;
  const tags = htmlString.match(tagRegex) || [];
  const tagCount = {};
  let incompleteTag = null;
  let tagName = null;

  tags.forEach(tag => {
    tagName = tag.replace(/<\s*\/?\s*([a-zA-Z0-9\-_]+)[^>]*>/, '$1');
    tagCount[tagName] = (tagCount[tagName] || 0) + ((tag.startsWith('</') || tag.startsWith('<') ? -1 : 1));
    if (tagCount?.[tagName] < 1) {
      incompleteTag = tag;
    }
  });
  let hasIncomplete = false;
  Object?.entries(tagCount)?.forEach(([key, value]) => {
    if (value !== (0 || -2)) {
      hasIncomplete = true;
    }
  });
  return {
    hasIncomplete,
    incompleteTag,
    tagName
  };
}

const extractItemsBetweenTags = (data, startTag, endTag) => {
  let result = [];
  let startIndex = null;
  let endIndex = null;
  let isInBetween = false;
  data?.forEach((item, index) => {
    if (item?.incompleteTag === startTag) {
      startIndex = index;
      isInBetween = true;
      result.push(item);
    } else if (isInBetween) {
      if (item?.incompleteTag === endTag) {
        endIndex = index;
        isInBetween = false;
        result.push(item);
      } else {
        result.push(item);
      }
    }
  })
  return { startIndex, endIndex, result };
}

const paragraphWrapper = (data) => {
  let obj = {};
  const newData = [];
  const paragraphArray = extractItemsBetweenTags(data, "<p>", "</p>")
  paragraphArray?.result?.forEach((chd) => {
    if (chd?.tagName === "p" && chd?.hasIncomplete) {
      if (chd?.incompleteTag === "<p>") {
        obj = rteMapper({ type: "paragraph", text: chd?.text })
      } else if (chd?.incompleteTag === "</p>") {
        obj?.children?.push({ text: chd?.text })
      }
    } else {
      if (chd?.text && chd?.hasIncomplete === false) {
        obj?.children?.push({ text: chd?.text })
      } else {
        obj?.children?.push(chd)
      }
    }
  })
  data?.forEach((item, index) => {
    if (paragraphArray?.startIndex && paragraphArray?.endIndex) {
      if (paragraphArray?.startIndex === index) {
        newData?.push(obj);
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



const objectNester = (body) => {
  const children = [];
  body?.forEach?.((item) => {
    for ([key, value] of Object?.entries?.(item)) {
      if (_.isObject(value)) {
        if (value?.schemaType) {
          children?.push(rteMapper({ type: value?.schemaType, data: value }))
        } else if (value?.text) {
          children?.push({ text: value?.text, ...checkTags(value?.text) });
        }
      } else {
        console.log(`${key} : ${value}`);
      }
    }
  })
  return paragraphWrapper(children)
}

const itemWrapper = (items) => {
  //sdp_items_main
  const result = [];
  items?.forEach((item, i) => {
    if (i === 3) {
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
      // console.log("🚀 ~ file: entries.js:189 ~ items?.forEach ~  item?.body:", item?.body)
      sdpMainRte?.children?.push(...objectNester(item?.body));
      console.log("🚀 ~ file: entries.js:184 ~ items?.forEach ~ sdpMainRte:", JSON.stringify(sdpMainRte))
    }
  })
}

function entries() {
  // folder?.forEach?.((item, index) => {
  //   if (item?.includes?.(".json") && item?.includes?.("documents") && index === 50) {
  //     console.log("🚀 ~ file: entries.js:66 ~ entries ~ index:", index)
  //     const entry = {};
  //     const file = helper?.readFile({ path: `${globalFolder}/${item}` })
  //     entry.uid = file?.documentId;
  //     entry.title = file?.title;
  //     entry.documentId = file?.documentId;
  //     entry.ownerName = file?.ownerName;
  //     entry.documentType = file?.documentType;
  //     const flattenEntry = flatten?.(file?.content);
  //     const keys = Object?.keys?.(flattenEntry);
  //     const filSection = filteredArraySection(keys)
  //     const section = separateSection(keys, filSection)
  //     entry.content = rteMapper({ type: "doc" })
  //     entry?.content?.children?.push(sectionWrapper(section, file?.content));
  //   }
  // })

  const items = [
    {
      "anchor": "intro",
      "body": [
        {
          "internalLink": {
            "contentId": "00000187-e0a6-d16f-afcf-ebff8f600000",
            "href": "https://supportcenter.corp.google.com/techstop/article/00000185-7937-d5bd-a3c5-fff7773e0002",
            "linkText": "go/mdsp",
            "path": "/techstop/article/00000185-7937-d5bd-a3c5-fff7773e0002",
            "schemaType": "INTERNAL",
            "linkRichText": [
              {
                "text": {
                  "text": "\u003cp\u003ego/mdsp\u003c/p\u003e"
                }
              }
            ]
          }
        },
        {
          "text": {
            "text": "\u003cp\u003eBesides devices obtained through "
          }
        },
        {
          "externalLink": {
            "contentId": "00000185-7937-d5bd-a3c5-fff7767d0004",
            "href": "http://go/stuff",
            "linkText": "Stuff",
            "schemaType": "EXTERNAL",
            "target": "_blank",
            "linkRichText": [
              {
                "text": {
                  "text": "\u003cp\u003eStuff\u003c/p\u003e"
                }
              }
            ]
          }
        },
        {
          "text": {
            "text": ", Googlers and members of our extended workforce are welcome to use any mobile device that complies with the following requirements.\u003c/p\u003e"
          }
        }
      ],
      "contentId": "0000018a-d66f-df32-abfb-deef6a1b0000",
      "fieldType": "Intro",
      "schemaType": "LISTICLE_ITEM"
    },
    {
      "anchor": "resolution",
      "body": [
        {
          "accordionRichTextElement": {
            "contentId": "00000185-7937-d5bd-a3c5-fff7772e0001",
            "items": [
              {
                "description": [
                  {
                    "text": {
                      "text": "\u003cp\u003eAndroid devices are eligible for corp access when they meet both the following hardware and software requirements.\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff7767e0000",
                      "schemaType": "H2",
                      "text": "a) Hardware",
                      "anchor": "hardware",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ea) Hardware\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "insetBoxRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff7767e0001",
                      "options": {
                        "label": "Important",
                        "schemaType": "INSET_OPTIONS",
                        "value": "important"
                      },
                      "schemaType": "INSET_BOX",
                      "body": [
                        {
                          "text": {
                            "text": "\u003cp\u003e\u003cb\u003eIMPORTANT:\u003c/b\u003e\u003cbr\u003e\u003c/p\u003e"
                          }
                        },
                        {
                          "unorderedListRichTextElement": {
                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5de50000",
                            "items": [
                              {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5de50001",
                                "items": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003ePixel devices, or devices obtained via Stuff, are \u003cb\u003efully supported\u003c/b\u003e for corp access.\u003c/p\u003e"
                                    }
                                  }
                                ],
                                "schemaType": "LIST_ITEM"
                              },
                              {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5de50002",
                                "items": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003eOther devices are supported on a \u003cb\u003ebest effort\u003c/b\u003e basis, as the Workspace Managed Fleets Team cannot guarantee compliance with Google’s support requirements.\u003c/p\u003e"
                                    }
                                  }
                                ],
                                "schemaType": "LIST_ITEM"
                              },
                              {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5de50003",
                                "items": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003eChoose a more recent device for longer corp access eligibility.\u003c/p\u003e"
                                    }
                                  }
                                ],
                                "schemaType": "LIST_ITEM"
                              }
                            ],
                            "schemaType": "UNORDERED_LIST"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003e\u003c/p\u003e"
                    }
                  },
                  {
                    "table": {
                      "bodyRows": [
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e\u003cb\u003eFully Supported\u003c/b\u003e\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003ePixel 4a*, or newer\u003c/p\u003e\u003cp\u003eIf corp access is your priority, we strongly recommend a recent Pixel device:\u003cbr\u003e\u003c/p\u003e\u003cp\u003e"
                                  }
                                },
                                {
                                  "unorderedListRichTextElement": {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5ddb0000",
                                    "items": [
                                      {
                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5ddc0000",
                                        "items": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003eEligible for "
                                            }
                                          },
                                          {
                                            "externalLink": {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e160000",
                                              "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11k6kgt1rq",
                                              "linkText": "Highly Privileged Access",
                                              "schemaType": "EXTERNAL",
                                              "target": "_blank",
                                              "linkRichText": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eHighly Privileged Access\u003c/p\u003e"
                                                  }
                                                }
                                              ]
                                            }
                                          },
                                          {
                                            "text": {
                                              "text": "\u003c/p\u003e"
                                            }
                                          }
                                        ],
                                        "schemaType": "LIST_ITEM"
                                      },
                                      {
                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5ddc0001",
                                        "items": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003eEligible for "
                                            }
                                          },
                                          {
                                            "externalLink": {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e190000",
                                              "href": "https://support.google.com/pixelphone/answer/4457705",
                                              "linkText": "monthly updates",
                                              "schemaType": "EXTERNAL",
                                              "target": "_blank",
                                              "linkRichText": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003emonthly updates\u003c/p\u003e"
                                                  }
                                                }
                                              ]
                                            }
                                          },
                                          {
                                            "text": {
                                              "text": ", since release:\u003c/p\u003e"
                                            }
                                          },
                                          {
                                            "unorderedListRichTextElement": {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e180000",
                                              "items": [
                                                {
                                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5e180001",
                                                  "items": [
                                                    {
                                                      "text": {
                                                        "text": "\u003cp\u003ePixel 8 and newer: 7 years\u003c/p\u003e"
                                                      }
                                                    }
                                                  ],
                                                  "schemaType": "LIST_ITEM"
                                                },
                                                {
                                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5e180002",
                                                  "items": [
                                                    {
                                                      "text": {
                                                        "text": "\u003cp\u003ePixel 7/6: 5 years\u003c/p\u003e"
                                                      }
                                                    }
                                                  ],
                                                  "schemaType": "LIST_ITEM"
                                                },
                                                {
                                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5e180003",
                                                  "items": [
                                                    {
                                                      "text": {
                                                        "text": "\u003cp\u003ePixel 5/4a: 3 years\u003c/p\u003e"
                                                      }
                                                    }
                                                  ],
                                                  "schemaType": "LIST_ITEM"
                                                }
                                              ],
                                              "schemaType": "UNORDERED_LIST"
                                            }
                                          }
                                        ],
                                        "schemaType": "LIST_ITEM"
                                      },
                                      {
                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5ddc0002",
                                        "items": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003eMotorola Edge 20 is the only non-Pixel device eligible for HPA\u003c/p\u003e"
                                            }
                                          }
                                        ],
                                        "schemaType": "LIST_ITEM"
                                      }
                                    ],
                                    "schemaType": "UNORDERED_LIST"
                                  }
                                },
                                {
                                  "text": {
                                    "text": "\u003c/p\u003e"
                                  }
                                },
                                {
                                  "insetBoxRichText": {
                                    "contentId": "00000187-e136-d16f-afcf-ebff08070000",
                                    "options": {
                                      "label": "Alert",
                                      "schemaType": "INSET_OPTIONS",
                                      "value": "alert"
                                    },
                                    "schemaType": "INSET_BOX",
                                    "body": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eThese devices will lose corp access eligibility soon:\u003cbr\u003e\u003c/p\u003e"
                                        }
                                      },
                                      {
                                        "unorderedListRichTextElement": {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb5e240000",
                                          "items": [
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e240001",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003e\u003cb\u003ePixel 4a \u003c/b\u003ehas received its last Security Patch on August 5, 2023.\u003cbr\u003eAs a result, corp access eligibility is changing as follows:\u003cbr\u003e\u003c/p\u003e"
                                                  }
                                                },
                                                {
                                                  "unorderedListRichTextElement": {
                                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2a0000",
                                                    "items": [
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2a0001",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eHighly Privileged Access was lost on \u003cb\u003eSeptember 24, 2023\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      },
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2a0002",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eBasic Access will be lost on \u003cb\u003eJanuary 2, 2024\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      }
                                                    ],
                                                    "schemaType": "UNORDERED_LIST"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e240002",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003e\u003cb\u003ePixel 5 \u003c/b\u003ewill receive its last Security Patch on November 5, 2023 (Previously, October 5).\u003c/p\u003e\u003cp\u003eAs a result, corp access eligibility is changing as follows:\u003cbr\u003e\u003c/p\u003e"
                                                  }
                                                },
                                                {
                                                  "unorderedListRichTextElement": {
                                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2f0000",
                                                    "items": [
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2f0001",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eHighly Privileged Access will be lost on \u003cb\u003eNovember 24, 2023\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      },
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e2f0002",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eBasic Access will be lost on \u003cb\u003eApril 3, 2024\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      }
                                                    ],
                                                    "schemaType": "UNORDERED_LIST"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e240003",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003e\u003cb\u003ePixel 4a 5G \u003c/b\u003ewill receive its last Security Patch on November 5, 2023.\u003c/p\u003e\u003cp\u003eAs a result, corp access eligibility is changing as follows:\u003cbr\u003e\u003c/p\u003e"
                                                  }
                                                },
                                                {
                                                  "unorderedListRichTextElement": {
                                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5e340000",
                                                    "items": [
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e340001",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eHighly Privileged Access will be lost on \u003cb\u003eDecember 25, 2023\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      },
                                                      {
                                                        "contentId": "0000018b-b69b-d206-a3cf-f6bb5e340002",
                                                        "items": [
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003eBasic Access will be lost on \u003cb\u003eApril 3, 2024\u003c/b\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "schemaType": "LIST_ITEM"
                                                      }
                                                    ],
                                                    "schemaType": "UNORDERED_LIST"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            }
                                          ],
                                          "schemaType": "UNORDERED_LIST"
                                        }
                                      },
                                      {
                                        "text": {
                                          "text": "\u003cp\u003e\u003cb\u003eObtaining a replacement device for\u003c/b\u003e\u003cbr\u003e\u003c/p\u003e"
                                        }
                                      },
                                      {
                                        "unorderedListRichTextElement": {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb5e250009",
                                          "items": [
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e25000a",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eA non-corp-issued device, use "
                                                  }
                                                },
                                                {
                                                  "internalLink": {
                                                    "contentId": "00000187-e135-d14a-a39f-f9f719f60000",
                                                    "href": "https://supportcenter.corp.google.com/techstop/article/00000186-c98f-dc09-a7bf-cfff45830000/interactive",
                                                    "linkText": "go/mobile-device-request",
                                                    "path": "/techstop/article/00000186-c98f-dc09-a7bf-cfff45830000/interactive",
                                                    "schemaType": "INTERNAL",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003ego/mobile-device-request\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " for information regarding how to obtain a corp-issued device.\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e25000b",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eA corp-issued device, visit "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5e3e0000",
                                                    "href": "http://go/stuff-phone",
                                                    "linkText": "stuff/",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003estuff/\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " to verify your eligibility for a device replacement.\u003c/p\u003e\u003cp\u003e\u003cb\u003eNote\u003c/b\u003e: Before replacing such device with a non-corp-issued device, review the supported devices in the ‘\u003cb\u003eQualified\u003c/b\u003e’ section below.\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            }
                                          ],
                                          "schemaType": "UNORDERED_LIST"
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "text": {
                                    "text": "\u003cp\u003e\u003c/p\u003e\u003cp\u003e\u003c/p\u003e\u003cp\u003e\u003c/p\u003e\u003cp\u003e\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "2",
                              "rowSpan": "1"
                            }
                          ]
                        },
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e\u003cb\u003eQualified\u003c/b\u003e\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eAny device from the following qualified manufacturers:\u003cbr\u003eAsus, HMD Global (Nokia), Lenovo, Motorola*, Microsoft, Samsung, Sony.\u003c/p\u003e\u003cp\u003eThese devices can sync corp data in the Basic Access tier as long as they comply with the software requirements below.\u003c/p\u003e\u003cp\u003eSince we have no control on how often these devices are updated, we can only support them on a best effort basis. Do not choose these devices if corp access is your priority, as you might lose access at any time.\u003c/p\u003e\u003cp\u003e\u003c/p\u003e\u003cp\u003eChina policy: All Android devices sold locally in China are not "
                                  }
                                },
                                {
                                  "externalLink": {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5e460000",
                                    "href": "http://www.android.com/gms/",
                                    "linkText": "GMS",
                                    "schemaType": "EXTERNAL",
                                    "target": "_blank",
                                    "linkRichText": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eGMS\u003c/p\u003e"
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "text": {
                                    "text": " certified, and are therefore not qualified for corp access.\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eNot eligible for HPA\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ]
                        }
                      ],
                      "contentId": "0000018b-b69b-d206-a3cf-f6bb5de00000",
                      "headRows": [
                        {
                          "cells": [
                            {
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e"
                                  }
                                },
                                {
                                  "externalLink": {
                                    "contentId": "0000018b-5e4d-dc90-a9ab-5f7d58550000",
                                    "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11jpr18lvl",
                                    "linkText": "Basic Access",
                                    "schemaType": "EXTERNAL",
                                    "target": "_blank",
                                    "linkRichText": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eBasic Access\u003c/p\u003e"
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "text": {
                                    "text": "\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e"
                                  }
                                },
                                {
                                  "externalLink": {
                                    "contentId": "0000018b-5e4a-dc90-a9ab-5f7f6c140000",
                                    "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11k6kgt1rq",
                                    "linkText": "Highly Privileged Access",
                                    "schemaType": "EXTERNAL",
                                    "target": "_blank",
                                    "linkRichText": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eHighly Privileged Access\u003c/p\u003e"
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "text": {
                                    "text": "\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ],
                          "grouping": "Header"
                        }
                      ],
                      "schemaType": "TABLE",
                      "tableStyle": "Nice Table"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776800001",
                      "schemaType": "H2",
                      "text": "b) Software",
                      "anchor": "software",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eb) Software\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "snippetRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776dd0000",
                      "schemaType": "SNIPPET",
                      "snippet": {
                        "contentId": "00000185-361d-d5bd-a3c5-fedfb5640000",
                        "items": [
                          {
                            "text": {
                              "text": "\u003cp\u003eAt the minimum, your device needs to meet the Basic Access requirements.\u003cbr\u003ePixel (5, 4a5G or newer) is also eligible for Highly Privileged Access.\u003c/p\u003e"
                            }
                          },
                          {
                            "table": {
                              "bodyRows": [
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eSet up with\u003cbr\u003e"
                                          }
                                        },
                                        {
                                          "unorderedListRichTextElement": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800000",
                                            "items": [
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800001",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003ea work profile ("
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c70000",
                                                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11g0n8nkjg",
                                                      "linkText": "PO",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003ePO\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": " or "
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c70002",
                                                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11ny381tqp",
                                                      "linkText": "COPE",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003eCOPE\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": " mode),\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800002",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eor in Fully Managed ("
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c70004",
                                                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11qkt9pjtx",
                                                      "linkText": "DO mode",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003eDO mode\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": ").\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              }
                                            ],
                                            "schemaType": "UNORDERED_LIST"
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eSet up with\u003cbr\u003e"
                                          }
                                        },
                                        {
                                          "unorderedListRichTextElement": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800003",
                                            "items": [
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800004",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003ea work profile ("
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c70006",
                                                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11ny381tqp",
                                                      "linkText": "COPE",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003eCOPE\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": " mode only),\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e800005",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eor in Fully Managed ("
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c70008",
                                                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11qkt9pjtx",
                                                      "linkText": "DO mode",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003eDO mode\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": ").\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              }
                                            ],
                                            "schemaType": "UNORDERED_LIST"
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eHave a "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000185-a704-d800-adfd-bfc486c7000a",
                                            "href": "https://support.google.com/pixel/answer/7550416",
                                            "linkText": "Security Patch Level",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eSecurity Patch Level\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " within \u003cb\u003e150 days\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eHave a "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000185-a704-d800-adfd-bfc486c7000c",
                                            "href": "https://support.google.com/pixel/answer/7550416",
                                            "linkText": "Security Patch Level",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eSecurity Patch Level\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " within \u003cb\u003e50 days\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eN/A\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eInstall system updates \u003cb\u003ewithin 7 days\u003c/b\u003e of when they become available on your device.\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eRun \u003cb\u003eAndroid 10 or newer\u003c/b\u003e.\u003cbr\u003eAndroid 10 and 11 will soon be deprecated for corp access.\u003cbr\u003eBeta programs and unreleased devices are not recommended as they often lack CTS compliance.\u003cbr\u003e "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000185-a704-d800-adfd-bfc486c80000",
                                            "href": "https://www.android.com/versions/go-edition/",
                                            "linkText": "Android Go edition",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eAndroid Go edition\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " builds are not supported.\u003cbr\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eRun \u003cb\u003eAndroid 13\u003c/b\u003e or \u003cb\u003e14\u003c/b\u003e ("
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000185-a704-d800-adfd-bfc486c80002",
                                            "href": "https://developers.google.com/android/ota",
                                            "linkText": "official public build",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eofficial public build\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": ").\u003cbr\u003eDogfood or Public Beta builds are never eligible.\u003cbr\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eBe "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5ee60003",
                                            "href": "https://source.android.com/compatibility/cts",
                                            "linkText": "\u003cb\u003eCTS-compliant*\u003c/b\u003e",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003e\u003cb\u003eCTS-compliant*\u003c/b\u003e\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " and have "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5ee70000",
                                            "href": "https://www.android.com/gms/",
                                            "linkText": "\u003cb\u003eGMS\u003c/b\u003e",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003e\u003cb\u003eGMS\u003c/b\u003e\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " preinstalled\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eBe "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5eeb0000",
                                            "href": "https://source.android.com/compatibility/cts",
                                            "linkText": "\u003cb\u003eCTS-compliant \u003c/b\u003e",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003e\u003cb\u003eCTS-compliant \u003c/b\u003e\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "and have "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5eec0000",
                                            "href": "https://www.android.com/gms/",
                                            "linkText": "\u003cb\u003eGMS\u003c/b\u003e",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003e\u003cb\u003eGMS\u003c/b\u003e\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": " preinstalled\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e\u003cb\u003eNot be rooted**\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e\u003cb\u003eNot be rooted\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eHave a \u003cb\u003elocked bootloader**\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eHave a \u003cb\u003elocked bootloader\u003c/b\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e"
                                          }
                                        },
                                        {
                                          "unorderedListRichTextElement": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810000",
                                            "items": [
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810001",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eScreen lock: 4-digit PIN, Pattern, or password.\u003cbr\u003eFingerprint and face unlock are allowed.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810002",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eNon-biometric unlock required every 48 hours.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810003",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eAutomatic Screen lock: after 15 minutes of inactivity.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              }
                                            ],
                                            "schemaType": "UNORDERED_LIST"
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e \u003cp\u003e\u003cb\u003eNote\u003c/b\u003e: When setting up a company-owned device (work profile or Fully Managed mode), a strong 6-character alphanumeric password or 8-digit PIN will be required. To use a PIN or pattern, visit "
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5efa0000",
                                            "href": "https://goto.google.com/ep",
                                            "linkText": "go/ep",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003ego/ep\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": ", downgrade the device to Basic Access, and wait a few days for the less restrictive policy to reach the device.\u003cbr\u003e\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e"
                                          }
                                        },
                                        {
                                          "unorderedListRichTextElement": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810004",
                                            "items": [
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810005",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eScreen lock: A 6-character alphanumeric password or 8-digit PIN.\u003cbr\u003eFingerprint unlock is allowed.\u003cbr\u003eFace unlock is only allowed on Pixel 4 (XL).\u003cbr\u003e\u003cb\u003eNote: Pixel 7 (Pro)\u003c/b\u003e can only use face unlock for the personal profile. To enable this head to: Settings"
                                                    }
                                                  },
                                                  {
                                                    "snippetRichText": {
                                                      "contentId": "0000018a-d676-df32-abfb-def724820000",
                                                      "schemaType": "SNIPPET",
                                                      "snippet": {
                                                        "contentId": "00000185-3611-d5bd-a3c5-fed7338c0000",
                                                        "items": [
                                                          {
                                                            "imageRichTextElement": {
                                                              "altText": "and then",
                                                              "contentId": "00000186-3328-d85b-a38e-bfbba8ef0000",
                                                              "height": "18",
                                                              "image": {
                                                                "contentId": "00000185-3611-d5bd-a3c5-fed7334a0000",
                                                                "image": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "narrowImage": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "schemaType": "IMAGE",
                                                                "urlData": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                              },
                                                              "schemaType": "IMAGE_RICH_TEXT",
                                                              "width": "18"
                                                            }
                                                          },
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "name": "Standard \u003e Icon \u003e and then",
                                                        "schemaType": "SNIPPET"
                                                      }
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": "Security \u0026amp; Privacy"
                                                    }
                                                  },
                                                  {
                                                    "snippetRichText": {
                                                      "contentId": "0000018a-d676-df32-abfb-def724820000",
                                                      "schemaType": "SNIPPET",
                                                      "snippet": {
                                                        "contentId": "00000185-3611-d5bd-a3c5-fed7338c0000",
                                                        "items": [
                                                          {
                                                            "imageRichTextElement": {
                                                              "altText": "and then",
                                                              "contentId": "00000186-3328-d85b-a38e-bfbba8ef0000",
                                                              "height": "18",
                                                              "image": {
                                                                "contentId": "00000185-3611-d5bd-a3c5-fed7334a0000",
                                                                "image": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "narrowImage": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "schemaType": "IMAGE",
                                                                "urlData": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                              },
                                                              "schemaType": "IMAGE_RICH_TEXT",
                                                              "width": "18"
                                                            }
                                                          },
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "name": "Standard \u003e Icon \u003e and then",
                                                        "schemaType": "SNIPPET"
                                                      }
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": "More security settings"
                                                    }
                                                  },
                                                  {
                                                    "snippetRichText": {
                                                      "contentId": "0000018a-d676-df32-abfb-def724820000",
                                                      "schemaType": "SNIPPET",
                                                      "snippet": {
                                                        "contentId": "00000185-3611-d5bd-a3c5-fed7338c0000",
                                                        "items": [
                                                          {
                                                            "imageRichTextElement": {
                                                              "altText": "and then",
                                                              "contentId": "00000186-3328-d85b-a38e-bfbba8ef0000",
                                                              "height": "18",
                                                              "image": {
                                                                "contentId": "00000185-3611-d5bd-a3c5-fed7334a0000",
                                                                "image": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "narrowImage": {
                                                                  "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png\",\"width\":\"24\",\"height\":\"24\"}",
                                                                  "entries": [
                                                                    {
                                                                      "key": "src",
                                                                      "value": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                                    },
                                                                    {
                                                                      "key": "width",
                                                                      "value": "24"
                                                                    },
                                                                    {
                                                                      "key": "height",
                                                                      "value": "24"
                                                                    }
                                                                  ]
                                                                },
                                                                "schemaType": "IMAGE",
                                                                "urlData": "https://www.gstatic.com/servicedesk_bsp/a9/7a/7b5ae94240d1a97198e5f05082f7/f514d258db660783a353ba8f1cee7f707f70640f82c428f8be470821ee246ce6d5a533bf9a4f022f1e9c08fc87ea12cabdfd25a86a14eff2df141aa1fd317ce4.png"
                                                              },
                                                              "schemaType": "IMAGE_RICH_TEXT",
                                                              "width": "18"
                                                            }
                                                          },
                                                          {
                                                            "text": {
                                                              "text": "\u003cp\u003e\u003c/p\u003e"
                                                            }
                                                          }
                                                        ],
                                                        "name": "Standard \u003e Icon \u003e and then",
                                                        "schemaType": "SNIPPET"
                                                      }
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": "Disable ‘Use one lock for work profile.’ Check "
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "0000018b-b69b-d206-a3cf-f6bb5f320000",
                                                      "href": "http://goto.google.com/pixel-face-auth-in-corp",
                                                      "linkText": "go/pixel-face-auth-in-corp",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003ego/pixel-face-auth-in-corp\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": " for more details.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810006",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eNon-biometric unlock required every 10 hours.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e810007",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eAutomatic Screen lock: after 5 minutes of inactivity.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              }
                                            ],
                                            "schemaType": "UNORDERED_LIST"
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e "
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eA corp inventory record is not required.\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003eHave a corp inventory record:\u003cbr\u003e"
                                          }
                                        },
                                        {
                                          "unorderedListRichTextElement": {
                                            "contentId": "0000018b-b69b-d206-a3cf-f6bb5e820000",
                                            "items": [
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e820001",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eDevices from Stuff always have a corp inventory record.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e820002",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003eExpensed devices are automatically registered in corp inventory once the expense process is complete.\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              },
                                              {
                                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5e820003",
                                                "items": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003ePersonally-owned devices can be registered in corp inventory at "
                                                    }
                                                  },
                                                  {
                                                    "externalLink": {
                                                      "contentId": "00000185-a704-d800-adfd-bfc486c80008",
                                                      "href": "http://goto.google.com/pde",
                                                      "linkText": "go/pde",
                                                      "schemaType": "EXTERNAL",
                                                      "target": "_blank",
                                                      "linkRichText": [
                                                        {
                                                          "text": {
                                                            "text": "\u003cp\u003ego/pde\u003c/p\u003e"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  },
                                                  {
                                                    "text": {
                                                      "text": "\u003cbr\u003e (not accessible to xWF).\u003c/p\u003e"
                                                    }
                                                  }
                                                ],
                                                "schemaType": "LIST_ITEM"
                                              }
                                            ],
                                            "schemaType": "UNORDERED_LIST"
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ]
                                },
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e\u003ci\u003e* Select Motorola Edge 20 users (from India, Mexico and Brazil) who ordered their device from Stuff are part of a limited Pilot where their device is Fully Supported and eligible for Highly Privileged Access.\u003c/i\u003e \u003cbr\u003e\u003ci\u003e* *Unless it’s running a recent and approved dogfood build. \u003c/i\u003e\u003cbr\u003e\u003ci\u003eDogfood builds are supported by the \u003c/i\u003e"
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000185-a704-d800-adfd-bfc486c8000a",
                                            "href": "https://goto.google.com/a-dogfooding",
                                            "linkText": "\u003ci\u003eAndroid Dogfood Team\u003c/i\u003e",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003e\u003ci\u003eAndroid Dogfood Team\u003c/i\u003e\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003ci\u003e.\u003c/i\u003e \u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "2",
                                      "rowSpan": "1"
                                    }
                                  ]
                                }
                              ],
                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5e850000",
                              "headRows": [
                                {
                                  "cells": [
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e"
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000187-e146-d16f-afcf-ebff7f030000",
                                            "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11jpr18lvl",
                                            "linkText": "Basic Access",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eBasic Access\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    },
                                    {
                                      "data": [
                                        {
                                          "text": {
                                            "text": "\u003cp\u003e"
                                          }
                                        },
                                        {
                                          "externalLink": {
                                            "contentId": "00000187-e147-d16f-afcf-ebff26ab0000",
                                            "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11k6kgt1rq",
                                            "linkText": "Highly Privileged Access",
                                            "schemaType": "EXTERNAL",
                                            "target": "_blank",
                                            "linkRichText": [
                                              {
                                                "text": {
                                                  "text": "\u003cp\u003eHighly Privileged Access\u003c/p\u003e"
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        {
                                          "text": {
                                            "text": "\u003cbr\u003e (Pixel 5, Pixel 4a5G or newer)\u003c/p\u003e"
                                          }
                                        }
                                      ],
                                      "colSpan": "1",
                                      "rowSpan": "1"
                                    }
                                  ],
                                  "grouping": "Header"
                                }
                              ],
                              "schemaType": "TABLE",
                              "tableStyle": "Nice Table"
                            }
                          }
                        ],
                        "name": "go/mdsp - Software Requirements",
                        "schemaType": "SNIPPET"
                      }
                    }
                  },
                  {
                    "insetBoxRichText": {
                      "contentId": "00000187-e14f-d079-a9cf-f7efb0010000",
                      "options": {
                        "label": "Tip",
                        "schemaType": "INSET_OPTIONS",
                        "value": "tip"
                      },
                      "schemaType": "INSET_BOX",
                      "body": [
                        {
                          "text": {
                            "text": "\u003cp\u003e\u003cb\u003eCTS Compliant:\u003c/b\u003e If the device is from a qualified manufacturer and running the factory installed software, it’s likely to be CTS Compliant.\u003cbr\u003e\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "insetBoxRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776de0000",
                      "options": {
                        "label": "Note",
                        "schemaType": "INSET_OPTIONS",
                        "value": "note"
                      },
                      "schemaType": "INSET_BOX",
                      "body": [
                        {
                          "text": {
                            "text": "\u003cp\u003e\u003cb\u003eNote:\u003c/b\u003e For more information about any of these requirements, please consult "
                          }
                        },
                        {
                          "externalLink": {
                            "contentId": "00000185-7937-d5bd-a3c5-fff776dd0001",
                            "href": "https://g3doc.corp.google.com/security/g3doc/eip/index.md",
                            "linkText": "EIP",
                            "schemaType": "EXTERNAL",
                            "target": "_blank",
                            "linkRichText": [
                              {
                                "text": {
                                  "text": "\u003cp\u003eEIP\u003c/p\u003e"
                                }
                              }
                            ]
                          }
                        },
                        {
                          "text": {
                            "text": "‘s "
                          }
                        },
                        {
                          "externalLink": {
                            "contentId": "00000185-7937-d5bd-a3c5-fff776dd0003",
                            "href": "https://g3doc.corp.google.com/company/teams/security-privacy/policies/security/guidelines/mobile-devices.md",
                            "linkText": "Mobile Device Security Guidelines",
                            "schemaType": "EXTERNAL",
                            "target": "_blank",
                            "linkRichText": [
                              {
                                "text": {
                                  "text": "\u003cp\u003eMobile Device Security Guidelines\u003c/p\u003e"
                                }
                              }
                            ]
                          }
                        },
                        {
                          "text": {
                            "text": ".\u003cbr\u003e\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003e\u003c/p\u003e"
                    }
                  },
                  {
                    "accordionRichTextElement": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776df000c",
                      "items": [
                        {
                          "description": [
                            {
                              "text": {
                                "text": "\u003cp\u003eExceptions are managed by the "
                              }
                            },
                            {
                              "externalLink": {
                                "contentId": "00000185-7937-d5bd-a3c5-fff776de0001",
                                "href": "https://g3doc.corp.google.com/security/g3doc/eip/index.md",
                                "linkText": "EIP team",
                                "schemaType": "EXTERNAL",
                                "target": "_blank",
                                "linkRichText": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003eEIP team\u003c/p\u003e"
                                    }
                                  }
                                ]
                              }
                            },
                            {
                              "text": {
                                "text": ".\u003c/p\u003e"
                              }
                            },
                            {
                              "unorderedListRichTextElement": {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb5f620000",
                                "items": [
                                  {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5f620001",
                                    "items": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eFor Android development velocity, self-granting of exceptions is possible:\u003cbr\u003e\u003c/p\u003e"
                                        }
                                      },
                                      {
                                        "unorderedListRichTextElement": {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb5f6a0000",
                                          "items": [
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5f6a0001",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eDevice hardware: Members of the "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de0003",
                                                    "href": "http://g/ape_device_reviewer",
                                                    "linkText": "ape_device_reviewer",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eape_device_reviewer\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " or "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de0005",
                                                    "href": "http://g/apac-hwbd",
                                                    "linkText": "apac-hwbd",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eapac-hwbd\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " groups who report to "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de0007",
                                                    "href": "https://teams.googleplex.com/jimk",
                                                    "linkText": "jimk@",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003ejimk@\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": ", "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de0009",
                                                    "href": "https://teams.googleplex.com/ttr",
                                                    "linkText": "ttr@",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003ettr@\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " or "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de000b",
                                                    "href": "https://teams.googleplex.com/raturner",
                                                    "linkText": "raturner@",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eraturner@\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " may apply via "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776de000d",
                                                    "href": "https://sphinx.corp.google.com/sphinx/#accessChangeRequest:user\u0026systemName\u003dmobile_hardware_exceptions",
                                                    "linkText": "Sphinx",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eSphinx\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": ". \u003cbr\u003e\u003cb\u003eNote:\u003c/b\u003e This is a hardware exception only, you will still have to follow software policies.\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5f6a0002",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eCTS: Members of the "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776df0000",
                                                    "href": "http://g/ape_device_reviewer",
                                                    "linkText": "ape_device_reviewer",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eape_device_reviewer\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": " group may apply via "
                                                  }
                                                },
                                                {
                                                  "externalLink": {
                                                    "contentId": "00000185-7937-d5bd-a3c5-fff776df0002",
                                                    "href": "https://sphinx.corp.google.com/sphinx/#accessChangeRequest:systemName\u003dmobile_cts_exceptions\u0026selectedRole\u003dmobile_cts_exceptions_cts_exceptions_for_the_android_partner_engineering_team",
                                                    "linkText": "Sphinx",
                                                    "schemaType": "EXTERNAL",
                                                    "target": "_blank",
                                                    "linkRichText": [
                                                      {
                                                        "text": {
                                                          "text": "\u003cp\u003eSphinx\u003c/p\u003e"
                                                        }
                                                      }
                                                    ]
                                                  }
                                                },
                                                {
                                                  "text": {
                                                    "text": ".\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            }
                                          ],
                                          "schemaType": "UNORDERED_LIST"
                                        }
                                      }
                                    ],
                                    "schemaType": "LIST_ITEM"
                                  },
                                  {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5f620002",
                                    "items": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eFor specific input methods (IME) or accessibility (a11y) services that would otherwise be denied by the Android device policy, please file a request using this "
                                        }
                                      },
                                      {
                                        "externalLink": {
                                          "contentId": "00000185-7937-d5bd-a3c5-fff776df0004",
                                          "href": "https://goto.google.com/mdsp-exception-ime-a11y",
                                          "linkText": "form",
                                          "schemaType": "EXTERNAL",
                                          "target": "_blank",
                                          "linkRichText": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003eform\u003c/p\u003e"
                                              }
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        "text": {
                                          "text": ". These exceptions require a business justification.\u003c/p\u003e"
                                        }
                                      }
                                    ],
                                    "schemaType": "LIST_ITEM"
                                  },
                                  {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5f620003",
                                    "items": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eFor sideloading on the personal profile of a device set up with a work profile ("
                                        }
                                      },
                                      {
                                        "externalLink": {
                                          "contentId": "00000188-2515-d0b7-a7ed-fd7f06c60000",
                                          "href": "https://moma.corp.google.com/glossary/term/11g0n8nkjg",
                                          "linkText": "personally owned",
                                          "schemaType": "EXTERNAL",
                                          "target": "_blank",
                                          "linkRichText": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003epersonally owned\u003c/p\u003e"
                                              }
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        "text": {
                                          "text": " devices only), review the terms and request a self-service exception via "
                                        }
                                      },
                                      {
                                        "externalLink": {
                                          "contentId": "00000188-2515-d0b7-a7ed-fd7f06c70000",
                                          "href": "https://sphinx.corp.google.com/sphinx/#accessChangeRequest:systemName\u003dunknown_sources_exceptions\u0026selectedRole\u003dunknown_sources_exceptions_unknown_sources_exception_work_profile",
                                          "linkText": "Sphinx",
                                          "schemaType": "EXTERNAL",
                                          "target": "_blank",
                                          "linkRichText": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003eSphinx\u003c/p\u003e"
                                              }
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        "text": {
                                          "text": ".\u003cbr\u003e \u003cb\u003eNote\u003c/b\u003e: this exception will \u003cb\u003eNOT\u003c/b\u003e have any effect on:\u003cbr\u003e\u003c/p\u003e"
                                        }
                                      },
                                      {
                                        "unorderedListRichTextElement": {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb5fa50000",
                                          "items": [
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5fa50001",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eThe work profile of a personally-owned device\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5fa50002",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eBoth profiles of a company-owned device with a work profile\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            },
                                            {
                                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5fa50003",
                                              "items": [
                                                {
                                                  "text": {
                                                    "text": "\u003cp\u003eFully Managed devices\u003c/p\u003e"
                                                  }
                                                }
                                              ],
                                              "schemaType": "LIST_ITEM"
                                            }
                                          ],
                                          "schemaType": "UNORDERED_LIST"
                                        }
                                      }
                                    ],
                                    "schemaType": "LIST_ITEM"
                                  },
                                  {
                                    "contentId": "0000018b-b69b-d206-a3cf-f6bb5f620004",
                                    "items": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003eOther exception requests will require strong business justification and will be evaluated on a case by case basis. Please file a "
                                        }
                                      },
                                      {
                                        "externalLink": {
                                          "contentId": "00000185-7937-d5bd-a3c5-fff776df000a",
                                          "href": "https://goto.google.com/mdsp-exception",
                                          "linkText": "Mobile Device Exception Request",
                                          "schemaType": "EXTERNAL",
                                          "target": "_blank",
                                          "linkRichText": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003eMobile Device Exception Request\u003c/p\u003e"
                                              }
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        "text": {
                                          "text": ".\u003c/p\u003e"
                                        }
                                      }
                                    ],
                                    "schemaType": "LIST_ITEM"
                                  }
                                ],
                                "schemaType": "UNORDERED_LIST"
                              }
                            }
                          ],
                          "title": "What if I need an exception?"
                        }
                      ],
                      "schemaType": "ACCORDION"
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003e\u003c/p\u003e"
                    }
                  }
                ],
                "title": "Android",
                "anchor": "which-phone"
              },
              {
                "description": [
                  {
                    "text": {
                      "text": "\u003cp\u003e"
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776e10000",
                      "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11k6kgt1rq",
                      "linkText": "Highly Privileged",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eHighly Privileged\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " access is not available. \u003c/p\u003e\u003cp\u003eAn iOS/iPadOS device is eligible for "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff776e10002",
                      "href": "https://moma.corp.google.com/glossary/term/11jpr18lvl",
                      "linkText": "Basic Access",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eBasic Access\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ", when it:\u003cbr\u003e"
                    }
                  },
                  {
                    "snippetRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff7772e0000",
                      "schemaType": "SNIPPET",
                      "snippet": {
                        "contentId": "00000185-361d-d5bd-a3c5-fedfd6c90002",
                        "items": [
                          {
                            "unorderedListRichTextElement": {
                              "contentId": "0000018b-b69b-d206-a3cf-f6bb5fb60000",
                              "items": [
                                {
                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5fb60001",
                                  "items": [
                                    {
                                      "text": {
                                        "text": "\u003cp\u003eIs "
                                      }
                                    },
                                    {
                                      "externalLink": {
                                        "contentId": "00000185-a704-d800-adfd-bfc44a010000",
                                        "href": "https://support.apple.com/en-us/HT201222",
                                        "linkText": "actively supported with Security Updates",
                                        "schemaType": "EXTERNAL",
                                        "target": "_blank",
                                        "linkRichText": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003eactively supported with Security Updates\u003c/p\u003e"
                                            }
                                          }
                                        ]
                                      }
                                    },
                                    {
                                      "text": {
                                        "text": " by Apple. In doubt, please use a device that runs the latest major version of iOS.\u003c/p\u003e"
                                      }
                                    }
                                  ],
                                  "schemaType": "LIST_ITEM"
                                },
                                {
                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5fb60002",
                                  "items": [
                                    {
                                      "text": {
                                        "text": "\u003cp\u003eUses "
                                      }
                                    },
                                    {
                                      "externalLink": {
                                        "contentId": "00000185-a704-d800-adfd-bfc44a010002",
                                        "href": "https://support.apple.com/en-us/HT201222",
                                        "linkText": "the latest iOS/iPadOS version available for the device",
                                        "schemaType": "EXTERNAL",
                                        "target": "_blank",
                                        "linkRichText": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003ethe latest iOS/iPadOS version available for the device\u003c/p\u003e"
                                            }
                                          }
                                        ]
                                      }
                                    },
                                    {
                                      "text": {
                                        "text": ", or a version released within the last 90 days.\u003c/p\u003e"
                                      }
                                    }
                                  ],
                                  "schemaType": "LIST_ITEM"
                                },
                                {
                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5fb60003",
                                  "items": [
                                    {
                                      "text": {
                                        "text": "\u003cp\u003eIsn’t "
                                      }
                                    },
                                    {
                                      "externalLink": {
                                        "contentId": "00000185-a704-d800-adfd-bfc44a010004",
                                        "href": "https://en.wikipedia.org/wiki/IOS_jailbreaking",
                                        "linkText": "jailbroken",
                                        "schemaType": "EXTERNAL",
                                        "target": "_blank",
                                        "linkRichText": [
                                          {
                                            "text": {
                                              "text": "\u003cp\u003ejailbroken\u003c/p\u003e"
                                            }
                                          }
                                        ]
                                      }
                                    },
                                    {
                                      "text": {
                                        "text": ".\u003c/p\u003e"
                                      }
                                    }
                                  ],
                                  "schemaType": "LIST_ITEM"
                                },
                                {
                                  "contentId": "0000018b-b69b-d206-a3cf-f6bb5fb60004",
                                  "items": [
                                    {
                                      "text": {
                                        "text": "\u003cp\u003eHas the Safari browser enabled.\u003c/p\u003e"
                                      }
                                    }
                                  ],
                                  "schemaType": "LIST_ITEM"
                                }
                              ],
                              "schemaType": "UNORDERED_LIST"
                            }
                          }
                        ],
                        "name": "Eligible iOS to sync with corp [policy]",
                        "schemaType": "SNIPPET"
                      }
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cbr\u003e\u003c/p\u003e"
                    }
                  }
                ],
                "title": "iOS/iPadOS",
                "anchor": "ios"
              }
            ],
            "schemaType": "ACCORDION"
          }
        },
        {
          "text": {
            "text": "\u003cp\u003eFor instructions on setting up your device, visit "
          }
        },
        {
          "externalLink": {
            "contentId": "00000188-30cb-ddaa-a799-fbfbe3be0000",
            "href": "https://goto.google.com/android-setup",
            "linkText": "go/android-setup",
            "schemaType": "EXTERNAL",
            "target": "_blank",
            "linkRichText": [
              {
                "text": {
                  "text": "\u003cp\u003ego/android-setup\u003c/p\u003e"
                }
              }
            ]
          }
        },
        {
          "text": {
            "text": " or "
          }
        },
        {
          "externalLink": {
            "contentId": "00000188-30cc-da93-a5bf-3fccda5d0000",
            "href": "https://goto.google.com/ios-setup",
            "linkText": "go/ios-setup",
            "schemaType": "EXTERNAL",
            "target": "_blank",
            "linkRichText": [
              {
                "text": {
                  "text": "\u003cp\u003ego/ios-setup\u003c/p\u003e"
                }
              }
            ]
          }
        },
        {
          "text": {
            "text": ".\u003c/p\u003e"
          }
        },
        {
          "insetBoxRichText": {
            "contentId": "00000185-7937-d5bd-a3c5-fff777310004",
            "options": {
              "label": "Alert",
              "schemaType": "INSET_OPTIONS",
              "value": "alert"
            },
            "schemaType": "INSET_BOX",
            "body": [
              {
                "text": {
                  "text": "\u003cp\u003eSupport for allowed devices may be suspended or eliminated entirely upon discovery of security or privacy bugs or the issue of updates that conflict with support policies.\u003cbr\u003e\u003c/p\u003e"
                }
              }
            ]
          }
        },
        {
          "text": {
            "text": "\u003cp\u003e\u003c/p\u003e"
          }
        }
      ],
      "contentId": "00000185-7937-d5bd-a3c5-fff7775c0000",
      "fieldType": "Resolution",
      "heading": "What devices can I sync my corporate account with?",
      "schemaType": "LISTICLE_ITEM"
    },
    {
      "anchor": "FAQ",
      "body": [
        {
          "accordionRichTextElement": {
            "contentId": "00000185-7937-d5bd-a3c5-fff777350003",
            "items": [
              {
                "description": [
                  {
                    "headingRichText": {
                      "contentId": "00000188-0753-d4f0-a7de-57772eea0000",
                      "schemaType": "H4",
                      "text": "There are many Android phones to choose from. Which one should I get?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eThere are many Android phones to choose from. Which one should I get?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003ePlease read carefully the hardware requirements in the "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000188-9d07-d59d-a3cb-dfbf8cd70000",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000185-7937-d5bd-a3c5-fff7773e0002#which-phone",
                      "linkText": "section above",
                      "path": "/techstop/article/00000185-7937-d5bd-a3c5-fff7773e0002#which-phone",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003esection above\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " to learn which device models are permitted to sync corp data. Permitted devices also need to meet all the software requirements.\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0753-d444-a9ce-a7df57f50000",
                      "schemaType": "H4",
                      "text": "How do I check my Android version and Security Patch Level?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eHow do I check my Android version and Security Patch Level?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eGo to "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff777320003",
                      "href": "https://goto.google.com/check-spl",
                      "linkText": "go/check-spl",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ego/check-spl\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ".\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0753-d9c4-adfd-3fdb8a170000",
                      "schemaType": "H4",
                      "text": "What guarantee do I get that my mobile device will retain corp access within the security patch window?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eWhat guarantee do I get that my mobile device will retain corp access within the security patch window?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eA device will usually retain corp access during its expected "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-0750-d444-a9ce-a7df48430001",
                      "href": "#software",
                      "linkText": "eligibility window",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eeligibility window\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " (ex. 150 days for Basic Access on Android). However, critical vulnerabilities or patch policy changes might block corp access sooner than expected.\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0754-d9c4-adfd-3fdc45020000",
                      "schemaType": "H4",
                      "text": "Can I use a device not running Android or iOS/iPadOS?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I use a device not running Android or iOS/iPadOS?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eNo, mobile devices not running Android, iOS or iPadOS (for instance Windows Phone, BlackBerry, Ubuntu Phone, Firefox OS, etc.) are not supported for corp use. \u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0754-d9c4-adfd-3fdc726f0000",
                      "schemaType": "H4",
                      "text": "Can I root my Android device for development purposes?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I root my Android device for development purposes?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eIn short, no. Purposefully rooting your corporate device is not allowed. If you’re an Android dogfooder or developer, you may sync your corporate account to a rooted Android device. Dogfooders must use \u003cb\u003euserdebug\u003c/b\u003e builds created by the Android Team. Android developers must be a member of "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-2515-d0b7-a7ed-fd7f074f0000",
                      "href": "https://ganpati2.corp.google.com/group/100035740258",
                      "linkText": "%mobile-eng-build-exceptions",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003e%mobile-eng-build-exceptions\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " and are only permitted to use rooted “eng” builds.\u003cbr\u003e\u003c/p\u003e"
                    }
                  },
                  {
                    "table": {
                      "bodyRows": [
                        {},
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e\u003cb\u003eAndroid Build Type\u003c/b\u003e\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003e\u003cb\u003eRoot permitted\u003c/b\u003e\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ]
                        },
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eeng\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eUsers in "
                                  }
                                },
                                {
                                  "externalLink": {
                                    "contentId": "00000185-7937-d5bd-a3c5-fff77732000a",
                                    "href": "https://ganpati2.corp.google.com/group/100035740258",
                                    "linkText": "%mobile-eng-build-exceptions",
                                    "schemaType": "EXTERNAL",
                                    "target": "_blank",
                                    "linkRichText": [
                                      {
                                        "text": {
                                          "text": "\u003cp\u003e%mobile-eng-build-exceptions\u003c/p\u003e"
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  "text": {
                                    "text": "\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ]
                        },
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003euserdebug\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eOnly dogfood builds\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ]
                        },
                        {
                          "cells": [
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003euser\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            },
                            {
                              "data": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eNot permitted\u003c/p\u003e"
                                  }
                                }
                              ],
                              "colSpan": "1",
                              "rowSpan": "1"
                            }
                          ]
                        }
                      ],
                      "contentId": "0000018b-b69b-d206-a3cf-f6bb5fde0000",
                      "schemaType": "TABLE",
                      "tableStyle": "Nice Table"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0754-d444-a9ce-a7dfc7800000",
                      "schemaType": "H4",
                      "text": "Can I jailbreak my iOS/iPadOS device for development purposes?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I jailbreak my iOS/iPadOS device for development purposes?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eIn short, no. Purposefully jailbreaking your corporate device is not allowed. Please contact "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-2515-d0b7-a7ed-fd7f07540000",
                      "href": "mailto:apple-developer-relations@google.com",
                      "linkText": "apple-developer-relations@",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eapple-developer-relations@\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " if you believe you have a good reason to jailbreak an iOS or iPadOS device. \u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0755-d444-a9ce-a7df0bb50000",
                      "schemaType": "H4",
                      "text": "Can I use an Android device running CyanogenMod/LineageOS with my corporate account?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I use an Android device running CyanogenMod/LineageOS with my corporate account?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eCorporate accounts may only sync with "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000187-e165-d16f-afcf-ebfd24ab0001",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000186-c98d-dc09-a7bf-cffd6fc00000",
                      "linkText": "\u003cb\u003eGMS-certified\u003c/b\u003e",
                      "path": "/techstop/article/00000186-c98d-dc09-a7bf-cffd6fc00000",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003e\u003cb\u003eGMS-certified\u003c/b\u003e\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " Android devices. A GMS-certified Android device is one that passes the "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff777330002",
                      "href": "https://source.android.com/compatibility/index.html",
                      "linkText": "Android Compatibility Test Suite (CTS)",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eAndroid Compatibility Test Suite (CTS)\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " and has Google apps and services (most importantly the Play Store) pre-installed. An example of a non-GMS certified Android device is the Amazon Fire HD. Third-party Android ROMs are not GMS-certified.\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0755-d9c4-adfd-3fdd45670000",
                      "schemaType": "H4",
                      "text": "What permissions do I grant my IT admins by syncing my corp account on an Android device?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eWhat permissions do I grant my IT admins by syncing my corp account on an Android device?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eBy adding your corporate account on an Android device, you allow your IT admins to enforce security policies on the device (such as a lock screen, encryption), and the ability to send a remote wipe when reported as lost, stolen, or compromised.\u003c/p\u003e\u003cp\u003eOn devices with a work profile, profile separation keeps your personal apps and data fully private, even on a company-owned device.\u003c/p\u003e"
                    }
                  },
                  {
                    "insetBoxRichText": {
                      "contentId": "00000187-e166-d079-a9cf-f7eef56c0000",
                      "options": {
                        "label": "Important",
                        "schemaType": "INSET_OPTIONS",
                        "value": "important"
                      },
                      "schemaType": "INSET_BOX",
                      "body": [
                        {
                          "text": {
                            "text": "\u003cp\u003eThe \u003cb\u003eremote wipe\u003c/b\u003e behavior differs depending on setup mode, here’s how to identify it.\u003c/p\u003e"
                          }
                        },
                        {
                          "orderedListRichTextElement": {
                            "contentId": "0000018b-b69b-d206-a3cf-f6bb60180000",
                            "items": [
                              {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb60180001",
                                "items": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003e Open the \u003cb\u003eCorp Helper\u003c/b\u003e app \u003c/p\u003e"
                                    }
                                  },
                                  {
                                    "imageRichTextElement": {
                                      "altText": "X-10Bp5cCoFLaX67EWuHvTZAN5Ky-ScnnG7WE5i12yLXMcGkvsgSf8mn7JqWYpQskttw.png",
                                      "contentId": "00000187-e16c-d079-a9cf-f7ec45880000",
                                      "image": {
                                        "contentId": "00000187-e16c-d14a-a39f-f9ff8c070000",
                                        "image": {
                                          "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/32/e1/ae3a70dc4cdc876045e952498f1d/x-10bp5ccoflax67ewuhvtzan5ky-scnng7we5i12ylxmcgkvsgsf8mn7jqwypqskttw.png\",\"width\":\"30\",\"height\":\"30\"}",
                                          "entries": [
                                            {
                                              "key": "src",
                                              "value": "https://www.gstatic.com/servicedesk_bsp/32/e1/ae3a70dc4cdc876045e952498f1d/x-10bp5ccoflax67ewuhvtzan5ky-scnng7we5i12ylxmcgkvsgsf8mn7jqwypqskttw.png"
                                            },
                                            {
                                              "key": "width",
                                              "value": "30"
                                            },
                                            {
                                              "key": "height",
                                              "value": "30"
                                            }
                                          ]
                                        },
                                        "narrowImage": {
                                          "json": "{\"src\":\"https://www.gstatic.com/servicedesk_bsp/32/e1/ae3a70dc4cdc876045e952498f1d/x-10bp5ccoflax67ewuhvtzan5ky-scnng7we5i12ylxmcgkvsgsf8mn7jqwypqskttw.png\",\"width\":\"30\",\"height\":\"30\"}",
                                          "entries": [
                                            {
                                              "key": "src",
                                              "value": "https://www.gstatic.com/servicedesk_bsp/32/e1/ae3a70dc4cdc876045e952498f1d/x-10bp5ccoflax67ewuhvtzan5ky-scnng7we5i12ylxmcgkvsgsf8mn7jqwypqskttw.png"
                                            },
                                            {
                                              "key": "width",
                                              "value": "30"
                                            },
                                            {
                                              "key": "height",
                                              "value": "30"
                                            }
                                          ]
                                        },
                                        "schemaType": "IMAGE",
                                        "urlData": "https://www.gstatic.com/servicedesk_bsp/32/e1/ae3a70dc4cdc876045e952498f1d/x-10bp5ccoflax67ewuhvtzan5ky-scnng7we5i12ylxmcgkvsgsf8mn7jqwypqskttw.png"
                                      },
                                      "schemaType": "IMAGE_RICH_TEXT",
                                      "width": "30",
                                      "inline": true
                                    }
                                  },
                                  {
                                    "text": {
                                      "text": "\u003cp\u003e\u003c/p\u003e"
                                    }
                                  }
                                ],
                                "schemaType": "LIST_ITEM"
                              },
                              {
                                "contentId": "0000018b-b69b-d206-a3cf-f6bb60180002",
                                "items": [
                                  {
                                    "text": {
                                      "text": "\u003cp\u003eUnder \u003cb\u003eDevice Info\u003c/b\u003e, check \u003cb\u003eManagement Mode\u003c/b\u003e:\u003cbr\u003e"
                                    }
                                  },
                                  {
                                    "unorderedListRichTextElement": {
                                      "contentId": "0000018b-b69b-d206-a3cf-f6bb60170000",
                                      "items": [
                                        {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb60170001",
                                          "items": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003e"
                                              }
                                            },
                                            {
                                              "externalLink": {
                                                "contentId": "00000188-2515-d0b7-a7ed-fd7f07630000",
                                                "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11g0n8nkjg",
                                                "linkText": "\u003cb\u003eWork profile (PO)\u003c/b\u003e",
                                                "schemaType": "EXTERNAL",
                                                "target": "_blank",
                                                "linkRichText": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003e\u003cb\u003eWork profile (PO)\u003c/b\u003e\u003c/p\u003e"
                                                    }
                                                  }
                                                ]
                                              }
                                            },
                                            {
                                              "text": {
                                                "text": ": the remote wipe will only wipe the work profile.\u003c/p\u003e"
                                              }
                                            }
                                          ],
                                          "schemaType": "LIST_ITEM"
                                        },
                                        {
                                          "contentId": "0000018b-b69b-d206-a3cf-f6bb60170002",
                                          "items": [
                                            {
                                              "text": {
                                                "text": "\u003cp\u003e"
                                              }
                                            },
                                            {
                                              "externalLink": {
                                                "contentId": "00000188-2515-d0b7-a7ed-fd7f07630002",
                                                "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11ny381tqp",
                                                "linkText": "\u003cb\u003eWork profile (COPE)\u003c/b\u003e",
                                                "schemaType": "EXTERNAL",
                                                "target": "_blank",
                                                "linkRichText": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003e\u003cb\u003eWork profile (COPE)\u003c/b\u003e\u003c/p\u003e"
                                                    }
                                                  }
                                                ]
                                              }
                                            },
                                            {
                                              "text": {
                                                "text": " or "
                                              }
                                            },
                                            {
                                              "externalLink": {
                                                "contentId": "00000188-2515-d0b7-a7ed-fd7f07630004",
                                                "href": "https://moma.corp.google.com/glossary?entity\u003d/g/11qkt9pjtx",
                                                "linkText": "\u003cb\u003eFully Managed\u003c/b\u003e",
                                                "schemaType": "EXTERNAL",
                                                "target": "_blank",
                                                "linkRichText": [
                                                  {
                                                    "text": {
                                                      "text": "\u003cp\u003e\u003cb\u003eFully Managed\u003c/b\u003e\u003c/p\u003e"
                                                    }
                                                  }
                                                ]
                                              }
                                            },
                                            {
                                              "text": {
                                                "text": ": the remote wipe will wipe the entire device.\u003c/p\u003e"
                                              }
                                            }
                                          ],
                                          "schemaType": "LIST_ITEM"
                                        }
                                      ],
                                      "schemaType": "UNORDERED_LIST"
                                    }
                                  },
                                  {
                                    "text": {
                                      "text": "\u003c/p\u003e"
                                    }
                                  }
                                ],
                                "schemaType": "LIST_ITEM"
                              }
                            ],
                            "schemaType": "ORDERED_LIST",
                            "start": 1
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003e\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0755-d9c4-adfd-3fdd8ddd0000",
                      "schemaType": "H4",
                      "text": "I’m leaving Google, what should I do?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eI’m leaving Google, what should I do?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003ePlease factory reset your device using the following instructions: "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000188-9d08-d1dc-a1cc-fdda524f0000",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000186-c993-dc09-a7bf-cff750a00000/interactive",
                      "linkText": "resetting Android",
                      "path": "/techstop/article/00000186-c993-dc09-a7bf-cff750a00000/interactive",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eresetting Android\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": " or "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000185-8433-db9a-a3f7-a4f3c4aa0000",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000185-7930-d5bd-a3c5-fff762350000",
                      "linkText": "resetting iOS",
                      "path": "/techstop/article/00000185-7930-d5bd-a3c5-fff762350000",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eresetting iOS\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ". \u003c/p\u003e\u003cp\u003eFor corporate-owned devices (from Stuff or expensed), then use our "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000187-e171-d079-a9cf-f7fdc2ff0000",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000185-7927-d5bd-a3c5-fff7bdac0000",
                      "linkText": "return hardware instructions.",
                      "path": "/techstop/article/00000185-7927-d5bd-a3c5-fff7bdac0000",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ereturn hardware instructions.\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003c/p\u003e"
                    }
                  },
                  {
                    "insetBoxRichText": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff777340004",
                      "options": {
                        "label": "Note",
                        "schemaType": "INSET_OPTIONS",
                        "value": "note"
                      },
                      "schemaType": "INSET_BOX",
                      "body": [
                        {
                          "text": {
                            "text": "\u003cp\u003e\u003cb\u003eNote\u003c/b\u003e: Upon leaving Google, your corporate account is suspended and will be unable to sync. After 30 days, corporate accounts on Android devices will be automatically removed, including any data associated with the corporate account. Security policies on the device will no longer be enforced.\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003e\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0755-d9c4-adfd-3fddcf1b0000",
                      "schemaType": "H4",
                      "text": "I’m a member of the extended workforce and need an exception.",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eI’m a member of the extended workforce and need an exception.\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eTo use a personal mobile device with corporate access, "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-2515-d0b7-a7ed-fd7f07be0000",
                      "href": "http://go/md-request",
                      "linkText": "request an exception",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003erequest an exception\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ". Your manager and director will both have to attest this access is required for your job. \u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0755-d444-a9ce-a7dffee10000",
                      "schemaType": "H4",
                      "text": "Can I have Highly Privileged Access with a beta version of Android?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I have Highly Privileged Access with a beta version of Android?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eNo. Only stable released versions of Android are eligible for Highly Privileged Access.\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0756-d444-a9ce-a7df5f210000",
                      "schemaType": "H4",
                      "text": "Can I use Face Unlock on my Pixel 7?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eCan I use Face Unlock on my Pixel 7?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eFace Unlock on Pixel 7 (Pro) is only allowed in the Basic Access tier. More info at "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000185-7937-d5bd-a3c5-fff77734000a",
                      "href": "http://goto.google.com/pixel-face-auth-in-corp",
                      "linkText": "go/pixel-face-auth-in-corp",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ego/pixel-face-auth-in-corp\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ".\u003c/p\u003e"
                    }
                  },
                  {
                    "headingRichText": {
                      "contentId": "00000188-0756-d4f0-a7de-5777393d0000",
                      "schemaType": "H4",
                      "text": "What about ChromeOS tablets?",
                      "richText": [
                        {
                          "text": {
                            "text": "\u003cp\u003eWhat about ChromeOS tablets?\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cp\u003eThese devices run ChromeOS, which is considered a desktop OS, and is subject to a different policy: "
                    }
                  },
                  {
                    "internalLink": {
                      "contentId": "00000187-e175-d14a-a39f-f9f78d2c0000",
                      "href": "https://supportcenter.corp.google.com/techstop/article/00000185-7930-d5bd-a3c5-fff7398e0000/interactive",
                      "linkText": "go/chromeos-byod .",
                      "path": "/techstop/article/00000185-7930-d5bd-a3c5-fff7398e0000/interactive",
                      "schemaType": "INTERNAL",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ego/chromeos-byod .\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": "\u003cbr\u003e\u003c/p\u003e"
                    }
                  }
                ],
                "title": "FAQs",
                "anchor": "faqs"
              }
            ],
            "schemaType": "ACCORDION"
          }
        },
        {
          "text": {
            "text": "\u003cp\u003e\u003c/p\u003e"
          }
        }
      ],
      "contentId": "0000018a-d67b-d60d-a3bf-fe7fd9690000",
      "fieldType": "FAQs",
      "schemaType": "LISTICLE_ITEM"
    },
    {
      "anchor": "more_information",
      "body": [
        {
          "text": {
            "text": "\u003cp\u003e\u003c/p\u003e"
          }
        },
        {
          "unorderedListRichTextElement": {
            "contentId": "0000018b-b69b-d206-a3cf-f6bb60330000",
            "items": [
              {
                "contentId": "0000018b-b69b-d206-a3cf-f6bb60330001",
                "items": [
                  {
                    "text": {
                      "text": "\u003cp\u003eFor all support questions, contact "
                    }
                  },
                  {
                    "snippetRichText": {
                      "contentId": "00000188-a14b-d4f6-affe-b74f69960000",
                      "schemaType": "SNIPPET",
                      "snippet": {
                        "contentId": "00000185-35b9-d5bd-a3c5-ffff65730000",
                        "items": [
                          {
                            "externalLink": {
                              "contentId": "00000185-a6c9-d800-adfd-bfcdda450000",
                              "href": "https://goto.google.com/techstop",
                              "linkText": "Techstop",
                              "schemaType": "EXTERNAL",
                              "target": "_blank",
                              "linkRichText": [
                                {
                                  "text": {
                                    "text": "\u003cp\u003eTechstop\u003c/p\u003e"
                                  }
                                }
                              ]
                            }
                          }
                        ],
                        "name": "go/Techstop snippet",
                        "schemaType": "SNIPPET"
                      }
                    }
                  },
                  {
                    "text": {
                      "text": ".\u003c/p\u003e"
                    }
                  }
                ],
                "schemaType": "LIST_ITEM"
              },
              {
                "contentId": "0000018b-b69b-d206-a3cf-f6bb60330002",
                "items": [
                  {
                    "text": {
                      "text": "\u003cp\u003eFor comments or feedback, contact the WMF team via "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-2515-d0b7-a7ed-fd7f07c80001",
                      "href": "http://goto.google.com/wmf-bug",
                      "linkText": "go/wmf-bug",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003ego/wmf-bug\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ".\u003c/p\u003e"
                    }
                  }
                ],
                "schemaType": "LIST_ITEM"
              },
              {
                "contentId": "0000018b-b69b-d206-a3cf-f6bb60330003",
                "items": [
                  {
                    "text": {
                      "text": "\u003cp\u003eFor broader security policy-related questions, contact "
                    }
                  },
                  {
                    "externalLink": {
                      "contentId": "00000188-2515-d0b7-a7ed-fd7f07c80003",
                      "href": "mailto:sp@google.com",
                      "linkText": "sp@google.com",
                      "schemaType": "EXTERNAL",
                      "target": "_blank",
                      "linkRichText": [
                        {
                          "text": {
                            "text": "\u003cp\u003esp@google.com\u003c/p\u003e"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "text": {
                      "text": ".\u003c/p\u003e"
                    }
                  }
                ],
                "schemaType": "LIST_ITEM"
              }
            ],
            "schemaType": "UNORDERED_LIST"
          }
        }
      ],
      "contentId": "0000018a-d66f-df32-abfb-deef55e50000",
      "fieldType": "More Information",
      "heading": "Contact",
      "schemaType": "LISTICLE_ITEM"
    }
  ];
  itemWrapper(items)
}


module.exports = entries;