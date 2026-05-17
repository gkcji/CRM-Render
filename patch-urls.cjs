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
      if (content.includes('http://localhost:5000')) {
        content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "`http://${window.location.hostname}:5000$1`");
        content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, "`http://${window.location.hostname}:5000$1`");
        content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`http://${window.location.hostname}:5000$1`");
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  });
}

walk(path.join(__dirname, 'frontend/src'));
console.log('Done patching frontend URLs to be dynamic!');
