const validated = [
  {
    type: "Validated",
    value: "validated",
  },
  {
    type: "Work In Progress",
    value: "work in progress"
  },
  {
    type: "Pending Validation",
    value: "pending validation"
  },
  {
    type: "Not validated",
    value: "not-validated"
  },
  {
    type: "Archived",
    value: "archived"
  }
];


const articleChoices = [
  {
    "value": "intro",
    "key": "Intro"
  },
  {
    "value": "Before You Begin",
    "key": "Before You Begin"
  },
  {
    "value": "Faqs",
    "key": "FAQs"
  },
  {
    "value": "Legacy type",
    "key": "Legacy Type"
  },
  {
    "value": "More information",
    "key": "More Information"
  },
  {
    "value": "Resolution",
    "key": "Resolution"
  },
  {
    "value": "Related links",
    "key": "Related Links"
  },
  {
    "value": "Root Cause",
    "key": "Root Cause"
  },
  {
    "value": "Step - index",
    "key": "Step - index"
  },
  {
    "value": "Step - No index",
    "key": "Step - No index"
  },
  {
    "value": "Topic heading",
    "key": "Topic Heading"
  }
]

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

module.exports = {
  validated,
  articleChoices,
  missingRefs
}