const fs = require("fs");
const _ = require("lodash");
const { v4 } = require('uuid');

const readFile = ({ path }) => {
  try {
    const data = fs.readFileSync(path, "utf-8")
    if (typeof data === "string") {
      return JSON.parse(data);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

const writeFile = ({ path, data }) => {
  try {
    fs.writeFileSync(path, data)
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
    console.log("No number found in the heading.");
  }
}

module.exports = {
  readFile,
  writeFile,
  getValue,
  uidGenrator,
  getHeadingType
}