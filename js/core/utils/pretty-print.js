// Pretty Print utilities for request and response bodies

/**
 * Pretty print JSON string with proper indentation
 * @param {string} text - JSON string to format
 * @returns {string} Formatted JSON or original text if not valid JSON
 */
export function prettyPrintJSON(text) {
    if (!text || typeof text !== 'string') {
        return text || '';
    }

    try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return text;
    }
}

/**
 * Pretty print XML string with proper indentation
 * @param {string} xml - XML string to format
 * @returns {string} Formatted XML or original text if not valid XML
 */
export function prettyPrintXML(xml) {
    if (!xml || typeof xml !== 'string') {
        return xml || '';
    }

    try {
        // Remove existing formatting
        let formatted = xml.replace(/(>)\s*(<)/g, '$1$2');
        
        // Add newlines and indentation
        let indent = 0;
        const tab = '  '; // 2 spaces
        
        formatted = formatted.replace(/(<\w[^>]*[^\/]>|<\/\w[^>]*>)/g, (match) => {
            // Closing tag - decrease indent first
            if (match.startsWith('</')) {
                indent--;
                return '\n' + tab.repeat(Math.max(0, indent)) + match;
            }
            // Opening tag - add newline and indent, then increase
            const result = '\n' + tab.repeat(indent) + match;
            indent++;
            return result;
        });
        
        // Handle self-closing tags
        formatted = formatted.replace(/(<\w[^>]*\/>)/g, (match) => {
            return '\n' + tab.repeat(indent) + match;
        });
        
        return formatted.trim();
    } catch (e) {
        return xml;
    }
}

/**
 * Pretty print URL-encoded form data
 * @param {string} text - URL-encoded string
 * @returns {string} Formatted parameters (one per line) or original text
 */
export function prettyPrintURLEncoded(text) {
    if (!text || typeof text !== 'string') {
        return text || '';
    }

    try {
        // Split by & and decode each parameter
        const params = text.split('&');
        const formatted = params.map(param => {
            const [key, value] = param.split('=');
            if (value !== undefined) {
                return `${decodeURIComponent(key)}=${decodeURIComponent(value)}`;
            }
            return decodeURIComponent(key);
        }).join('\n');
        
        return formatted;
    } catch (e) {
        return text;
    }
}

/**
 * Extract body from raw HTTP request/response
 * @param {string} rawHTTP - Raw HTTP request or response
 * @returns {Object} { headers: string, body: string, contentType: string|null }
 */
export function extractHTTPBody(rawHTTP) {
    if (!rawHTTP || typeof rawHTTP !== 'string') {
        return { headers: '', body: '', contentType: null };
    }

    // Find the separator between headers and body (empty line)
    let separatorIndex = rawHTTP.indexOf('\r\n\r\n');
    let lineBreak = '\r\n';
    
    if (separatorIndex === -1) {
        separatorIndex = rawHTTP.indexOf('\n\n');
        lineBreak = '\n';
    }

    if (separatorIndex === -1) {
        // No body found
        return { headers: rawHTTP, body: '', contentType: null };
    }

    const headers = rawHTTP.substring(0, separatorIndex);
    const body = rawHTTP.substring(separatorIndex + lineBreak.length * 2);

    // Extract Content-Type header
    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n;]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : null;

    return { headers, body, contentType };
}

/**
 * Pretty print HTTP body based on content type
 * @param {string} body - Body content to format
 * @param {string|null} contentType - Content-Type header value
 * @returns {string} Formatted body
 */
export function prettyPrintBody(body, contentType) {
    if (!body) {
        return '';
    }

    // Try JSON first (most common)
    if (!contentType || contentType.includes('json')) {
        const formatted = prettyPrintJSON(body);
        if (formatted !== body) {
            return formatted;
        }
    }

    // Try XML
    if (contentType && (contentType.includes('xml') || contentType.includes('html'))) {
        // Check if it looks like XML/HTML
        if (body.trim().startsWith('<')) {
            return prettyPrintXML(body);
        }
    }

    // Try URL-encoded
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
        return prettyPrintURLEncoded(body);
    }

    // Try to auto-detect JSON even without content type
    if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
        const formatted = prettyPrintJSON(body);
        if (formatted !== body) {
            return formatted;
        }
    }

    // Try to auto-detect XML
    if (body.trim().startsWith('<')) {
        return prettyPrintXML(body);
    }

    // Try to detect URL-encoded (contains & and =)
    if (body.includes('=') && body.includes('&') && !body.includes('\n')) {
        return prettyPrintURLEncoded(body);
    }

    // Return as-is if no formatting applied
    return body;
}

/**
 * Pretty print entire HTTP request/response
 * @param {string} rawHTTP - Raw HTTP request or response
 * @returns {string} Pretty printed HTTP with formatted body
 */
export function prettyPrintHTTP(rawHTTP) {
    if (!rawHTTP || typeof rawHTTP !== 'string') {
        return rawHTTP || '';
    }

    const { headers, body, contentType } = extractHTTPBody(rawHTTP);

    if (!body) {
        return rawHTTP;
    }

    const prettyBody = prettyPrintBody(body, contentType);

    // Reconstruct with pretty body
    const lineBreak = rawHTTP.includes('\r\n') ? '\r\n' : '\n';
    return headers + lineBreak + lineBreak + prettyBody;
}

/**
 * Check if text appears to be minified (heuristic)
 * @param {string} text - Text to check
 * @returns {boolean} True if text appears minified
 */
export function isMinified(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    // Heuristics for minified content:
    // 1. Long lines (average > 200 chars)
    // 2. Very few line breaks relative to length
    // 3. High density of special characters
    
    const lines = text.split('\n');
    const avgLineLength = text.length / lines.length;
    
    // If average line length > 200 and less than 10 lines for every 1000 chars
    return avgLineLength > 200 && (lines.length / text.length) < 0.01;
}
