const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'frontend/src/pages/Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const OLD = `             </div>
            )}
         </motion.div>`;

const NEW = `             </div>
            )}

            {activeTab === 'CustomFields' && authUser?.role === 'Admin' && (
              <CustomFieldsTab />
            )}
         </motion.div>`;

if (content.includes(OLD)) {
    content = content.replace(OLD, NEW);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: CustomFields setup inserted!');
} else {
    console.log('FAILED to find target block in Settings.tsx');
}
