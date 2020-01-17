import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

export let JSXElementPaths: NodePath[] = [];

export default function visitJSXElement() {
  JSXElementPaths = [];

  return {
    visitor: {
      JSXElement: (path: NodePath) => {
        if (!t.isJSXElement(path.parent)) {
          JSXElementPaths.push(path);
        }
      },
    },
  };
}
