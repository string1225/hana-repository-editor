var fs = require("fs");
var path = require("path");
var prefix = "'use strict';\n\nexport default ";
var result = { "file": {}, "folder": {} };

function readDir(root) {
    let aTemplate = fs.readdirSync(root);
    aTemplate.forEach((x) => {
        let currentPath = path.join(root, x);
        console.log(currentPath);
        let info = fs.statSync(currentPath);
        if (info.isDirectory()) {
            result.folder[currentPath] = true;
            readDir(currentPath);
        } else {
            result.file[currentPath] = fs.readFileSync(currentPath,"utf8");
        }
    });
};
readDir("./");

fs.writeFileSync("../src/template.ts", prefix + JSON.stringify(result),"utf8");

console.log("done");