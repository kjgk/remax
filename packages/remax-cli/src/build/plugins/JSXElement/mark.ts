import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import { ELEMENT_ID_ATTRIBUTE_NAME } from './constants';

export default function markJSXElement() {
  const elementID = {
    id: 0,
    generate() {
      this.id += 1;
      return this.id.toString();
    },
  };

  return {
    visitor: {
      JSXOpeningElement: (path: NodePath) => {
        const element: t.JSXOpeningElement = path.node as t.JSXOpeningElement;

        if (
          element.attributes.find(
            attr =>
              t.isJSXAttribute(attr) &&
              attr.name.name === ELEMENT_ID_ATTRIBUTE_NAME
          )
        ) {
          return;
        }

        element.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(ELEMENT_ID_ATTRIBUTE_NAME),
            t.stringLiteral(elementID.generate())
          )
        );
      },
    },
  };
}
