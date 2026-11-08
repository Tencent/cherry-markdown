import ts from 'typescript';

// Read the pattern actually passed to alt.match(), not an unrelated literal.
// Unknown or ambiguous upstream shapes must be reviewed instead of guessed.
export function extractImagePattern(body, method) {
  const source = ts.createSourceFile('method.js', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const calls = [];
  const declarations = new Map();
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      const values = declarations.get(name) ?? [];
      values.push(node);
      declarations.set(name, values);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'alt' &&
      node.expression.name.text === 'match'
    ) calls.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (calls.length !== 1 || calls[0].arguments.length !== 1) throw new Error(`Ambiguous Cherry image match: ${method}`);
  let pattern = calls[0].arguments[0];
  if (ts.isIdentifier(pattern)) {
    const values = declarations.get(pattern.text);
    if (values?.length !== 1) throw new Error(`Ambiguous Cherry image pattern: ${method}`);
    if (!(values[0].parent.flags & ts.NodeFlags.Const)) throw new Error(`Mutable Cherry image pattern: ${method}`);
    pattern = values[0].initializer;
  }
  if (!pattern || !ts.isRegularExpressionLiteral(pattern)) throw new Error(`Unsupported Cherry image pattern: ${method}`);
  return pattern.getText(source);
}
