const express = require('express');
const puppeteer = require("puppeteer");
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const appendScript = (code) => {
  const script = document.createElement('script');
  script.textContent = code;
  script.crossOrigin = 'anonymous';

  document.head.appendChild(script);
};

app.post('/start', async (req, res) => {
  const url = req.body.url;
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto(url);

  const bootstrap = fs.readFileSync(path.join(__dirname, 'public', 'single-file-bootstrap.js')).toString();

  await page.evaluate(appendScript, bootstrap);

  const file = fs.readFileSync(path.join(__dirname, 'public', 'single-file.js')).toString();

  await page.evaluate(appendScript, file);

  await page.exposeFunction('saveFile', (data) => {
    fs.writeFileSync('test.html', data);
  });

  await page.addScriptTag({
    content: `
      async function exec() {
        const { content, title, filename } = await singlefile.getPageData({
          removeHiddenElements: false,
          removeUnusedStyles: false,
          removeUnusedFonts: false,
          removeImports: false,
          blockScripts: false,
          blockAudios: false,
          blockVideos: false,
          compressHTML: false,
          removeAlternativeFonts: false,
          removeAlternativeMedias: false,
          removeAlternativeImages: false,
          groupDuplicateImages: false
        });
        window.saveFile(content);
      };
      exec();
    `
  });

  res.json({
    message: 'success'
  });
});
