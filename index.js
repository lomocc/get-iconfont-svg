const fs = require('fs');
const request = require('request');
const puppeteer = require('puppeteer');

module.exports = async function(
  github_user,
  github_pwd,
  project_id,
  svg_path,
  debug = false
) {
  console.log(github_user, github_pwd, project_id, svg_path);
  if (!github_user || !github_pwd || !project_id || !svg_path) {
    console.log(github_user, github_pwd, project_id, svg_path);
    return;
  }
  const browser = await puppeteer.launch({ headless: !debug });
  const githubpage = await browser.newPage();
  await githubpage.goto('https://github.com/login');
  await githubpage.type('#login_field', github_user);
  await githubpage.type('#password', github_pwd);
  await githubpage.click('[name="commit"]');

  const page = await browser.newPage();
  await page.goto('http://www.iconfont.cn/');
  await page.click('.quick-menu > .clearfix > li > .signin > .iconfont');
  await page.click('.login-div > ul > li > a > .github');

  await page.evaluate(() => {
    let btn = document.querySelector('#js-oauth-authorize-btn');
    if (btn) btn.click();
  });

  const detailpage = await browser.newPage();
  await detailpage.goto(
    'http://www.iconfont.cn/api/project/detail.json?pid=' + project_id
  );
  const result = await detailpage.evaluate(() =>
    JSON.parse(document.body.innerText)
  );
  let svgRemoteUrl = result.data.font.svg_file;
  if (svgRemoteUrl.indexOf('//') == 0) {
    svgRemoteUrl = 'http:' + svgRemoteUrl;
  }
  const file = fs.createWriteStream(svg_path);
  file.on('finish', () => {
    file.close(() => {});
  });
  request
    .get(svgRemoteUrl)
    .on('error', err => {
      console.log(err);
    })
    .pipe(file);

  await browser.close();
};
