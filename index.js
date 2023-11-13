const helper = require("./helper")
const _export = [];

const modulesList = [
  // "content_type",
  "entries"
];


const migFunction = () => {
  try {
    const total = modulesList?.length;
    let i = 0;
    for (i = 0; i < total; i++) {
      const Export = require("./libs/" + modulesList[i] + ".js");
      const moduleExport = new Export();
      _export.push(
        (function (moduleExport) {
          return function () {
            return moduleExport.start();
          };
        })(moduleExport)
      );
    }
  } catch (err) {
    console.log("🚀 ~ file: index.js:23 ~ migFunction ~ err:", err)
  }
}


migFunction();