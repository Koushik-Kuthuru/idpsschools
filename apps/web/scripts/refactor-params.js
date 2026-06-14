const fs = require('fs');
const path = require('path');

const SCHOOLS = ['idpscherukupalli', 'idpskalaburagi'];

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

function refactorParams() {
  SCHOOLS.forEach(schoolId => {
    const dir = path.join(__dirname, '..', `src/app/schools/${schoolId}`);
    const files = walkSync(dir);

    files.forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;

      // Replace: const { schoolId } = await params;
      const regex1 = /const\s+\{\s*schoolId\s*\}\s*=\s*await\s+params;/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, `const schoolId = "${schoolId}";`);
        changed = true;
      }

      // Replace: const schoolId = params.schoolId || ...
      // or similar if any exist
      const regex2 = /params\.schoolId/g;
      if (regex2.test(content)) {
        // Only if it's not already handled
        content = content.replace(regex2, `"${schoolId}"`);
        changed = true;
      }

      // Also there might be `const { id, schoolId } = await params;`
      const regex3 = /const\s+\{\s*(.*?),\s*schoolId\s*\}\s*=\s*await\s+params;/g;
      if (regex3.test(content)) {
        content = content.replace(regex3, `const { $1 } = await params;\n  const schoolId = "${schoolId}";`);
        changed = true;
      }

      const regex4 = /const\s+\{\s*schoolId,\s*(.*?)\s*\}\s*=\s*await\s+params;/g;
      if (regex4.test(content)) {
        content = content.replace(regex4, `const { $1 } = await params;\n  const schoolId = "${schoolId}";`);
        changed = true;
      }

      // Sometimes schoolId is passed as a prop from params: { schoolId: string }
      // This is mostly type definition. 

      if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated params in: ${file}`);
      }
    });
  });
}

refactorParams();
