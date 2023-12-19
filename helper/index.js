const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const { v4 } = require('uuid');
const config = require("../config");

const readFile = ({ path, readFileV2 = false }) => {
  try {
    if (readFileV2) {
      let allObjData = {};
      let data = fs.readFileSync(`${path}/index.json`, "utf-8")
      if (typeof data === "string") {
        data = JSON?.parse(data);
      }
      for (const [key, value] of Object?.entries(data)) {
        const sepratedData = readFile({ path: `${path}/${value}` })
        if (Object?.keys(allObjData)?.length) {
          allObjData = { ...sepratedData, ...allObjData }
        } else {
          allObjData = sepratedData;
        }
        return sepratedData;
      }
    } else {
      const data = fs.readFileSync(path, "utf-8")
      if (typeof data === "string" && data !== "") {
        return JSON?.parse(data);
      } else {
        console.log(`file not Found ${path}`);
      }
      return data;
    }
  } catch (err) {
    console.info(`file not Found ${path}`)
    // throw err;
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
      `${config?.paths?.export?.dir}/entries/${contentType}/${locale}`,
      `${locale}.json`
    ),
    JSON.stringify(data, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
  const indexObj = { "1": `${locale}.json` }
  fs.writeFileSync(
    path.join(
      __dirname,
      `${config?.paths?.export?.dir}/entries/${contentType}/${locale}`,
      "index.json"
    ),
    JSON.stringify(indexObj, null, 4),
    (err) => {
      if (err) throw err;
    }
  );
}

const handleFile = ({ locale, contentType, entry, uid }) => {
  // if (entry?.uid) {
  //   entry = JSON?.stringify?.(entry)?.replace?.(/&amp;/g, '&');
  //   entry = JSON?.parse?.(entry); 
  // }
  let data = {};
  if (
    fs.existsSync(
      path.join(
        __dirname,
        `${config?.paths?.export?.dir}/entries/${contentType}/${locale}`
      )
    )
  ) {
    const prevEntries = readFile({
      path:
        path.join(
          __dirname,
          `${config?.paths?.export?.dir}/entries/${contentType}/${locale}`,
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
        `${config?.paths?.export?.dir}/entries/${contentType}/${locale}`
      ),
      { recursive: true }
    );
    data[uid] = entry;
    writeEntry({ data, contentType, locale })
  }
}
function isURL(url) {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return urlRegex?.test?.(url);
}

function removeTags(inputString) {
  if (inputString?.includes("<g-snippet") || isURL(inputString)) {
    return inputString;
  }
  const htmlTagsRegex = /<[^>]*>/g;
  return `${_.replace(inputString, htmlTagsRegex, '')}`;
}

module.exports = {
  readFile,
  writeFile,
  getValue,
  uidGenrator,
  getHeadingType,
  handleFile,
  removeTags
}