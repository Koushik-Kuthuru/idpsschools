const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'src/app/schools/idpskalaburagi/admin/academic/students/[id]/profile/page.tsx'),
  path.join(__dirname, 'src/app/schools/idpscherukupalli/admin/academic/students/[id]/profile/page.tsx')
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to reduce the left padding on the Swiggy tabs so they align nicely with the content.
  // And adjust the right-side padding so it doesn't overflow or look unbalanced.

  // 1. Adjust the padding around the tabs container
  content = content.replace(
    /<div className="flex overflow-x-auto hide-scrollbar gap-1 items-end px-6 pt-4">/g,
    '<div className="flex overflow-x-auto hide-scrollbar gap-1 items-end px-2 sm:px-4 pt-4">'
  );

  // 2. Adjust the padding inside the dynamic content area
  content = content.replace(
    /\{"\/\* Dynamic Content Area \*\/"\}\n                  <div className="p-6 pt-8 relative z-0">/g,
    '{/* Dynamic Content Area */}\n                  <div className="p-4 sm:p-6 pt-8 relative z-0">'
  );
  
  // 3. To make it closer to the screenshot, the "Basic Details" tab is slightly wider and the curves attach more tightly to the left side
  // Let's adjust the minimum width of the tabs slightly so they don't look too squished when padding is reduced
  content = content.replace(
    /className=\{\`flex flex-col items-center justify-end min-w-\[85px\] max-w-\[95px\]/g,
    'className={`flex flex-col items-center justify-end min-w-[90px] max-w-[100px]'
  );

  fs.writeFileSync(filePath, content, 'utf8');
}
