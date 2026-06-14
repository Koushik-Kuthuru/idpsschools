const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/app/schools/idpskalaburagi/admin/academic/students/[id]/profile/page.tsx'),
  path.join(__dirname, 'src/app/schools/idpscherukupalli/admin/academic/students/[id]/profile/page.tsx')
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We need to update the attendance cell rendering logic.
  // Instead of defaulting to "P" (Present) if not absent/sunday,
  // it should check explicit status. If not explicitly present or absent, it should be blank "-".
  
  const oldLogic = `// Using student.attendance array/object
                                          const isSunday = student.attendance?.sundays?.includes(dateStr) || (new Date(new Date().getFullYear(), (monthIdx + 3) % 12, day).getDay() === 0);
                                          const isAbsent = student.attendance?.absentDates?.includes(dateStr);
                                          const isInvalidDate = (day === 31 && [0, 2, 4, 7, 9, 11].includes(monthIdx)) || (day > 28 && monthIdx === 10);
                                          
                                          let cellContent = "";
                                          let cellClass = "border-l border-gray-100";
                                          
                                          if (isInvalidDate) {
                                             cellClass += " bg-gray-100/50";
                                             return (
                                                <td key={monthIdx} className={\`py-1.5 px-1 \${cellClass}\`} style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
                                                   {cellContent}
                                                </td>
                                             );
                                          } else if (isSunday) {
                                             cellContent = "SUN";
                                             cellClass += " bg-emerald-100/80 text-emerald-700 font-black text-[9px] tracking-wider";
                                          } else if (isAbsent) {
                                             cellContent = "A";
                                             cellClass += " bg-red-50 text-red-600 font-black text-[10px]";
                                          } else {
                                             cellContent = "P";
                                             cellClass += " text-gray-400 font-bold text-[10px] group-hover:text-emerald-600";
                                          }`;
                                          
  const newLogic = `// Using student.attendance array/object
                                          const isSunday = student.attendance?.sundays?.includes(dateStr) || (new Date(new Date().getFullYear(), (monthIdx + 3) % 12, day).getDay() === 0);
                                          const isAbsent = student.attendance?.absentDates?.includes(dateStr);
                                          const isPresent = student.attendance?.presentDates?.includes(dateStr);
                                          const isInvalidDate = (day === 31 && [0, 2, 4, 7, 9, 11].includes(monthIdx)) || (day > 28 && monthIdx === 10);
                                          
                                          let cellContent = "";
                                          let cellClass = "border-l border-gray-100";
                                          
                                          if (isInvalidDate) {
                                             cellClass += " bg-gray-100/50";
                                             return (
                                                <td key={monthIdx} className={\`py-1.5 px-1 \${cellClass}\`} style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
                                                   {cellContent}
                                                </td>
                                             );
                                          } else if (isSunday) {
                                             cellContent = "SUN";
                                             cellClass += " bg-emerald-100/80 text-emerald-700 font-black text-[9px] tracking-wider";
                                          } else if (isAbsent) {
                                             cellContent = "A";
                                             cellClass += " bg-red-50 text-red-600 font-black text-[10px]";
                                          } else if (isPresent) {
                                             cellContent = "P";
                                             cellClass += " text-emerald-500 font-bold text-[10px] group-hover:text-emerald-600";
                                          } else {
                                             cellContent = "-";
                                             cellClass += " text-gray-300 font-bold text-[10px]";
                                          }`;

  if (content.includes('cellContent = "P";')) {
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated attendance logic in', filePath);
  } else {
    console.log('Logic not found in', filePath);
  }
}
