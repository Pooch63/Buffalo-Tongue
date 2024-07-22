const terser = require("terser");
const fs = require("fs");

const minified = terser.minify_sync(
  [fs.readFileSync("./lib/db.js").toString()],
  {
    // compress: true,
    // sourceMap: {
    //   content: fs.readFileSync("./lib/db.js.map").toString(),
    //   url: "./db.min.js.map",
    // },
    mangle: {
      properties: false,
    },
    format: {
      semicolons: false,
    },
  }
);

console.log(`Minified source code`);

// fs.writeFileSync("./lib/db.min.js.map", minified.map);
fs.writeFileSync("./lib/db.min.js", minified.code);
