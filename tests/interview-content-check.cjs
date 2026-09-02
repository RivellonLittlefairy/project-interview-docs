const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const dependencyRoot = process.env.CODEX_NODE_MODULES;
if (!dependencyRoot) throw new Error('请设置 CODEX_NODE_MODULES，指向包含 playwright 的 node_modules。');

const { chromium } = require(path.join(dependencyRoot, 'playwright'));
const root = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(root, '..', '..', '..');
const guideUrl = pathToFileURL(path.join(root, 'android-3-5-years-interview-guide.html')).href;
const indexUrl = pathToFileURL(path.join(root, 'index.html')).href;
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'ipad-portrait', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];
const sampleTerms = ['reified', 'TransactionTooLargeException', 'RemoteMediator', 'Baseline Profile', 'Top K'];

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      await page.goto(guideUrl, { waitUntil: 'load' });

      const structure = await page.evaluate(() => {
        const topics = [...document.querySelectorAll('.interview-accordion > [data-topic]')];
        const details = topics.flatMap((topic) => [...topic.querySelectorAll(':scope > details')]);
        const summaries = details.map((detail) => detail.querySelector(':scope > summary')?.textContent.replace(/\s+/g, ' ').trim() || '');
        const summaryNodes = details.map((detail) => detail.querySelector(':scope > summary')).filter(Boolean);
        const displayedCount = Number(document.querySelector('.stats-grid .stat-card:nth-child(2) strong')?.textContent.trim());
        return {
          topicCount: topics.length,
          questionCount: details.length,
          displayedCount,
          initialStatus: document.querySelector('[data-accordion-status]')?.textContent || '',
          minQuestionsInTopic: Math.min(...topics.map((topic) => topic.querySelectorAll(':scope > details').length)),
          uniqueSummaries: new Set(summaries).size,
          missingStructure: details.filter((detail) => !detail.querySelector(':scope > summary') || !detail.querySelector(':scope > .answer-body')).length,
          shortAnswers: details.filter((detail) => (detail.querySelector(':scope > .answer-body')?.textContent.trim().length || 0) < 20).length,
          invalidQuestionTitleStructure: summaryNodes.filter((summary) => {
            const elementChildren = [...summary.children];
            const directText = [...summary.childNodes]
              .filter((node) => node.nodeType === Node.TEXT_NODE)
              .some((node) => node.textContent.trim());
            return directText
              || elementChildren.length !== 2
              || !elementChildren[0].classList.contains('question-text')
              || !elementChildren[1].classList.contains('question-tag');
          }).length,
          invalidProjectUsage: details.filter((detail) => {
            const body = detail.querySelector(':scope > .answer-body');
            const usageBlocks = body ? [...body.querySelectorAll(':scope > .project-usage')] : [];
            if (usageBlocks.length !== 1) return true;
            const usage = usageBlocks[0];
            const label = usage.querySelector(':scope > strong')?.textContent.trim() || '';
            return label !== '当前项目怎么用：'
              || usage.textContent.replace(/\s+/g, ' ').trim().length < 40
              || ![...usage.querySelectorAll(':scope > code')].some((code) => /^(?:yyyyy-cdoe|pikachu|docs)[\\/]/.test(code.textContent.trim()));
          }).length,
          invalidPlainLanguageStructure: details.filter((detail) => {
            const body = detail.querySelector(':scope > .answer-body');
            const firstParagraph = body?.querySelector(':scope > p:not(.project-usage)');
            const firstLabel = firstParagraph?.querySelector(':scope > strong')?.textContent.trim() || '';
            const stiffLabels = [...(body?.querySelectorAll(':scope > :not(.project-usage) strong') || [])]
              .some((strong) => /^(原理|机制|落点|边界|误区|边界\/误区|项目落点|工程落点|能力分组|运行时链路|声明式链路|度量优先)：$/.test(strong.textContent.trim()));
            return firstLabel !== '先说结论：' || stiffLabels;
          }).length,
          stiffPhraseCount: details.filter((detail) => /(?:未检索到|认领|直证|item identity|局部 mutation|请求代际|项目源码中源码里|消费者编译边界|三路回调边界|request-token|in-flight refresh)/i
            .test(detail.querySelector(':scope > .answer-body')?.textContent || '')).length,
          projectUsagePaths: details.flatMap((detail) => [...detail.querySelectorAll(':scope > .answer-body > .project-usage > code')]
            .map((code) => code.textContent.trim())
            .filter((value) => /^(?:yyyyy-cdoe|pikachu|docs)[\\/]/.test(value))),
        };
      });

      assert.equal(structure.topicCount, 19, `${viewport.name}: 知识域数量应保持 19`);
      assert.ok(structure.questionCount >= 180, `${viewport.name}: 独立问答应不少于 180`);
      assert.equal(structure.displayedCount, structure.questionCount, `${viewport.name}: 顶部题数必须与 DOM 一致`);
      assert.ok(structure.initialStatus.includes(String(structure.questionCount)), `${viewport.name}: 初始状态必须显示真实题数`);
      assert.ok(structure.minQuestionsInTopic >= 6, `${viewport.name}: 每个知识域至少要有 6 张问答卡`);
      assert.equal(structure.uniqueSummaries, structure.questionCount, `${viewport.name}: 不应存在完全重复的问题标题`);
      assert.equal(structure.missingStructure, 0, `${viewport.name}: 每题都必须有 summary 和 answer-body`);
      assert.equal(structure.shortAnswers, 0, `${viewport.name}: 不应存在空答案或占位答案`);
      assert.equal(structure.invalidQuestionTitleStructure, 0, `${viewport.name}: 每个问题标题必须由单一 question-text 和 question-tag 组成，避免内联代码被 Grid 拆散`);
      assert.equal(structure.invalidProjectUsage, 0, `${viewport.name}: 每个答案必须有且只有一段带源码路径的“当前项目怎么用”`);
      assert.equal(structure.invalidPlainLanguageStructure, 0, `${viewport.name}: 每个答案都要先用口语给结论，并移除评审稿式标签`);
      assert.equal(structure.stiffPhraseCount, 0, `${viewport.name}: 答案中不应残留中英夹杂或代码审计式短语`);
      for (const evidencePath of structure.projectUsagePaths) {
        const normalizedPath = evidencePath.replace(/:\d+$/, '').replace(/[\\/]/g, path.sep);
        const absolutePath = path.resolve(workspaceRoot, normalizedPath);
        assert.ok(absolutePath.startsWith(`${workspaceRoot}${path.sep}`), `${viewport.name}: 项目证据路径不能越出工作区：${evidencePath}`);
        assert.ok(fs.existsSync(absolutePath), `${viewport.name}: 项目证据路径不存在：${evidencePath}`);
      }

      for (const term of sampleTerms) {
        const input = page.locator('[data-accordion-search]');
        await input.fill(term);
        const matched = await page.locator('.interview-accordion details:not([hidden])').count();
        const openMatched = await page.locator('.interview-accordion details:not([hidden])[open]').count();
        assert.ok(matched >= 1, `${viewport.name}: 本页搜索应命中 ${term}`);
        assert.equal(openMatched, matched, `${viewport.name}: 搜索 ${term} 后命中项应自动展开`);
        await input.fill('');
      }

      await page.locator('[data-accordion-expand]').click();
      const expanded = await page.evaluate(() => ({
        visible: document.querySelectorAll('.interview-accordion details:not([hidden])').length,
        open: document.querySelectorAll('.interview-accordion details:not([hidden])[open]').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      assert.equal(expanded.open, expanded.visible, `${viewport.name}: 展开全部必须打开所有可见问题`);
      assert.equal(expanded.overflow, 0, `${viewport.name}: 全部展开后不应横向溢出`);
      assert.deepEqual(pageErrors, [], `${viewport.name}: 页面不应产生脚本错误`);
      await page.close();
    }

    const prefix = 'window.__INTERVIEW_DOCS_SEARCH__ = ';
    const rawSearchData = fs.readFileSync(path.join(root, 'assets', 'search-data.js'), 'utf8');
    const searchData = JSON.parse(rawSearchData.slice(prefix.length).replace(/;\s*$/, ''));
    const guideEntry = searchData.find((entry) => entry.href === 'android-3-5-years-interview-guide.html');
    assert.ok(guideEntry, '全站搜索索引必须包含知识地图');
    for (const term of sampleTerms) assert.ok(guideEntry.text.includes(term), `全站搜索索引应包含 ${term}`);
    assert.ok(guideEntry.text.includes('当前项目怎么用'), '全站搜索索引必须包含逐题项目用法');
    assert.ok(guideEntry.text.includes('yyyyy-cdoe/'), '全站搜索索引必须包含可检索的项目源码路径');

    const indexPage = await browser.newPage({ viewport: viewports[0] });
    await indexPage.goto(indexUrl, { waitUntil: 'load' });
    await indexPage.locator('[data-search-input]').fill('RemoteMediator');
    const guideResult = indexPage.locator('[data-search-results] a[href="android-3-5-years-interview-guide.html"]');
    assert.ok(await guideResult.count(), '首页全站搜索 RemoteMediator 应命中知识地图');
    const ctaText = await indexPage.locator('a[href="android-3-5-years-interview-guide.html"] small').first().textContent();
    assert.ok(ctaText.includes('186'), '首页入口应显示最新题数');
    await indexPage.close();

    console.log(`PASS: ${viewports.length} 个视口、19 个知识域、186 个问答与全站搜索检查通过`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
