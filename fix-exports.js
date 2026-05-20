const fs = require('fs');
const path = require('path');

function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file, ext));
    } else {
      if (file.endsWith(ext)) results.push(file);
    }
  });
  return results;
}

const files = getFiles('src/app/schools', '.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<ExportButton data={[]} filename="Export"')) {
    let dataVar = '[]';
    
    // Guessing data variable
    if (content.includes('const filtered = useMemo')) dataVar = 'filtered';
    else if (content.includes('const filteredPos = useMemo')) dataVar = 'filteredPos';
    else if (content.includes('const filteredLogs = useMemo')) dataVar = 'filteredLogs';
    else if (content.includes('const filteredStock = useMemo')) dataVar = 'filteredStock';
    else if (content.includes('const filteredEvents = useMemo')) dataVar = 'filteredEvents';
    else if (content.includes('const filteredStaff = useMemo')) dataVar = 'filteredStaff';
    else if (content.includes('const filteredEmployees = useMemo')) dataVar = 'filteredEmployees';
    else if (content.includes('const filteredTeachers = useMemo')) dataVar = 'filteredTeachers';
    else if (content.includes('const filteredLeaves = useMemo')) dataVar = 'filteredLeaves';
    else if (content.includes('const students = useMemo') || content.includes('const [students,')) dataVar = 'students';
    else if (content.includes('const leaves = useMemo') || content.includes('const [leaves,')) dataVar = 'leaves';
    else if (content.includes('const staff = useMemo') || content.includes('const [staff,')) dataVar = 'staff';
    else if (content.includes('const employees = useMemo') || content.includes('const [employees,')) dataVar = 'employees';
    else if (content.includes('const events = useMemo') || content.includes('const [events,')) dataVar = 'events';
    else if (content.includes('const teachers = useMemo') || content.includes('const [teachers,')) dataVar = 'teachers';
    else if (content.includes('const departments = useMemo') || content.includes('const [departments,')) dataVar = 'departments';
    else if (content.includes('const [rows,')) dataVar = 'rows';
    else if (content.includes('const data =')) dataVar = 'data';
    else if (content.includes('const entries =')) dataVar = 'entries';
    else if (content.includes('const items =')) dataVar = 'items';

    // special cases
    if (file.includes('finance/reports')) dataVar = '[]'; 
    
    content = content.replace(/<ExportButton data=\{\[\]\} filename="Export"/g, `<ExportButton data={${dataVar}} filename="Export"`);
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)} with data={${dataVar}}`);
  }
});
