export interface Tag {
    name: string;
    empty: boolean;
    attributes: { [key: string]: string };
}

export interface Attributes {
    [key: string]: string;
}

export interface ProcessingInstruction {
    name: string;
    text: string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Parser {
    export interface TextNode {
        type: 'text';
        text: string;
    }

    export interface XMLDeclNode {
        type: 'xmldecl';
        xmldecl: Attributes;
    }

    export interface OpenTagNode {
        type: 'opentag';
        opentag: Tag;
    }

    export interface CloseTagNode {
        type: 'closetag';
        closetag: string;
    }

    export interface CommentNode {
        type: 'comment';
        comment: string;
    }

    export interface ProcessingInstructionNode {
        type: 'processinginstruction';
        processinginstruction: ProcessingInstruction;
    }

    export interface CDataNode {
        type: 'cdata';
        cdata: string;
    }

    export type Node =
        | TextNode
        | XMLDeclNode
        | OpenTagNode
        | CloseTagNode
        | CommentNode
        | ProcessingInstructionNode
        | CDataNode;

    // eslint-disable-next-line @typescript-eslint/no-namespace
    export namespace Node {
        export type Type = Node['type'];

        export type OfType<T extends Type> = T extends 'text'
            ? TextNode
            : T extends 'xmldecl'
            ? XMLDeclNode
            : T extends 'opentag'
            ? OpenTagNode
            : T extends 'closetag'
            ? CloseTagNode
            : T extends 'comment'
            ? CommentNode
            : T extends 'processinginstruction'
            ? ProcessingInstructionNode
            : T extends 'cdata'
            ? CDataNode
            : never;
    }
}

enum Tokens {
    TagOpen = 60, // <
    TagClose = 62, // >

    Equals = 61, // =
    Dash = 45, // -

    DoubleQuote = 34, // "
    SingleQuote = 39, // '

    Slash = 47, // /
    BackSlash = 92, // \

    QuestionMark = 63, // ?
    ExclamationMark = 33, // !

    LeftSquareBracket = 91, // [
    RightSquareBracket = 93, // ]
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ParseState {
    export enum Type {
        Text,
        TagName,
        TagEmpty,
        Tag,
        TagAttributeName,
        TagAttribute,
        TagAttributeValue,
        ClosingTagName,
        ProcessingInstructionName,
        ProcessingInstruction,
        XMLDecl,
        XMLDeclAttributeName,
        XMLDeclAttribute,
        XMLDeclAttributeValue,
        XMLDeclEnd,
        CommentStart,
        Comment,
        CDataStart,
        CData,
    }

    export interface Text {
        readonly state: Type.Text;
        text: string;
    }

    export interface TagName {
        readonly state: Type.TagName;
        tagName: string;
    }

    export interface TagEmpty {
        readonly state: Type.TagEmpty;
        readonly tagName: string;
        readonly attributes: Attributes;
    }

    export interface Tag {
        readonly state: Type.Tag;
        readonly tagName: string;
        readonly attributes: Attributes;
    }

    export interface TagAttributeName {
        readonly state: Type.TagAttributeName;
        readonly tagName: string;
        readonly attributes: Attributes;
        attributeName: string;
    }

    export interface TagAttribute {
        readonly state: Type.TagAttribute;
        readonly tagName: string;
        readonly attributes: Attributes;
        readonly attributeName: string;
    }

    export interface TagAttributeValue {
        readonly state: Type.TagAttributeValue;
        readonly tagName: string;
        readonly attributes: Attributes;
        readonly attributeName: string;
        attributeValue: string;
        escaped: boolean;
        quotationMark?: number;
    }

    export interface ClosingTagName {
        readonly state: Type.ClosingTagName;
        tagName: string;
    }

    export interface ProcessingInstructionName {
        readonly state: Type.ProcessingInstructionName;
        name: string;
    }

    export interface ProcessingInstruction {
        readonly state: Type.ProcessingInstruction;
        readonly name: string;
        text: string;
        ending: boolean;
    }

    export interface XmlDecl {
        readonly state: Type.XMLDecl;
        readonly attributes: Attributes;
    }

    export interface XmlDeclAttributeName {
        readonly state: Type.XMLDeclAttributeName;
        readonly attributes: Attributes;
        attributeName: string;
    }

    export interface XmlDeclAttribute {
        readonly state: Type.XMLDeclAttribute;
        readonly attributes: Attributes;
        readonly attributeName: string;
        attributeValue: string;
    }

    export interface XmlDeclAttributeValue {
        readonly state: Type.XMLDeclAttributeValue;
        readonly attributes: Attributes;
        readonly attributeName: string;
        attributeValue: string;
        escaped: boolean;
        quotationMark?: number;
    }

    export interface XmlDeclEnd {
        readonly state: Type.XMLDeclEnd;
        readonly attributes: Attributes;
    }

    export interface CommentStart {
        readonly state: Type.CommentStart;
        dashes: number;
    }

    export interface Comment {
        readonly state: Type.Comment;
        dashes: number;
        text: string;
    }

    export interface CDataStart {
        readonly state: Type.CDataStart;
        prologue: string;
    }

    export interface CData {
        readonly state: Type.CData;
        text: string;
        brackets: number;
    }
}

type ParseState =
    | ParseState.Text
    | ParseState.TagName
    | ParseState.Tag
    | ParseState.TagEmpty
    | ParseState.TagAttributeName
    | ParseState.TagAttribute
    | ParseState.TagAttributeValue
    | ParseState.ClosingTagName
    | ParseState.ProcessingInstructionName
    | ParseState.ProcessingInstruction
    | ParseState.XmlDecl
    | ParseState.XmlDeclAttributeName
    | ParseState.XmlDeclAttribute
    | ParseState.XmlDeclAttributeValue
    | ParseState.XmlDeclEnd
    | ParseState.CommentStart
    | ParseState.Comment
    | ParseState.CDataStart
    | ParseState.CData;

function isNameStartChar(char: number): boolean {
    // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NameStartChar
    return (
        char === 58 ||
        (char >= 65 && char <= 90) ||
        char === 95 ||
        (char >= 97 && char <= 122) ||
        (char >= 0xc0 && char <= 0xd6) ||
        (char >= 0xd8 && char <= 0xf6) ||
        (char >= 0xf8 && char <= 0x2ff) ||
        (char >= 0x370 && char <= 0x37d) ||
        (char >= 0x37f && char <= 0x1fff) ||
        (char >= 0x200c && char <= 0x200d) ||
        (char >= 0x2070 && char <= 0x218f) ||
        (char >= 0x2c00 && char <= 0x2fef) ||
        (char >= 0x3001 && char <= 0xd7ff) ||
        (char >= 0xf900 && char <= 0xfdcf) ||
        (char >= 0xfdf0 && char <= 0xfffd) ||
        (char >= 0x10000 && char <= 0xeffff)
    );
}

function isNameChar(char: number): boolean {
    // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NameChar
    return (
        isNameStartChar(char) ||
        char === 45 ||
        char === 46 ||
        (char >= 48 && char <= 57) ||
        char === 0xb7 ||
        (char >= 0x300 && char <= 0x36f) ||
        (char >= 0x203f && char <= 0x2040)
    );
}

function isChar(char: number): boolean {
    // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Char
    return (
        char === 9 ||
        char === 0xa ||
        char === 0xd ||
        (char >= 0x20 && char <= 0xd7ff) ||
        (char >= 0xe000 && char <= 0xfffd) ||
        (char >= 0x10000 && char <= 0x10ffff)
    );
}

function isWhiteSpace(char: number): boolean {
    // https://www.w3.org/TR/2008/REC-xml-20081126/#NT-S
    return char === 0x20 || char === 0x9 || char === 0xd || char === 0xa;
}

function isQuotationMark(char: number): boolean {
    return char === Tokens.DoubleQuote || char === Tokens.SingleQuote;
}

function escapeChar(char: number): string {
    switch (char) {
        case 92: // /
            return '\\';

        case 110: // n
            return '\n';

        case 114: // r
            return '\r';

        default:
            throw new Error(`unexpected escape character: ${String.fromCharCode(char)} (${char})`);
    }
}

export interface ParserOptions {
    // non-strict parsing allows the following deficiencies:
    //  - unquoted or single-quote quoted attribute values
    //  - malformed comments indicators
    //  - characters outside of the valid range in attribute values and cdata
    strict?: boolean;
}

export class Parser implements IterableIterator<Parser.Node> {
    #state: ParseState = { state: ParseState.Type.Text, text: '' };
    #buffer: number[] = [];
    #closed = false;

    #strict: boolean;

    constructor(options: ParserOptions = {}) {
        this.#strict = !!options.strict;
    }

    [Symbol.iterator](): this {
        return this;
    }

    write(data: string): this {
        if (this.#closed) {
            throw new Error('parse is closed');
        }

        this.#buffer.push(...data.split('').map((c) => c.charCodeAt(0)));
        return this;
    }

    close(data?: string): this {
        if (data) {
            this.write(data);
        }

        this.#closed = true;
        return this;
    }

    next(): IteratorResult<Parser.Node> {
        // mostly following https://www.w3.org/TR/2008/REC-xml-20081126/

        let c: number | undefined;
        while (typeof (c = this.#buffer.shift()) !== 'undefined') {
            switch (this.#state.state) {
                case ParseState.Type.Text:
                    if (c === Tokens.TagOpen) {
                        let valueToReturn: Parser.Node | undefined;
                        if (this.#state.text.length > 0) {
                            valueToReturn = { type: 'text', text: this.#state.text };
                        }

                        this.#state = { state: ParseState.Type.TagName, tagName: '' };
                        if (valueToReturn) {
                            return { value: valueToReturn, done: false };
                        }
                    } else {
                        this.#state.text += String.fromCharCode(c);
                    }
                    break;

                case ParseState.Type.TagName:
                    if (this.#state.tagName.length) {
                        if (isNameChar(c)) {
                            this.#state.tagName += String.fromCharCode(c);
                        } else if (isWhiteSpace(c)) {
                            const { tagName } = this.#state;
                            this.#state = {
                                state: ParseState.Type.Tag,
                                tagName,
                                attributes: {},
                            };
                        } else if (c === Tokens.TagClose) {
                            const valueToReturn: Parser.Node = {
                                type: 'opentag',
                                opentag: {
                                    name: this.#state.tagName,
                                    attributes: {},
                                    empty: false,
                                },
                            };
                            this.#state = { state: ParseState.Type.Text, text: '' };
                            return { value: valueToReturn, done: false };
                        } else if (c === Tokens.Slash) {
                            const { tagName } = this.#state;
                            this.#state = {
                                state: ParseState.Type.TagEmpty,
                                tagName,
                                attributes: {},
                            };
                        }
                    } else {
                        if (isNameStartChar(c)) {
                            this.#state.tagName += String.fromCharCode(c);
                        } else if (c === Tokens.Slash) {
                            this.#state = { state: ParseState.Type.ClosingTagName, tagName: '' };
                        } else if (c === Tokens.QuestionMark) {
                            this.#state = { state: ParseState.Type.ProcessingInstructionName, name: '' };
                        } else if (c === Tokens.ExclamationMark) {
                            this.#state = { state: ParseState.Type.CommentStart, dashes: 0 };
                        } else {
                            throw new Error('invalid tag name starting character: ' + String.fromCharCode(c));
                        }
                    }
                    break;

                case ParseState.Type.Tag:
                    if (c === Tokens.TagClose) {
                        const valueToReturn: Parser.Node = {
                            type: 'opentag',
                            opentag: {
                                name: this.#state.tagName,
                                attributes: this.#state.attributes,
                                empty: false,
                            },
                        };

                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    } else if (isWhiteSpace(c)) {
                        // ignore
                    } else if (isNameStartChar(c)) {
                        const { tagName, attributes } = this.#state;
                        this.#state = {
                            state: ParseState.Type.TagAttributeName,
                            tagName,
                            attributes,
                            attributeName: String.fromCharCode(c),
                        };
                    } else if (c === Tokens.Slash) {
                        const { tagName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.TagEmpty,
                            tagName,
                            attributes: {},
                        };
                    } else {
                        throw new Error('invalid tag attribute name character: ' + String.fromCharCode(c));
                    }
                    break;

                case ParseState.Type.TagEmpty:
                    if (c === Tokens.TagClose) {
                        const valueToReturn: Parser.Node = {
                            type: 'opentag',
                            opentag: {
                                name: this.#state.tagName,
                                attributes: this.#state.attributes,
                                empty: true,
                            },
                        };

                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    }
                    break;

                case ParseState.Type.TagAttribute:
                    if (isWhiteSpace(c)) {
                        // ignore
                    } else if (c === Tokens.Equals) {
                        const { tagName, attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.TagAttributeValue,
                            tagName,
                            attributes,
                            attributeName,
                            attributeValue: '',
                            escaped: false,
                        };
                    }
                    break;

                case ParseState.Type.TagAttributeName:
                    if (isWhiteSpace(c)) {
                        const { tagName, attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.TagAttribute,
                            tagName,
                            attributes,
                            attributeName,
                        };
                    } else if (c === Tokens.Equals) {
                        const { tagName, attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.TagAttributeValue,
                            tagName,
                            attributes,
                            attributeName,
                            attributeValue: '',
                            escaped: false,
                        };
                    } else if (isNameChar(c)) {
                        this.#state.attributeName += String.fromCharCode(c);
                    } else {
                        throw new Error('invalid tag attribute name character: ' + String.fromCharCode(c));
                    }

                    break;

                case ParseState.Type.TagAttributeValue:
                    if (this.#state.attributeValue.length || this.#state.quotationMark) {
                        if (this.#state.escaped) {
                            this.#state.attributeValue += escapeChar(c);
                            this.#state.escaped = false;
                        } else if (c === Tokens.BackSlash && this.#state.quotationMark) {
                            this.#state.escaped = true;
                        } else if (this.#state.quotationMark ? c === this.#state.quotationMark : isWhiteSpace(c)) {
                            const { tagName, attributes, attributeName, attributeValue } = this.#state;
                            this.#state = {
                                state: ParseState.Type.Tag,
                                tagName,
                                attributes: { ...attributes, [attributeName]: attributeValue },
                            };
                        } else {
                            this.#state.attributeValue += String.fromCharCode(c);
                        }
                    } else {
                        if (isWhiteSpace(c)) {
                            // ignore
                        } else {
                            if (this.#strict ? c === Tokens.SingleQuote : isQuotationMark(c)) {
                                this.#state.quotationMark = c;
                            } else if (this.#strict) {
                                throw new Error(
                                    'invalid attribute value starting character: ' + String.fromCharCode(c),
                                );
                            } else {
                                this.#state.attributeValue += String.fromCharCode(c);
                            }
                        }
                    }
                    break;

                case ParseState.Type.ClosingTagName:
                    if (this.#state.tagName.length) {
                        if (isNameChar(c)) {
                            this.#state.tagName += String.fromCharCode(c);
                        } else if (isWhiteSpace(c)) {
                            // ignore
                        } else if (c === Tokens.TagClose) {
                            const valueToReturn: Parser.Node = { type: 'closetag', closetag: this.#state.tagName };
                            this.#state = { state: ParseState.Type.Text, text: '' };
                            return { value: valueToReturn, done: false };
                        }
                    } else {
                        if (isNameStartChar(c)) {
                            this.#state.tagName += String.fromCharCode(c);
                        } else {
                            throw new Error('invalid tag name starting character: ' + String.fromCharCode(c));
                        }
                    }
                    break;

                case ParseState.Type.ProcessingInstructionName:
                    if (isWhiteSpace(c)) {
                        if (this.#state.name.toLowerCase() === 'xml') {
                            this.#state = { state: ParseState.Type.XMLDecl, attributes: {} };
                        } else {
                            const { name } = this.#state;
                            this.#state = {
                                state: ParseState.Type.ProcessingInstruction,
                                name,
                                text: '',
                                ending: false,
                            };
                        }
                    } else {
                        this.#state.name += String.fromCharCode(c);
                    }
                    break;

                case ParseState.Type.ProcessingInstruction:
                    if (c === Tokens.QuestionMark) {
                        if (this.#state.ending) {
                            this.#state.text += '?';
                        } else {
                            this.#state.ending = true;
                        }
                    } else if (this.#state.ending && c === Tokens.TagClose) {
                        const valueToReturn: Parser.Node = {
                            type: 'processinginstruction',
                            processinginstruction: {
                                name: this.#state.name,
                                text: this.#state.text,
                            },
                        };

                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    } else if (this.#strict && !isChar(c)) {
                        throw new Error('invalid processing instruction character: ' + String.fromCharCode(c));
                    } else {
                        if (this.#state.ending) {
                            this.#state.text += '?';
                            this.#state.ending = false;
                        }

                        this.#state.text += String.fromCharCode(c);
                    }

                    break;

                case ParseState.Type.XMLDecl:
                    if (isWhiteSpace(c)) {
                        // ignore
                    } else if (c === Tokens.QuestionMark) {
                        const { attributes } = this.#state;
                        this.#state = { state: ParseState.Type.XMLDeclEnd, attributes };
                    } else if (isNameStartChar(c)) {
                        const { attributes } = this.#state;
                        this.#state = {
                            state: ParseState.Type.XMLDeclAttributeName,
                            attributes,
                            attributeName: String.fromCharCode(c),
                        };
                    } else {
                        throw new Error('invalid xml decl character: ' + String.fromCharCode(c));
                    }
                    break;

                case ParseState.Type.XMLDeclAttributeName:
                    if (isWhiteSpace(c)) {
                        const { attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.XMLDeclAttribute,
                            attributes,
                            attributeName,
                            attributeValue: '',
                        };
                    } else if (c === Tokens.Equals) {
                        const { attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.XMLDeclAttributeValue,
                            attributes,
                            attributeName,
                            attributeValue: '',
                            escaped: false,
                        };
                    } else if (isNameChar(c)) {
                        this.#state.attributeName += String.fromCharCode(c);
                    } else {
                        throw new Error('invalid xml decl attribute name character: ' + String.fromCharCode(c));
                    }
                    break;

                case ParseState.Type.XMLDeclAttribute:
                    if (isWhiteSpace(c)) {
                        // ignore
                    } else if (c === Tokens.Equals) {
                        const { attributes, attributeName } = this.#state;
                        this.#state = {
                            state: ParseState.Type.XMLDeclAttributeValue,
                            attributes,
                            attributeName,
                            attributeValue: '',
                            escaped: false,
                        };
                    }
                    break;

                case ParseState.Type.XMLDeclAttributeValue:
                    if (this.#state.attributeValue.length || this.#state.quotationMark) {
                        if (this.#state.escaped) {
                            this.#state.attributeValue += escapeChar(c);
                            this.#state.escaped = false;
                        } else if (c === Tokens.BackSlash && this.#state.quotationMark) {
                            this.#state.escaped = true;
                        } else if (this.#state.quotationMark ? c === this.#state.quotationMark : isWhiteSpace(c)) {
                            const { attributes, attributeName, attributeValue } = this.#state;
                            this.#state = {
                                state: ParseState.Type.XMLDecl,
                                attributes: { ...attributes, [attributeName]: attributeValue },
                            };
                        } else {
                            this.#state.attributeValue += String.fromCharCode(c);
                        }
                    } else {
                        if (isWhiteSpace(c)) {
                            // ignore
                        } else {
                            if (this.#strict ? c === Tokens.SingleQuote : isQuotationMark(c)) {
                                this.#state.quotationMark = c;
                            } else if (this.#strict) {
                                throw new Error(
                                    'invalid attribute value starting character: ' + String.fromCharCode(c),
                                );
                            } else {
                                this.#state.attributeValue += String.fromCharCode(c);
                            }
                        }
                    }
                    break;

                case ParseState.Type.XMLDeclEnd:
                    if (c === Tokens.TagClose) {
                        const valueToReturn: Parser.Node = { type: 'xmldecl', xmldecl: this.#state.attributes };
                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    }
                    break;

                case ParseState.Type.CommentStart:
                    if (!this.#state.dashes && c === Tokens.LeftSquareBracket) {
                        this.#state = { state: ParseState.Type.CDataStart, prologue: '' };
                    } else if (c === Tokens.Dash) {
                        this.#state.dashes += 1;
                        if (this.#state.dashes >= 2) {
                            this.#state = { state: ParseState.Type.Comment, text: '', dashes: 0 };
                        }
                    } else {
                        throw new Error('invalid comment starting character: ' + String.fromCharCode(c));
                    }
                    break;

                case ParseState.Type.Comment:
                    if (c === Tokens.Dash) {
                        if (this.#strict && !this.#state.text.length) {
                            throw new Error('invalid comment starting character: ' + String.fromCharCode(c));
                        }

                        this.#state.dashes += 1;
                    } else if (c === Tokens.TagClose && this.#state.dashes >= 2) {
                        if (this.#strict && this.#state.dashes > 2) {
                            throw new Error(
                                'malformed comment ending sequence: ' + '-'.repeat(this.#state.dashes) + '>',
                            );
                        }

                        const valueToReturn: Parser.Node = {
                            type: 'comment',
                            comment: this.#state.text + '-'.repeat(this.#state.dashes - 2),
                        };
                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    } else if (this.#strict && c === Tokens.Dash) {
                        throw new Error('invalid comment starting character: ' + String.fromCharCode(c));
                    } else if (this.#strict && !isChar(c)) {
                        throw new Error('invalid comment character: ' + String.fromCharCode(c));
                    } else {
                        if (this.#state.dashes) {
                            this.#state.text += '-'.repeat(this.#state.dashes);
                            this.#state.dashes = 0;
                        }

                        this.#state.text += String.fromCharCode(c);
                    }
                    break;

                case ParseState.Type.CDataStart:
                    this.#state.prologue += String.fromCharCode(c);
                    if (this.#state.prologue === 'CDATA[') {
                        this.#state = { state: ParseState.Type.CData, text: '', brackets: 0 };
                    } else if (!'CDATA['.startsWith(this.#state.prologue)) {
                        throw new Error('invalid cdata starting sequence: <![' + this.#state.prologue);
                    }
                    break;

                case ParseState.Type.CData:
                    if (c === Tokens.RightSquareBracket) {
                        this.#state.brackets += 1;
                    } else if (this.#state.brackets >= 2 && c === Tokens.TagClose) {
                        const valueToReturn: Parser.Node = {
                            type: 'cdata',
                            cdata: this.#state.text + ']'.repeat(this.#state.brackets - 2),
                        };
                        this.#state = { state: ParseState.Type.Text, text: '' };
                        return { value: valueToReturn, done: false };
                    } else if (this.#strict && !isChar(c)) {
                        throw new Error('invalid cdata character: ' + String.fromCharCode(c));
                    } else {
                        if (this.#state.brackets) {
                            this.#state.text += ']'.repeat(this.#state.brackets);
                            this.#state.brackets = 0;
                        }

                        this.#state.text += String.fromCharCode(c);
                    }
            }
        }

        if (this.#closed) {
            if (this.#state.state === ParseState.Type.Text) {
                if (this.#state.text.length > 0) {
                    const valueToReturn: Parser.Node = { type: 'text', text: this.#state.text };
                    this.#state = { state: ParseState.Type.Text, text: '' };
                    return { value: valueToReturn, done: false };
                }
            } else {
                console.log(this.#state);
                throw new Error('unexpected end of stream');
            }
        }

        return { done: true, value: undefined };
    }
}

export async function* parseStream(stream: ReadableStream, options?: ParserOptions): AsyncIterator<Parser.Node> {
    const r = stream.getReader();
    try {
        const decoder = new TextDecoder();
        const p = new Parser(options);
        for (;;) {
            const { done, value } = await r.read();
            if (value) {
                p.write(decoder.decode(value, { stream: true }));
                yield* p;
            }

            if (done) {
                break;
            }
        }

        p.close();
        yield* p;
    } finally {
        r.releaseLock();
    }
}

export function parse(str: string, options?: ParserOptions): IterableIterator<Parser.Node> {
    const p = new Parser(options);
    p.write(str);
    p.close();
    return p;
}
