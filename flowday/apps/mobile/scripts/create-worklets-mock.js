const fs = require('fs');
const path = require('path');

const mockDir = path.join(__dirname, '..', 'node_modules', 'react-native-worklets');

// Create directory if it doesn't exist
if (!fs.existsSync(mockDir)) {
  fs.mkdirSync(mockDir, { recursive: true });
}

// Create mock plugin.js
const pluginContent = `// Mock for react-native-worklets/plugin
module.exports = function() { return {}; };
`;
fs.writeFileSync(path.join(mockDir, 'plugin.js'), pluginContent);

// Create mock package.json
const packageJson = {
  name: 'react-native-worklets',
  version: '1.0.0',
  main: 'plugin.js'
};
fs.writeFileSync(path.join(mockDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Created react-native-worklets mock');
