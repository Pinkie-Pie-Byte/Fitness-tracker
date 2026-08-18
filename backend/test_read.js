const fs = require('fs');
const path = require('path');
console.log(__dirname + '/bodybuilding_top_200.json');
try {
  fs.readFileSync(__dirname + '/bodybuilding_top_200.json', 'utf8');
  console.log('Success');
} catch (e) {
  console.log('Error', e);
}
