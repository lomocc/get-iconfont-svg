# get-iconfont-svg

```js
const path = require("path");

process.env.NODE_ENV = "development";
require("react-scripts/config/env");

console.log(process.env.GITHUB_USER, process.env.GITHUB_PWD);

const downloadIconfontSvg = require("get-iconfont-svg");

downloadIconfontSvg(
  process.env.GITHUB_USER,
  process.env.GITHUB_PWD,
  "845474",
  path.resolve("./iconfont2.svg"),
  true
);
```
