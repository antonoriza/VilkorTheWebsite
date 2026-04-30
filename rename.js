import fs from 'fs';
import path from 'path';

const REPLACEMENTS = [
  { regex: /Vilkor/g, replacement: 'Vilkor' },
  { regex: /vilkor/g, replacement: 'vilkor' },
  { regex: /Vilkor/gi, replacement: 'Vilkor' },
  { regex: /Vilkor/g, replacement: 'Vilkor' },
  { regex: /Vilkor/gi, replacement: 'Vilkor' },
];

const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.gemini', 'appLogs'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        results = results.concat(walk(filePath));
      }
    } else {
      // Only process text files we care about
      if (/\.(ts|tsx|js|jsx|json|md|html|css)$/.test(file) || file === 'vilkor') {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk(process.cwd());

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  REPLACEMENTS.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
