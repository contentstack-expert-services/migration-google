const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const { v4 } = require('uuid');

const readFile = ({ path }) => {
  try {
    const data = fs.readFileSync(path, "utf-8")
    if (typeof data === "string") {
      return JSON?.parse(data);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

const writeFile = ({ path, data }) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    throw err;
  }
}

const getValue = (data, path) => {
  return _.get(data, path)
}


const uidGenrator = () => {
  return v4()?.replace(/-/g, '')
}

const getHeadingType = ({ headingType }) => {
  const match = headingType.match(/\d+/);
  if (match?.length) {
    const extractedNumber = match?.[0];
    return `h${extractedNumber}`
  } else {
    // console.log("No number found in the heading.");
  }
}

const writeEntry = ({ data, contentType, locale }) => {
  fs.writeFileSync(
    path.join(
      __dirname,
      `../google/entries/${contentType}`,
      `${locale}.json`
    ),
    JSON.stringify(data, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

const handleFile = ({ locale, contentType, entry, uid }) => {
  let data = {};
  if (
    fs.existsSync(
      path.join(
        __dirname,
        `../google/entries/${contentType}`
      )
    )
  ) {
    const prevEntries = readFile({
      path:
        path.join(
          __dirname,
          `../google/entries/${contentType}`,
          `${locale}.json`
        )
    })
    if (prevEntries) {
      data = prevEntries
    }
    data[uid] = entry;
    writeEntry({ data, contentType, locale })
  } else {
    fs.mkdirSync(
      path.join(
        __dirname,
        `../google/entries/${contentType}`
      ),
      { recursive: true }
    );
    data[uid] = entry;
    writeEntry({ data, contentType, locale })
  }
}

module.exports = {
  readFile,
  writeFile,
  getValue,
  uidGenrator,
  getHeadingType,
  handleFile
}