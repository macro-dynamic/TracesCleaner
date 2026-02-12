/**
 * TracesCleaner — Watermark Detector & Remover
 * Handles detection, visualization, and removal of invisible Unicode characters
 * and other AI watermarking techniques.
 */

const WatermarkDetector = (() => {

    // =========================================================================
    // Invisible character registry — comprehensive list of Unicode chars used
    // for watermarking or that are invisible/format-control characters
    // =========================================================================
    const INVISIBLE_CHARS = {
        // Formatting / whitespace characters (detected but not stripped by clean)
        '\u0009': { name: 'Tab', code: 'U+0009', category: 'formatting' },
        '\u000A': { name: 'Line Feed', code: 'U+000A', category: 'formatting' },
        '\u000C': { name: 'Form Feed', code: 'U+000C', category: 'formatting' },
        '\u000D': { name: 'Carriage Return', code: 'U+000D', category: 'formatting' },

        // Zero-width & joining characters
        '\u200B': { name: 'Zero-Width Space', code: 'U+200B', category: 'zero-width' },
        '\u200C': { name: 'Zero-Width Non-Joiner', code: 'U+200C', category: 'zero-width' },
        '\u200D': { name: 'Zero-Width Joiner', code: 'U+200D', category: 'zero-width' },
        '\u200E': { name: 'Left-to-Right Mark', code: 'U+200E', category: 'direction' },
        '\u200F': { name: 'Right-to-Left Mark', code: 'U+200F', category: 'direction' },

        // General punctuation / formatting
        '\u2028': { name: 'Line Separator', code: 'U+2028', category: 'separator' },
        '\u2029': { name: 'Paragraph Separator', code: 'U+2029', category: 'separator' },
        '\u202A': { name: 'Left-to-Right Embedding', code: 'U+202A', category: 'direction' },
        '\u202B': { name: 'Right-to-Left Embedding', code: 'U+202B', category: 'direction' },
        '\u202C': { name: 'Pop Directional Formatting', code: 'U+202C', category: 'direction' },
        '\u202D': { name: 'Left-to-Right Override', code: 'U+202D', category: 'direction' },
        '\u202E': { name: 'Right-to-Left Override', code: 'U+202E', category: 'direction' },

        // Invisible math operators
        '\u2060': { name: 'Word Joiner', code: 'U+2060', category: 'joiner' },
        '\u2061': { name: 'Function Application', code: 'U+2061', category: 'math-invisible' },
        '\u2062': { name: 'Invisible Times', code: 'U+2062', category: 'math-invisible' },
        '\u2063': { name: 'Invisible Separator', code: 'U+2063', category: 'math-invisible' },
        '\u2064': { name: 'Invisible Plus', code: 'U+2064', category: 'math-invisible' },

        // Byte Order Mark
        '\uFEFF': { name: 'Byte Order Mark (BOM)', code: 'U+FEFF', category: 'bom' },

        // Soft Hyphen
        '\u00AD': { name: 'Soft Hyphen', code: 'U+00AD', category: 'format' },

        // Variation selectors (sometimes used in watermarking)
        '\uFE00': { name: 'Variation Selector-1', code: 'U+FE00', category: 'variation' },
        '\uFE01': { name: 'Variation Selector-2', code: 'U+FE01', category: 'variation' },
        '\uFE02': { name: 'Variation Selector-3', code: 'U+FE02', category: 'variation' },
        '\uFE03': { name: 'Variation Selector-4', code: 'U+FE03', category: 'variation' },
        '\uFE04': { name: 'Variation Selector-5', code: 'U+FE04', category: 'variation' },
        '\uFE05': { name: 'Variation Selector-6', code: 'U+FE05', category: 'variation' },
        '\uFE06': { name: 'Variation Selector-7', code: 'U+FE06', category: 'variation' },
        '\uFE07': { name: 'Variation Selector-8', code: 'U+FE07', category: 'variation' },
        '\uFE08': { name: 'Variation Selector-9', code: 'U+FE08', category: 'variation' },
        '\uFE09': { name: 'Variation Selector-10', code: 'U+FE09', category: 'variation' },
        '\uFE0A': { name: 'Variation Selector-11', code: 'U+FE0A', category: 'variation' },
        '\uFE0B': { name: 'Variation Selector-12', code: 'U+FE0B', category: 'variation' },
        '\uFE0C': { name: 'Variation Selector-13', code: 'U+FE0C', category: 'variation' },
        '\uFE0D': { name: 'Variation Selector-14', code: 'U+FE0D', category: 'variation' },
        '\uFE0E': { name: 'Variation Selector-15', code: 'U+FE0E', category: 'variation' },
        '\uFE0F': { name: 'Variation Selector-16', code: 'U+FE0F', category: 'variation' },

        // Interlinear annotation anchors (rare but used)
        '\uFFF9': { name: 'Interlinear Annotation Anchor', code: 'U+FFF9', category: 'annotation' },
        '\uFFFA': { name: 'Interlinear Annotation Separator', code: 'U+FFFA', category: 'annotation' },
        '\uFFFB': { name: 'Interlinear Annotation Terminator', code: 'U+FFFB', category: 'annotation' },

        // Tag characters (U+E0001-U+E007F) — used in some advanced watermarking
        // We handle these via regex range since they're in supplementary plane

        // Arabic & other script format characters
        '\u061C': { name: 'Arabic Letter Mark', code: 'U+061C', category: 'direction' },
        '\u2066': { name: 'Left-to-Right Isolate', code: 'U+2066', category: 'direction' },
        '\u2067': { name: 'Right-to-Left Isolate', code: 'U+2067', category: 'direction' },
        '\u2068': { name: 'First Strong Isolate', code: 'U+2068', category: 'direction' },
        '\u2069': { name: 'Pop Directional Isolate', code: 'U+2069', category: 'direction' },

        // Mongolian vowel separator
        '\u180E': { name: 'Mongolian Vowel Separator', code: 'U+180E', category: 'format' },

        // Hangul filler characters
        '\u115F': { name: 'Hangul Choseong Filler', code: 'U+115F', category: 'filler' },
        '\u1160': { name: 'Hangul Jungseong Filler', code: 'U+1160', category: 'filler' },
        '\u3164': { name: 'Hangul Filler', code: 'U+3164', category: 'filler' },
        '\uFFA0': { name: 'Halfwidth Hangul Filler', code: 'U+FFA0', category: 'filler' },

        // Object Replacement Character (sometimes left by copy-paste from AI UIs)
        '\uFFFC': { name: 'Object Replacement Character', code: 'U+FFFC', category: 'format' },

        // Replacement Character (indicates encoding issues)
        '\uFFFD': { name: 'Replacement Character', code: 'U+FFFD', category: 'format' },

        // Non-breaking hyphen
        '\u2011': { name: 'Non-Breaking Hyphen', code: 'U+2011', category: 'format' },

        // Narrow / ideographic spaces often injected by AI tools
        '\u200A': { name: 'Hair Space', code: 'U+200A', category: 'space' },
        '\u2009': { name: 'Thin Space', code: 'U+2009', category: 'space' },
        '\u2008': { name: 'Punctuation Space', code: 'U+2008', category: 'space' },
        '\u2007': { name: 'Figure Space', code: 'U+2007', category: 'space' },
        '\u2006': { name: 'Six-Per-Em Space', code: 'U+2006', category: 'space' },
        '\u2005': { name: 'Four-Per-Em Space', code: 'U+2005', category: 'space' },
        '\u2004': { name: 'Three-Per-Em Space', code: 'U+2004', category: 'space' },
        '\u2003': { name: 'Em Space', code: 'U+2003', category: 'space' },
        '\u2002': { name: 'En Space', code: 'U+2002', category: 'space' },
        '\u2001': { name: 'Em Quad', code: 'U+2001', category: 'space' },
        '\u2000': { name: 'En Quad', code: 'U+2000', category: 'space' },
        '\u00A0': { name: 'Non-Breaking Space', code: 'U+00A0', category: 'space' },
        '\u205F': { name: 'Medium Mathematical Space', code: 'U+205F', category: 'space' },
        '\u3000': { name: 'Ideographic Space', code: 'U+3000', category: 'space' },
    };

    // Build a regex that matches any invisible character in our map
    // plus broad Unicode category Cf characters — EXCLUDING formatting (tab, LF, CR)
    const STRIPPABLE_CHARS = Object.entries(INVISIBLE_CHARS)
        .filter(([, v]) => v.category !== 'formatting')
        .map(([k]) => k);

    const INVISIBLE_REGEX = new RegExp(
        '[' +
        STRIPPABLE_CHARS.join('') +
        '\\u0000-\\u0008' +    // C0 controls (except tab, newline, CR)
        '\\u000B' +             // vertical tab
        '\\u000E-\\u001F' +     // more C0 controls
        '\\u007F' +             // DEL
        '\\u0080-\\u009F' +     // C1 controls
        ']',
        'g'
    );

    // Supplementary plane: Tag characters (U+E0001-U+E007F) — advanced watermarking
    // and Variation Selectors Supplement (U+E0100-U+E01EF)
    const SUPPLEMENTARY_REGEX = /[\uDB40][\uDC01-\uDC7F]|[\uDB40][\uDD00-\uDDEF]/g;

    // =========================================================================
    // Common homoglyph map: visually similar Unicode → ASCII
    // =========================================================================
    const HOMOGLYPHS = {
        '\u0410': 'A', // Cyrillic А → Latin A
        '\u0412': 'B', // Cyrillic В → Latin B
        '\u0421': 'C', // Cyrillic С → Latin C
        '\u0415': 'E', // Cyrillic Е → Latin E
        '\u041D': 'H', // Cyrillic Н → Latin H
        '\u041A': 'K', // Cyrillic К → Latin K
        '\u041C': 'M', // Cyrillic М → Latin M
        '\u041E': 'O', // Cyrillic О → Latin O
        '\u0420': 'P', // Cyrillic Р → Latin P
        '\u0422': 'T', // Cyrillic Т → Latin T
        '\u0425': 'X', // Cyrillic Х → Latin X
        '\u0430': 'a', // Cyrillic а → Latin a
        '\u0435': 'e', // Cyrillic е → Latin e
        '\u043E': 'o', // Cyrillic о → Latin o
        '\u0440': 'p', // Cyrillic р → Latin p
        '\u0441': 'c', // Cyrillic с → Latin c
        '\u0443': 'y', // Cyrillic у → Latin y
        '\u0445': 'x', // Cyrillic х → Latin x
        '\u0456': 'i', // Cyrillic і → Latin i
        '\u0458': 'j', // Cyrillic ј → Latin j
        '\u04BB': 'h', // Cyrillic һ → Latin h
        '\u0501': 'd', // Cyrillic ԁ → Latin d

        // Greek look-alikes
        '\u0391': 'A', // Greek Α → Latin A
        '\u0392': 'B', // Greek Β → Latin B
        '\u0395': 'E', // Greek Ε → Latin E
        '\u0396': 'Z', // Greek Ζ → Latin Z
        '\u0397': 'H', // Greek Η → Latin H
        '\u0399': 'I', // Greek Ι → Latin I
        '\u039A': 'K', // Greek Κ → Latin K
        '\u039C': 'M', // Greek Μ → Latin M
        '\u039D': 'N', // Greek Ν → Latin N
        '\u039F': 'O', // Greek Ο → Latin O
        '\u03A1': 'P', // Greek Ρ → Latin P
        '\u03A4': 'T', // Greek Τ → Latin T
        '\u03A5': 'Y', // Greek Υ → Latin Y
        '\u03A7': 'X', // Greek Χ → Latin X
        '\u03BF': 'o', // Greek ο → Latin o

        // Fullwidth Latin letters
        '\uFF21': 'A', '\uFF22': 'B', '\uFF23': 'C', '\uFF24': 'D', '\uFF25': 'E',
        '\uFF26': 'F', '\uFF27': 'G', '\uFF28': 'H', '\uFF29': 'I', '\uFF2A': 'J',
        '\uFF2B': 'K', '\uFF2C': 'L', '\uFF2D': 'M', '\uFF2E': 'N', '\uFF2F': 'O',
        '\uFF30': 'P', '\uFF31': 'Q', '\uFF32': 'R', '\uFF33': 'S', '\uFF34': 'T',
        '\uFF35': 'U', '\uFF36': 'V', '\uFF37': 'W', '\uFF38': 'X', '\uFF39': 'Y',
        '\uFF3A': 'Z',
        '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd', '\uFF45': 'e',
        '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h', '\uFF49': 'i', '\uFF4A': 'j',
        '\uFF4B': 'k', '\uFF4C': 'l', '\uFF4D': 'm', '\uFF4E': 'n', '\uFF4F': 'o',
        '\uFF50': 'p', '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's', '\uFF54': 't',
        '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x', '\uFF59': 'y',
        '\uFF5A': 'z',

        // Common look-alikes
        '\u2010': '-', // Hyphen
        '\u2011': '-', // Non-breaking hyphen
        '\u2012': '-', // Figure dash
        '\u2013': '-', // En dash
        '\u2014': '-', // Em dash
        '\u2018': "'", // Left single quote
        '\u2019': "'", // Right single quote
        '\u201C': '"', // Left double quote
        '\u201D': '"', // Right double quote
        '\u2032': "'", // Prime
        '\u2033': '"', // Double prime
        '\u00A0': ' ', // Non-breaking space → normal space
        '\u2000': ' ', '\u2001': ' ', '\u2002': ' ', '\u2003': ' ', '\u2004': ' ',
        '\u2005': ' ', '\u2006': ' ', '\u2007': ' ', '\u2008': ' ', '\u2009': ' ',
        '\u200A': ' ', '\u205F': ' ', '\u3000': ' ', // Various space chars
    };

    const HOMOGLYPH_REGEX = new RegExp('[' + Object.keys(HOMOGLYPHS).join('') + ']', 'g');

    // Categories that are "formatting" — detected/shown but NOT stripped by clean()
    const FORMATTING_CATEGORIES = new Set(['formatting']);

    // Categories that are unusual spaces — detected and optionally stripped
    const SPACE_CATEGORIES = new Set(['space']);

    // =========================================================================
    // AI-Specific Watermark Patterns
    // Maps known AI providers to the watermark techniques they use
    // =========================================================================
    const AI_WATERMARK_INFO = {
        'ChatGPT / OpenAI': {
            icon: '🟢',
            techniques: ['Zero-width characters', 'Variation selectors', 'BOM insertion', 'Statistical (research)'],
            effectiveness: 'full',
            note: 'OpenAI API & ChatGPT web UI may insert zero-width spaces, variation selectors, and BOMs. All removed by TracesCleaner.',
        },
        'Claude / Anthropic': {
            icon: '🟠',
            techniques: ['Minimal invisible chars', 'No known statistical watermark'],
            effectiveness: 'full',
            note: 'Claude outputs are generally clean. Any invisible characters from copy-paste artifacts are removed.',
        },
        'Gemini / Google': {
            icon: '🔵',
            techniques: ['SynthID (statistical)', 'Possible invisible chars via web UI'],
            effectiveness: 'partial',
            note: 'Invisible chars are fully removed. SynthID statistical watermarks require text paraphrasing.',
        },
        'Copilot / Microsoft': {
            icon: '🟣',
            techniques: ['Uses OpenAI models', 'Web UI copy-paste artifacts'],
            effectiveness: 'full',
            note: 'Inherits OpenAI watermarking. All invisible character patterns are detected and removed.',
        },
        'DeepSeek': {
            icon: '🔴',
            techniques: ['Zero-width characters', 'Web UI artifacts'],
            effectiveness: 'full',
            note: 'DeepSeek web interface may add formatting artifacts. All invisible characters are stripped.',
        },
        'LLaMA / Meta': {
            icon: '🦙',
            techniques: ['Open source — no built-in watermark', 'Host-dependent'],
            effectiveness: 'full',
            note: 'No built-in watermarking in LLaMA. Hosting platforms may add their own — all invisible chars are removed.',
        },
        'Grok / xAI': {
            icon: '⚡',
            techniques: ['Web UI artifacts', 'Possible invisible chars'],
            effectiveness: 'full',
            note: 'Any invisible characters from Grok\'s interface are detected and removed.',
        },
        'Mistral / Mixtral': {
            icon: '🌊',
            techniques: ['Open source — no built-in watermark', 'Host-dependent'],
            effectiveness: 'full',
            note: 'No built-in watermarking. Hosting platforms may add artifacts — all are removed.',
        },
        'Perplexity': {
            icon: '🔍',
            techniques: ['Web UI copy artifacts', 'Underlying model watermarks'],
            effectiveness: 'full',
            note: 'Any copy-paste artifacts or underlying model watermarks (invisible chars) are stripped.',
        },
    };

    // =========================================================================
    // Core API
    // =========================================================================

    /**
     * Detect invisible/hidden characters in text.
     * @param {string} text - Input text
     * @param {{ includeFormatting?: boolean }} options
     *   includeFormatting: if true, also count newlines/tabs/CR (like CleanPaste does)
     * @returns {{ total: number, chars: Map<string, { info: object, count: number, positions: number[] }> }}
     */
    function detect(text, options = {}) {
        const includeFormatting = options.includeFormatting || false;
        const chars = new Map();
        let total = 0;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const info = INVISIBLE_CHARS[ch];

            if (info) {
                // Skip formatting chars unless includeFormatting is set
                if (!includeFormatting && FORMATTING_CATEGORIES.has(info.category)) {
                    continue;
                }
                total++;
                if (!chars.has(ch)) {
                    chars.set(ch, { info, count: 0, positions: [] });
                }
                const entry = chars.get(ch);
                entry.count++;
                entry.positions.push(i);
            } else {
                // Check for C0/C1 controls not in our map
                const code = ch.charCodeAt(0);
                if (
                    (code >= 0 && code <= 8) ||
                    code === 0x0B ||
                    (code >= 0x0E && code <= 0x1F) ||
                    code === 0x7F ||
                    (code >= 0x80 && code <= 0x9F)
                ) {
                    total++;
                    const hex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
                    const controlInfo = { name: `Control Character`, code: hex, category: 'control' };
                    if (!chars.has(ch)) {
                        chars.set(ch, { info: controlInfo, count: 0, positions: [] });
                    }
                    const entry = chars.get(ch);
                    entry.count++;
                    entry.positions.push(i);
                }
            }
        }

        return { total, chars };
    }

    /**
     * Detect homoglyph substitutions
     * @param {string} text
     * @returns {{ total: number, chars: Map<string, { original: string, replacement: string, count: number }> }}
     */
    function detectHomoglyphs(text) {
        const chars = new Map();
        let total = 0;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const replacement = HOMOGLYPHS[ch];
            if (replacement && !isExpectedChar(text, i, ch)) {
                total++;
                if (!chars.has(ch)) {
                    const code = 'U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                    chars.set(ch, { original: ch, code, replacement, count: 0 });
                }
                chars.get(ch).count++;
            }
        }

        return { total, chars };
    }

    /**
     * Check if a character might be expected in context (very simple heuristic):
     * Non-breaking spaces and special dashes/quotes are common in copy-pasted text
     * so only flag them if there's a pattern suggesting watermarking
     */
    function isExpectedChar(text, index, ch) {
        // Non-breaking space and typographic quotes are common in normal text,
        // don't flag them as homoglyphs
        const code = ch.charCodeAt(0);
        if (code === 0x00A0 || code === 0x2018 || code === 0x2019 ||
            code === 0x201C || code === 0x201D || code === 0x2013 || code === 0x2014) {
            return true;
        }
        return false;
    }

    /**
     * Remove all invisible characters from text
     * @param {string} text
     * @param {{ normalize?: boolean, fixHomoglyphs?: boolean, stripSpaces?: boolean, stripHTML?: boolean }} options
     * @returns {string}
     */
    function clean(text, options = {}) {
        let result = text;

        // Strip HTML tags (from copy-paste from web AI interfaces)
        if (options.stripHTML) {
            result = result.replace(/<[^>]*>/g, '');
            // Decode common HTML entities
            result = result.replace(/&nbsp;/gi, ' ');
            result = result.replace(/&amp;/gi, '&');
            result = result.replace(/&lt;/gi, '<');
            result = result.replace(/&gt;/gi, '>');
            result = result.replace(/&quot;/gi, '"');
            result = result.replace(/&#39;/gi, "'");
        }

        // Remove invisible characters (not formatting like newlines)
        result = result.replace(INVISIBLE_REGEX, '');

        // Remove supplementary plane invisible characters (tags, extra variation selectors)
        result = result.replace(SUPPLEMENTARY_REGEX, '');

        // Normalize Unicode
        if (options.normalize !== false) {
            result = result.normalize('NFC');
        }

        // Fix homoglyphs
        if (options.fixHomoglyphs) {
            result = result.replace(HOMOGLYPH_REGEX, (ch) => {
                if (isExpectedChar(result, 0, ch)) return ch;
                return HOMOGLYPHS[ch] || ch;
            });
        }

        // Clean up whitespace anomalies
        // - Remove trailing spaces on each line
        result = result.replace(/[ \t]+$/gm, '');
        // - Collapse multiple spaces into one (but not newlines)
        result = result.replace(/ {2,}/g, ' ');

        return result;
    }

    /**
     * Detect whitespace anomalies that could indicate watermarking
     * @param {string} text
     * @returns {{ total: number, issues: Array<{ type: string, count: number, description: string }> }}
     */
    function detectWhitespaceAnomalies(text) {
        const issues = [];
        let total = 0;

        // Trailing spaces
        const trailingMatches = text.match(/[ \t]+$/gm);
        if (trailingMatches) {
            const count = trailingMatches.length;
            total += count;
            issues.push({ type: 'trailing-space', count, description: 'Trailing spaces on lines' });
        }

        // Double spaces (not at line start = not indentation)
        const doubleSpaceMatches = text.match(/(?<=\S) {2,}(?=\S)/g);
        if (doubleSpaceMatches) {
            const count = doubleSpaceMatches.length;
            total += count;
            issues.push({ type: 'double-space', count, description: 'Multiple consecutive spaces' });
        }

        // Mixed line endings (CRLF and LF)
        const hasCRLF = text.includes('\r\n');
        const hasLF = /(?<!\r)\n/.test(text);
        if (hasCRLF && hasLF) {
            total += 1;
            issues.push({ type: 'mixed-endings', count: 1, description: 'Mixed line endings (CRLF + LF)' });
        }

        // Non-standard spaces
        const spaceChars = Object.entries(INVISIBLE_CHARS).filter(([, v]) => v.category === 'space');
        for (const [ch, info] of spaceChars) {
            const regex = new RegExp(ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = text.match(regex);
            if (matches) {
                total += matches.length;
                issues.push({ type: 'special-space', count: matches.length, description: `${info.name} (${info.code})` });
            }
        }

        return { total, issues };
    }

    /**
     * Build annotated HTML showing hidden characters inline.
     * @param {string} text
     * @param {{ includeFormatting?: boolean }} options  — if true, also annotate newlines/tabs
     * @returns {string} HTML string
     */
    function revealHTML(text, options = {}) {
        const includeFormatting = options.includeFormatting !== false; // default true for reveal
        const parts = [];
        let visibleBuffer = '';

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const info = INVISIBLE_CHARS[ch];
            const code = ch.charCodeAt(0);
            const isControl = (
                (code >= 0 && code <= 8) ||
                code === 0x0B ||
                (code >= 0x0E && code <= 0x1F) ||
                code === 0x7F ||
                (code >= 0x80 && code <= 0x9F)
            );

            // Decide if this char should be annotated
            let shouldAnnotate = false;
            if (info) {
                if (FORMATTING_CATEGORIES.has(info.category)) {
                    shouldAnnotate = includeFormatting;
                } else {
                    shouldAnnotate = true;
                }
            } else if (isControl) {
                shouldAnnotate = true;
            }

            if (shouldAnnotate) {
                // Flush visible buffer
                if (visibleBuffer) {
                    parts.push(`<span class="char-visible">${escapeHTML(visibleBuffer)}</span>`);
                    visibleBuffer = '';
                }
                const label = info ? info.code : ('U+' + code.toString(16).toUpperCase().padStart(4, '0'));
                const charName = info ? info.name : 'Control Character';
                const cssClass = (info && FORMATTING_CATEGORIES.has(info.category)) ? 'char-formatting' : 'char-hidden';
                parts.push(`<span class="${cssClass}" title="${charName} (${label})">[${label}]</span>`);
            } else {
                visibleBuffer += ch;
            }
        }

        if (visibleBuffer) {
            parts.push(`<span class="char-visible">${escapeHTML(visibleBuffer)}</span>`);
        }

        return parts.join('');
    }

    /**
     * Inject invisible watermark characters into text (for demo purposes)
     * @param {string} text
     * @param {{ zwsp?: boolean, zwnj?: boolean, bom?: boolean, invisSep?: boolean }} types
     * @returns {{ text: string, count: number }}
     */
    function inject(text, types = {}) {
        const chars = [];
        if (types.zwsp) chars.push('\u200B');
        if (types.zwnj) chars.push('\u200C');
        if (types.bom) chars.push('\uFEFF');
        if (types.invisSep) chars.push('\u2061', '\u2062', '\u2063', '\u2064');

        if (chars.length === 0) {
            return { text, count: 0 };
        }

        let result = '';
        let count = 0;
        const words = text.split(/(\s+)/);

        for (let i = 0; i < words.length; i++) {
            result += words[i];
            // Insert between words with ~60% probability, and sometimes within words
            if (i < words.length - 1 && Math.random() < 0.6) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                result += char;
                count++;
            }
            // Occasionally insert within longer words
            if (words[i].length > 4 && Math.random() < 0.3) {
                const pos = Math.floor(Math.random() * (words[i].length - 2)) + 1;
                const char = chars[Math.floor(Math.random() * chars.length)];
                result = result.slice(0, result.length - words[i].length + pos) +
                    char +
                    result.slice(result.length - words[i].length + pos);
                count++;
            }
        }

        return { text: result, count };
    }

    /**
     * Escape HTML special characters
     */
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Get info for an invisible character
     */
    function getCharInfo(ch) {
        return INVISIBLE_CHARS[ch] || null;
    }

    // Public API
    return {
        detect,
        detectHomoglyphs,
        detectWhitespaceAnomalies,
        clean,
        revealHTML,
        inject,
        getCharInfo,
        INVISIBLE_CHARS,
        HOMOGLYPHS,
        AI_WATERMARK_INFO,
    };

})();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.WatermarkDetector = WatermarkDetector;
}
