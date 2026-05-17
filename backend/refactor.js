const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const code = fs.readFileSync('index.js', 'utf8');

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: []
});

traverse(ast, {
    CallExpression(path) {
        // 1. Convert Express handlers to async
        if (
            t.isMemberExpression(path.node.callee) &&
            t.isIdentifier(path.node.callee.object, { name: 'app' }) &&
            ['get', 'post', 'put', 'delete'].includes(path.node.callee.property.name)
        ) {
            // The last argument is usually the route handler
            const handler = path.node.arguments[path.node.arguments.length - 1];
            if (t.isArrowFunctionExpression(handler) || t.isFunctionExpression(handler)) {
                handler.async = true;
            }
        }

        // 2. Add await to db.prepare(...).get(), .all(), .run()
        if (
            t.isMemberExpression(path.node.callee) &&
            ['get', 'all', 'run'].includes(path.node.callee.property.name)
        ) {
            const object = path.node.callee.object;
            // Check if the object is db.prepare(...)
            if (
                t.isCallExpression(object) &&
                t.isMemberExpression(object.callee) &&
                t.isIdentifier(object.callee.object, { name: 'db' }) &&
                t.isIdentifier(object.callee.property, { name: 'prepare' })
            ) {
                // Check if we are already inside an AwaitExpression
                if (!t.isAwaitExpression(path.parent)) {
                    path.replaceWith(t.awaitExpression(path.node));
                    path.skip(); // Prevent infinite loop on the newly created await expression
                }
            }
        }
    },
    MemberExpression(path) {
        // Fix `.lastInsertRowid` to `.id` (since our wrapper will return an object with `.id`)
        if (
            t.isIdentifier(path.node.property, { name: 'lastInsertRowid' })
        ) {
            path.node.property.name = 'id';
        }
        
        // Also handle `const count = db.prepare('...').get().count;`
        // After adding await, it becomes `await db.prepare('...').get().count` which is invalid JS
        // We need `(await db.prepare('...').get()).count`
        // The AST for this: MemberExpression -> object is CallExpression
        // If the CallExpression gets wrapped in Await, we need to ensure the AwaitExpression replaces the CallExpression properly.
        // Wait, @babel/types awaitExpression will naturally generate `(await foo()).bar`
    }
});

const output = generate(ast, {}, code);
fs.writeFileSync('index.pg.js', output.code);
console.log('Successfully generated index.pg.js');
