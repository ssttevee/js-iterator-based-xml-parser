import { assertArrayIncludes, assertEquals } from 'https://deno.land/std@0.130.0/testing/asserts.ts';

import { parse, Parser } from './mod.ts';

function assertNodeType<T extends Parser.Node.Type>(node: Parser.Node, type: T): node is Parser.Node.OfType<T> {
    assertEquals(node.type, type);
    return true;
}

function assertAttributesEqual(actual: Record<string, string>, expected: Record<string, string>): void {
    assertEquals(Object.keys(actual).length, Object.keys(expected).length);
    assertArrayIncludes(Object.keys(actual), Object.keys(expected));
    for (const [key, value] of Object.entries(actual)) {
        assertEquals(value, expected[key]);
    }
}

function assertTextNode(node: Parser.Node, text: string): void {
    if (!assertNodeType(node, 'text')) {
        return;
    }

    assertEquals(node.text, text);
}

function assertCDataNode(node: Parser.Node, text: string): void {
    if (!assertNodeType(node, 'cdata')) {
        return;
    }

    assertEquals(node.cdata, text);
}

function assertProcessingInstructionNode(node: Parser.Node, name: string, text: string): void {
    if (!assertNodeType(node, 'processinginstruction')) {
        return;
    }

    assertEquals(node.processinginstruction.name, name);
    assertEquals(node.processinginstruction.text, text);
}

function assertOpenTagNode(
    node: Parser.Node,
    name: string,
    empty: boolean,
    attributes: Record<string, string> = {},
): void {
    if (!assertNodeType(node, 'opentag')) {
        return;
    }

    assertEquals(node.opentag.name, name);
    assertEquals(node.opentag.empty, empty);
    assertAttributesEqual(node.opentag.attributes, attributes);
}

function assertCloseTagNode(node: Parser.Node, name: string): void {
    if (!assertNodeType(node, 'closetag')) {
        return;
    }

    assertEquals(node.closetag, name);
}

function assertXMLDeclNode(node: Parser.Node, attributes: Record<string, string> = {}): void {
    if (!assertNodeType(node, 'xmldecl')) {
        return;
    }

    assertAttributesEqual(node.xmldecl, attributes);
}

function assertCommentNode(node: Parser.Node, text: string): void {
    if (!assertNodeType(node, 'comment')) {
        return;
    }

    assertEquals(node.comment, text);
}

function parseString(s: string): Array<Parser.Node> {
    return Array.from(parse(s));
}

Deno.test('basic xml', () => {
    const result = parseString('<root><child>hello</child></root>');
    assertEquals(result.length, 5);
    assertOpenTagNode(result[0], 'root', false);
    assertOpenTagNode(result[1], 'child', false);
    assertTextNode(result[2], 'hello');
    assertCloseTagNode(result[3], 'child');
    assertCloseTagNode(result[4], 'root');
});

Deno.test('s3 access denied payload', () => {
    const result = parseString(
        '<?xml version="1.0" encoding="UTF-8"?> <Error><Code>AccessDenied</Code><Message>Access Denied</Message><RequestId>C19A9433C8DCFE19</RequestId><HostId>ElBtABU7JVHGv1iHdWmjeVa9WFaqQaypFuBiHgN5bMNE8JL2M5y+zaFCmIrvP1CqlENrLYwpl6wJ</HostId></Error>',
    );
    assertEquals(result.length, 16);
    assertXMLDeclNode(result[0], { version: '1.0', encoding: 'UTF-8' });
    assertTextNode(result[1], ' ');
    assertOpenTagNode(result[2], 'Error', false);
    assertOpenTagNode(result[3], 'Code', false);
    assertTextNode(result[4], 'AccessDenied');
    assertCloseTagNode(result[5], 'Code');
    assertOpenTagNode(result[6], 'Message', false);
    assertTextNode(result[7], 'Access Denied');
    assertCloseTagNode(result[8], 'Message');
    assertOpenTagNode(result[9], 'RequestId', false);
    assertTextNode(result[10], 'C19A9433C8DCFE19');
    assertCloseTagNode(result[11], 'RequestId');
    assertOpenTagNode(result[12], 'HostId', false);
    assertTextNode(result[13], 'ElBtABU7JVHGv1iHdWmjeVa9WFaqQaypFuBiHgN5bMNE8JL2M5y+zaFCmIrvP1CqlENrLYwpl6wJ');
    assertCloseTagNode(result[14], 'HostId');
    assertCloseTagNode(result[15], 'Error');
});

Deno.test('comments', () => {
    const result = parseString('<!--hello--><child>hello<!-- </child></root>-->');
    assertEquals(result.length, 4);
    assertCommentNode(result[0], 'hello');
    assertOpenTagNode(result[1], 'child', false);
    assertTextNode(result[2], 'hello');
    assertCommentNode(result[3], ' </child></root>');
});

Deno.test('cdata', () => {
    const result = parseString('<root>hello<![CDATA[ world <(￣︶￣)>]]></root>');
    assertEquals(result.length, 4);
    assertOpenTagNode(result[0], 'root', false);
    assertTextNode(result[1], 'hello');
    assertCDataNode(result[2], ' world <(￣︶￣)>');
    assertCloseTagNode(result[3], 'root');
});

Deno.test('processinginstruction', () => {
    const result = parseString('<root>hello<?foo ☆:.｡.o(≧▽≦)o.｡.:☆?></root>');
    assertEquals(result.length, 4);
    assertOpenTagNode(result[0], 'root', false);
    assertTextNode(result[1], 'hello');
    assertProcessingInstructionNode(result[2], 'foo', '☆:.｡.o(≧▽≦)o.｡.:☆');
    assertCloseTagNode(result[3], 'root');
});
