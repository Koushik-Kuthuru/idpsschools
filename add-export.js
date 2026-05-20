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

    let hasChanges = false;

    // Pattern for regular <button>...<Download.../> Export ...</button>
    // Note: [\s\S]*? handles newlines between tags.
    const buttonRegex = /<button[^>]*>[\s\S]*?<Download[^>]*size=\{([0-9]+)\}[^>]*\/>[\s\S]*?Export(?: PDF| CSV)?[\s\S]*?<\/button>/g;

    content = content.replace(buttonRegex, (match, p1) => {
      // Find className
      const classMatch = match.match(/className="([^"]+)"/);
      const className = classMatch ? classMatch[1] : '';
      
      let dataVar = "[]";
      if (content.includes("filteredStudents")) dataVar = "filteredStudents";
      else if (content.includes("filteredRoster")) dataVar = "filteredRoster";
      else if (content.includes("filteredStaff")) dataVar = "filteredStaff";
      else if (content.includes("filteredData")) dataVar = "filteredData";
      else if (content.includes("filteredUsers")) dataVar = "filteredUsers";
      else if (content.includes("logs")) dataVar = "logs";
      else if (content.includes("filteredItems")) dataVar = "filteredItems";
      else if (content.includes("filteredLeaves")) dataVar = "filteredLeaves";
      else if (content.includes("filteredInvoices")) dataVar = "filteredInvoices";
      else if (content.includes("filteredPayments")) dataVar = "filteredPayments";
      else if (content.includes("filteredExpenses")) dataVar = "filteredExpenses";
      else if (content.includes("filteredFees")) dataVar = "filteredFees";
      else if (content.includes("filteredLeads")) dataVar = "filteredLeads";
      else if (content.includes("filteredClasses")) dataVar = "filteredClasses";
      else if (content.includes("filteredAssets")) dataVar = "filteredAssets";
      else if (content.includes("filteredOrders")) dataVar = "filteredOrders";

      return `<ExportButton data={${dataVar}} filename="Export" className="${className}" iconSize={${p1}} />`;
    });

    // Pattern for <button onClick={handleExportCSV}> ... <Download /> <span...>Export CSV</span> ... </button>
    const buttonRegex2 = /<button[^>]*onClick=\{handleExportCSV\}[^>]*>[\s\S]*?<\/button>/g;
    content = content.replace(buttonRegex2, (match) => {
      const classMatch = match.match(/className="([^"]+)"/);
      const className = classMatch ? classMatch[1] : '';
      let dataVar = "[]";
      if (content.includes("filteredUsers")) dataVar = "filteredUsers";
      else if (content.includes("logs")) dataVar = "logs";
      return `<ExportButton data={${dataVar}} filename="Export" className="${className}" iconSize={14} />`;
    });

    if (content !== original) {
      if (!content.includes('import ExportButton')) {
        // Find last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + `import ExportButton from "@/components/ui/ExportButton";\n` + content.slice(endOfLine + 1);
        } else {
          content = `import ExportButton from "@/components/ui/ExportButton";\n` + content;
        }
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
