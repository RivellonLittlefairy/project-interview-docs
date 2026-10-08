const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(Boolean).filter(file =>
    /^[^/]+\.html$/.test(file) ||
    /^(guides|repositories)\/[^/]+\.html$/.test(file) ||
    /^assets\/.+\.(css|js|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(file));
assert(files.includes('index.html'), '发布包必须包含首页');
assert(files.includes('assets/search-data.js'), '发布包必须包含搜索索引');
fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  assert(!fs.lstatSync(source).isSymbolicLink(), `不能发布符号链接：${file}`);
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
console.log(`发布包：${files.length} 个网站文件 → _site/`);
