const fs = require('fs-extra');
const request = require('request-promise-native');
const puppeteer = require('puppeteer');
const parseString = require('xml2js').parseString;
const { SVGPathData } = require('svg-pathdata');

async function getInfo(github_user, github_pwd, project_id, options) {
  if (!github_user || !github_pwd || !project_id) {
    return;
  }
  const browser = await puppeteer.launch(options);
  const githubpage = await browser.newPage();
  await githubpage.goto('https://github.com/login');
  await githubpage.type('#login_field', github_user);
  await githubpage.type('#password', github_pwd);
  await githubpage.click('[name="commit"]');

  const page = await browser.newPage();
  await page.goto('https://www.iconfont.cn/');
  await page.waitForSelector(
    '.quick-menu > .clearfix > li > .signin > .iconfont'
  );
  await page.click('.quick-menu > .clearfix > li > .signin > .iconfont');
  await page.waitForSelector('.login-div > ul > li > a > .github');
  await page.click('.login-div > ul > li > a > .github');

  await page.evaluate(() => {
    let btn = document.querySelector('#js-oauth-authorize-btn');
    if (btn) btn.click();
  });

  const detailpage = await browser.newPage();
  await detailpage.goto(
    'https://www.iconfont.cn/api/project/detail.json?pid=' + project_id
  );
  const result = await detailpage.evaluate(() =>
    JSON.parse(document.body.innerText)
  );
  await browser.close();
  return result;
}
async function getSVG(svgRemoteUrl) {
  const svgStr = await request.get(svgRemoteUrl);
  const svgObj = await parseStringAsync(svgStr);
  const svgPathMap = getSvgPath(svgObj);
  return svgPathMap;
}
// parseString 的 promise 版
function parseStringAsync(source) {
  return new Promise((resolve, reject) =>
    parseString(source, (err, result) => (err ? reject(err) : resolve(result)))
  );
}
// 读取 svg path 的 d 属性
function getSvgPath(result) {
  let ascent = result.svg.defs[0].font[0]['font-face'][0].$.ascent; // ascent="896"
  const yOffset = +ascent;
  // Get the path
  let exportsObj = {};
  let glyphList = result.svg.defs[0].font[0].glyph;
  for (var i in glyphList) {
    let glyph = glyphList[i];
    let name = glyph.$['glyph-name'];
    // let path = glyph.$.d;
    let path = new SVGPathData(glyph.$.d).ySymmetry(yOffset).encode();
    exportsObj[name] = path;
  }
  return exportsObj;
}
module.exports = async function getIconfont(
  github_user,
  github_pwd,
  project_id,
  file,
  options
) {
  let result = await getInfo(github_user, github_pwd, project_id, options);
  let svg_file = result.data.font.svg_file;
  if (svg_file.indexOf('//') === 0) {
    svg_file = 'https:' + svg_file;
  }
  const exportSVG = await getSVG(svg_file);
  const exportSVGModule = `export default ${JSON.stringify(exportSVG)};`;
  await fs.outputFile(file, exportSVGModule);
};

exports.getInfo = getInfo;
exports.getSVG = getSVG;
