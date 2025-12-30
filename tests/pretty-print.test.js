// Test for pretty-print.js utility functions
import { describe, it, expect } from 'vitest';
import {
    prettyPrintJSON,
    prettyPrintXML,
    prettyPrintURLEncoded,
    prettyPrintJavaScript,
    extractHTTPBody,
    prettyPrintBody,
    prettyPrintHTTP,
    isMinified,
    hasJavaScriptPatterns
} from '../js/core/utils/pretty-print.js';

describe('prettyPrintJSON', () => {
    it('should format valid JSON', () => {
        const input = '{"name":"John","age":30}';
        const expected = '{\n  "name": "John",\n  "age": 30\n}';
        expect(prettyPrintJSON(input)).toBe(expected);
    });

    it('should handle JSON arrays', () => {
        const input = '[1,2,3]';
        const expected = '[\n  1,\n  2,\n  3\n]';
        expect(prettyPrintJSON(input)).toBe(expected);
    });

    it('should return original text for invalid JSON', () => {
        const input = 'not json';
        expect(prettyPrintJSON(input)).toBe(input);
    });

    it('should handle empty or null input', () => {
        expect(prettyPrintJSON('')).toBe('');
        expect(prettyPrintJSON(null)).toBe('');
    });
});

describe('prettyPrintXML', () => {
    it('should format XML with proper indentation', () => {
        const input = '<root><item>value</item></root>';
        const output = prettyPrintXML(input);
        expect(output).toContain('<root>');
        expect(output).toContain('  <item>');
    });

    it('should handle self-closing tags', () => {
        const input = '<root><item/></root>';
        const output = prettyPrintXML(input);
        expect(output).toContain('<item/>');
    });

    it('should return original for invalid XML', () => {
        const input = 'not xml';
        expect(prettyPrintXML(input)).toBe(input);
    });
});

describe('prettyPrintURLEncoded', () => {
    it('should format URL-encoded data', () => {
        const input = 'name=John&age=30&city=New%20York';
        const expected = 'name=John\nage=30\ncity=New York';
        expect(prettyPrintURLEncoded(input)).toBe(expected);
    });

    it('should handle single parameter', () => {
        const input = 'name=John';
        expect(prettyPrintURLEncoded(input)).toBe('name=John');
    });

    it('should handle parameters without values', () => {
        const input = 'flag1&flag2';
        expect(prettyPrintURLEncoded(input)).toBe('flag1\nflag2');
    });
});

describe('extractHTTPBody', () => {
    it('should extract body from HTTP request with CRLF', () => {
        const http = 'GET /path HTTP/1.1\r\nHost: example.com\r\n\r\n{"data":"value"}';
        const result = extractHTTPBody(http);
        expect(result.headers).toContain('GET /path HTTP/1.1');
        expect(result.body).toBe('{"data":"value"}');
    });

    it('should extract body from HTTP request with LF', () => {
        const http = 'GET /path HTTP/1.1\nHost: example.com\n\n{"data":"value"}';
        const result = extractHTTPBody(http);
        expect(result.body).toBe('{"data":"value"}');
    });

    it('should detect Content-Type', () => {
        const http = 'POST /api HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{"key":"value"}';
        const result = extractHTTPBody(http);
        expect(result.contentType).toBe('application/json');
    });

    it('should handle missing body', () => {
        const http = 'GET /path HTTP/1.1\r\nHost: example.com';
        const result = extractHTTPBody(http);
        expect(result.body).toBe('');
    });
});

describe('prettyPrintBody', () => {
    it('should format JSON body', () => {
        const body = '{"name":"John"}';
        const result = prettyPrintBody(body, 'application/json');
        expect(result).toContain('"name": "John"');
    });

    it('should format XML body', () => {
        const body = '<root><item>value</item></root>';
        const result = prettyPrintBody(body, 'text/xml');
        expect(result).toContain('<root>');
        expect(result).toContain('  <item>');
    });

    it('should format URL-encoded body', () => {
        const body = 'name=John&age=30';
        const result = prettyPrintBody(body, 'application/x-www-form-urlencoded');
        expect(result).toBe('name=John\nage=30');
    });

    it('should auto-detect JSON without content type', () => {
        const body = '{"name":"John"}';
        const result = prettyPrintBody(body, null);
        expect(result).toContain('"name": "John"');
    });

    it('should auto-detect XML without content type', () => {
        const body = '<root><item>value</item></root>';
        const result = prettyPrintBody(body, null);
        expect(result).toContain('<root>');
    });

    it('should return original for plain text', () => {
        const body = 'plain text content';
        const result = prettyPrintBody(body, 'text/plain');
        expect(result).toBe(body);
    });
});

describe('prettyPrintHTTP', () => {
    it('should format entire HTTP request with JSON body', () => {
        const http = 'POST /api HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{"name":"John","age":30}';
        const result = prettyPrintHTTP(http);
        expect(result).toContain('POST /api HTTP/1.1');
        expect(result).toContain('"name": "John"');
        expect(result).toContain('"age": 30');
    });

    it('should format entire HTTP response with JSON body', () => {
        const http = 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"status":"success"}';
        const result = prettyPrintHTTP(http);
        expect(result).toContain('HTTP/1.1 200 OK');
        expect(result).toContain('"status": "success"');
    });

    it('should handle HTTP without body', () => {
        const http = 'GET /path HTTP/1.1\r\nHost: example.com';
        const result = prettyPrintHTTP(http);
        expect(result).toBe(http);
    });
});

describe('isMinified', () => {
    it('should detect minified content', () => {
        const minified = 'a'.repeat(1000); // Very long single line
        expect(isMinified(minified)).toBe(true);
    });

    it('should not detect well-formatted content as minified', () => {
        const formatted = '{\n  "name": "John",\n  "age": 30\n}';
        expect(isMinified(formatted)).toBe(false);
    });

    it('should handle empty string', () => {
        expect(isMinified('')).toBe(false);
    });
});

describe('hasJavaScriptPatterns', () => {
    it('should detect function declarations', () => {
        expect(hasJavaScriptPatterns('function test() {}')).toBe(true);
    });

    it('should detect arrow functions', () => {
        expect(hasJavaScriptPatterns('const fn = () => {}')).toBe(true);
    });

    it('should detect variable declarations', () => {
        expect(hasJavaScriptPatterns('const x = 5;')).toBe(true);
        expect(hasJavaScriptPatterns('let y = 10;')).toBe(true);
        expect(hasJavaScriptPatterns('var z = 15;')).toBe(true);
    });

    it('should detect return statements', () => {
        expect(hasJavaScriptPatterns('return x;')).toBe(true);
    });

    it('should return false for non-JavaScript', () => {
        expect(hasJavaScriptPatterns('{"key": "value"}')).toBe(false);
    });
});

describe('prettyPrintJavaScript', () => {
    it('should format minified JavaScript', () => {
        const minified = 'function test(){var x=5;if(x>0){console.log("yes");}return x;}';
        const result = prettyPrintJavaScript(minified);
        expect(result).toContain('\n');
        expect(result).toContain('function');
        expect(result).toContain('console.log');
    });

    it('should add indentation to braces', () => {
        const minified = 'if(true){console.log("test");}';
        const result = prettyPrintJavaScript(minified);
        expect(result).toContain('if');
        expect(result).toContain('console.log');
    });

    it('should handle empty or null input', () => {
        expect(prettyPrintJavaScript('')).toBe('');
        expect(prettyPrintJavaScript(null)).toBe('');
    });
});
