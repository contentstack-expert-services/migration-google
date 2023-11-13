const { formatName } = require(".")

const contentMapper = ({ type, name, uid }) => {
  switch (type) {
    case "string": {
      return {
        "display_name": formatName(name),
        "uid": uid,
        "data_type": "text",
        "mandatory": true,
        "unique": true,
        "field_metadata": {
          "_default": true
        },
        "multiple": false
      }
    }
  }
}

module.exports = {
  contentMapper
}