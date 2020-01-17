import * as t from '@babel/types';
import { ELEMENT_ID_ATTRIBUTE_NAME } from './constants';
import API from '../../../API';
import { JSXElementPaths } from './visit';

function getElementID(element: t.JSXElement) {
  const attribute = element.openingElement.attributes.find(
    attr =>
      t.isJSXAttribute(attr) && attr.name.name === ELEMENT_ID_ATTRIBUTE_NAME
  ) as t.JSXAttribute;

  if (attribute) {
    return (attribute.value as t.StringLiteral).value;
  }
}

function createAttributesTemplate(
  componentType: string,
  dataPath: string,
  attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute>
) {
  const hostComponent = API.getHostComponents().get(componentType);

  function createAttributeValueTemplate(
    attributeName: string,
    value: t.StringLiteral | t.JSXExpressionContainer
  ) {
    let template = '';
    if (t.isStringLiteral(value)) {
      template = value.value;
    }

    if (t.isJSXExpressionContainer(value)) {
      if (t.isStringLiteral(value.expression)) {
        template = (value.expression as t.StringLiteral).value;
      } else {
        template = `{{${dataPath}.props['${attributeName}']}}`;
      }
    }

    return `"${template}"`;
  }

  return attributes
    .filter(attr => t.isJSXAttribute(attr))
    .filter((attr: any) => attr.name.name !== ELEMENT_ID_ATTRIBUTE_NAME)
    .map((attr: any) => {
      const prop = hostComponent?.alias?.[attr.name.name] ?? attr.name.name;
      return `${prop}=${createAttributeValueTemplate(prop, attr.value as any)}`;
    })
    .join(' ');
}

function isEmptyText(
  node:
    | t.JSXElement
    | t.JSXText
    | t.JSXFragment
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
) {
  if (node.type === 'JSXText') {
    if (!node.value.trim().replace(/\r?\n|\r/g, '')) {
      return true;
    }
  }
  return false;
}

function normalizeLiteral(literal: string) {
  if (literal.startsWith('\n')) {
    literal = literal.trimLeft();
  }

  if (literal.trim().indexOf('\n') !== -1) {
    literal = literal.replace(/\n\s+/g, ' ');
  }

  if (literal.indexOf('\n') !== -1) {
    literal = literal.trimRight();
  }

  return literal;
}

function stringPath(path: Array<string | number>) {
  return path.reduce<string>((acc, current) => {
    if (typeof current === 'string') {
      if (acc) {
        acc += '.' + current;
      } else {
        acc += current;
      }
    } else {
      acc += '[' + current + ']';
    }

    return acc;
  }, '');
}

function createJSXTemplate(
  element:
    | t.JSXElement
    | t.JSXText
    | t.JSXFragment
    | t.JSXExpressionContainer
    | t.JSXSpreadChild,
  dataPath: Array<string | number>
): string {
  if (t.isJSXElement(element)) {
    const attributes = element.openingElement.attributes;
    let tag = (element.openingElement
      .name as t.JSXIdentifier).name.toLowerCase();

    const isExpressionBlock = tag === 'expression-block';

    if (isExpressionBlock) {
      tag = 'block';
    }

    return `<${tag} ${createAttributesTemplate(
      tag,
      stringPath(dataPath),
      attributes
    )} >
  ${element.children
    .filter(child => !isEmptyText(child))
    .map((child, cindex) =>
      createJSXTemplate(
        child,
        isExpressionBlock ? dataPath : [...dataPath, 'children', cindex]
      )
    )
    .join('')}
</${tag}>`;
  }

  if (t.isJSXExpressionContainer(element)) {
    const expressionContainer = element as t.JSXExpressionContainer;

    if (t.isLiteral(expressionContainer.expression)) {
      return `{{'${normalizeLiteral(
        (expressionContainer.expression as t.StringLiteral).value
      )}'}}`;
    }

    return `<template is="TPL" data="{{root: ${stringPath(dataPath)}}}" />`;
  }

  if (t.isJSXText(element)) {
    return `{{'${normalizeLiteral((element as t.JSXText).value)}'}}`;
  }

  return '';
}

export default function JSXTemplates() {
  return JSXElementPaths.map((path, index) => {
    const element = path.node as t.JSXElement;
    const elementID = getElementID(element);

    return {
      elementID,
      content: createJSXTemplate(element, ['node']),
    };
  });
}
