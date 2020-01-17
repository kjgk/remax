import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

function shouldBeExpBlock(path: NodePath) {
  if (!t.isJSXElement(path)) {
    return false;
  }
  const node = (path.node || path) as t.JSXElement;

  const openingElement = node.openingElement.name;
  if (!t.isJSXIdentifier(openingElement)) {
    return true;
  }

  return openingElement.name !== 'expression-block';
}

export default function decorate() {
  return {
    visitor: {
      JSXExpressionContainer: (path: NodePath) => {
        const node = path.node as t.JSXExpressionContainer;
        if (t.isJSXEmptyExpression(node.expression)) {
          path.remove();
          return;
        }

        if (!shouldBeExpBlock(path.parentPath)) {
          return;
        }

        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier('expression-block'), []),
            t.jsxClosingElement(t.jsxIdentifier('expression-block')),
            [node],
            false
          )
        );
      },
      JSXFragment: (path: NodePath) => {
        const node = path.node as t.JSXFragment;

        path.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier('block'), []),
            t.jsxClosingElement(t.jsxIdentifier('block')),
            node.children,
            false
          )
        );
      },
    },
  };
}
