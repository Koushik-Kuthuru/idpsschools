const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // The photo modal in student profile shouldn't be changed if it's the edit icon, but wait, the photo hover effect is for the remove button (trash can). The user said "in all pages actions btn are like with hover efect make sure it alway visable in all pages actions". The photo trash icon also has `opacity-0 group-hover:opacity-100`. Let's remove it everywhere.

    // Regex to match the hover classes
    content = content.replace(/opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity/g, 'transition-opacity');
    content = content.replace(/opacity-0 group-hover:opacity-100 focus:opacity-100/g, '');
    content = content.replace(/opacity-0 group-hover:opacity-100 transition-opacity/g, 'transition-opacity');
    content = content.replace(/opacity-0 group-hover:opacity-100/g, '');

    // Cleanup multiple spaces
    content = content.replace(/  +/g, ' ');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
