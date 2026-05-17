const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // We previously changed http://localhost:5000/api... to `http://${window.location.hostname}:5000/api...`
      if (content.includes('window.location.hostname}:5000/api')) {
        content = content.replace(/`http:\/\/\$\{window\.location\.hostname\}:5000\/api([^`]*)`/g, "`/api$1`");
        changed = true;
      }
      if (content.includes('window.location.hostname}:5000')) {
        content = content.replace(/`http:\/\/\$\{window\.location\.hostname\}:5000([^`]*)`/g, "`$1`");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated to relative URL:', fullPath);
      }
    }
  });
}

walk(path.join(__dirname, 'frontend/src'));
console.log('Done patching frontend URLs to relative!');
