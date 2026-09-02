const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const dependencyRoot = process.env.CODEX_NODE_MODULES;
if (!dependencyRoot) {
  throw new Error('请先设置 CODEX_NODE_MODULES，指向包含 playwright 的 node_modules 目录。');
}

const { chromium } = require(path.join(dependencyRoot, 'playwright'));
const pageUrl = pathToFileURL(path.resolve(__dirname, '..', 'android-3-5-years-interview-guide.html')).href;
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'ipad-portrait', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

function gradientCount(backgroundImage) {
  return (backgroundImage.match(/linear-gradient/g) || []).length;
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.goto(pageUrl, { waitUntil: 'load' });

      const result = await page.locator('.interview-accordion summary').first().evaluate((summary) => {
        const detail = summary.closest('details');
        const summaryStyle = getComputedStyle(summary);
        const iconStyle = getComputedStyle(summary, '::before');
        const root = document.documentElement;

        return {
          alignItems: summaryStyle.alignItems,
          iconContent: iconStyle.content,
          iconBackground: iconStyle.backgroundImage,
          iconBackgroundPosition: iconStyle.backgroundPosition,
          iconWidth: iconStyle.width,
          iconHeight: iconStyle.height,
          open: detail.open,
          overflow: root.scrollWidth - root.clientWidth,
        };
      });

      assert.equal(result.overflow, 0, `${viewport.name}: 页面不应横向溢出`);
      assert.equal(result.alignItems, 'center', `${viewport.name}: 问题文字和图标必须垂直居中`);
      assert.ok(result.iconContent === '""' || result.iconContent === 'none', `${viewport.name}: 加号不能依赖字体字形`);
      assert.equal(result.iconWidth, result.iconHeight, `${viewport.name}: 图标底必须是正圆`);
      assert.ok(gradientCount(result.iconBackground) >= 2, `${viewport.name}: 收起态必须由两条居中线段绘制加号`);
      const linePositions = result.iconBackgroundPosition.split(',').slice(0, gradientCount(result.iconBackground));
      assert.ok(linePositions.every((value) => value.trim() === '50% 50%'), `${viewport.name}: 加号线段必须几何居中`);

      await page.locator('.interview-accordion summary').first().click();
      const expanded = await page.locator('.interview-accordion summary').first().evaluate((summary) => ({
        open: summary.closest('details').open,
        iconBackground: getComputedStyle(summary, '::before').backgroundImage,
        summaryColor: getComputedStyle(summary).color,
        bodyColor: getComputedStyle(document.body).color,
      }));

      assert.equal(expanded.open, true, `${viewport.name}: 点击后应展开答案`);
      assert.equal(gradientCount(expanded.iconBackground), 1, `${viewport.name}: 展开态应只保留一条居中横线`);
      assert.equal(expanded.summaryColor, expanded.bodyColor, `${viewport.name}: 展开态不应把整行问题文字染成强调色`);
      await page.close();
    }

    console.log(`PASS: ${viewports.length} 个视口的 accordion UI 检查通过`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
