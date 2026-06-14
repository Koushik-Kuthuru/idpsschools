const fs = require('fs');

const files = [
  'src/components/portals/TeacherPortalLayout.tsx',
  'src/components/portals/StudentPortalLayout.tsx',
  'src/components/portals/AdminPortalLayout.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Add import if not present
  if (!content.includes('useSchoolId')) {
    content = content.replace(
      /import \{ useParams, usePathname \} from "next\/navigation";/,
      `import { useParams, usePathname } from "next/navigation";\nimport { useSchoolId } from "@/hooks/useSchoolId";`
    );
  }

  // Replace schoolId extraction
  content = content.replace(
    /const schoolId = String\(params\.schoolId \|\| ""\);/,
    `const schoolId = useSchoolId();`
  );

  fs.writeFileSync(file, content, 'utf8');
});
console.log("Updated layouts");
