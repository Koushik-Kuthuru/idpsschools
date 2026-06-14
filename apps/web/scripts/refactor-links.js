const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src/app/schools/idpscherukupalli', 'src/app/schools/idpskalaburagi', 'src/components', 'src/hooks'];

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

function refactorLinks() {
  let files = [];
  DIRECTORIES.forEach(dir => {
    files = files.concat(walkSync(path.join(__dirname, '..', dir)));
  });

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We previously removed "/schools". So we look for "/${schoolId}" and change it to "/schools/${schoolId}"
    // But be careful not to double up if it's already "/schools/"
    const regex1 = /(?<!\/schools)\/\$\{schoolId\}/g;
    if (regex1.test(content)) {
      content = content.replace(regex1, `/schools/\${schoolId}`);
      changed = true;
    }

    // Handle string concat: `/" + schoolId` -> `"/schools/" + schoolId`
    const regex2 = /(?<!\/schools)\/" \+ schoolId/g;
    if (regex2.test(content)) {
      content = content.replace(regex2, `"/schools/" + schoolId`);
      changed = true;
    }

    // Handle hardcoded like `/idpscherukupalli`
    const regex3 = /(?<!\/schools)\/(idpscherukupalli|idpskalaburagi)/g;
    if (regex3.test(content)) {
      content = content.replace(regex3, `/schools/$1`);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated links in: ${file}`);
    }
  });
}

refactorLinks();
