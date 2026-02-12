/**
 * TracesCleaner — Main Application Logic
 * Wires up the UI to the WatermarkDetector engine
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // Tab switching
    // =========================================================================
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });

    // =========================================================================
    // Clean Tab
    // =========================================================================
    const inputClean = document.getElementById('input-clean');
    const btnClean = document.getElementById('btn-clean');
    const resultsClean = document.getElementById('results-clean');
    const outputClean = document.getElementById('output-clean');
    const badgeInvisible = document.getElementById('badge-invisible');
    const badgeHomoglyphs = document.getElementById('badge-homoglyphs');
    const badgeCleanEl = document.getElementById('badge-clean');
    const detectionDetails = document.getElementById('detection-details');
    const detectionList = document.getElementById('detection-list');
    const btnCopy = document.getElementById('btn-copy');
    const copyStatus = document.getElementById('copy-status');
    const optInvisible = document.getElementById('opt-invisible');
    const optNormalize = document.getElementById('opt-normalize');
    const optHomoglyphs = document.getElementById('opt-homoglyphs');
    const liveCount = document.getElementById('live-count');
    const annotatedResult = document.getElementById('annotated-result');
    const annotatedText = document.getElementById('annotated-text');
    const annotatedCount = document.getElementById('annotated-count');
    const btnCopyClean = document.getElementById('btn-copy-clean');
    const badgeWhitespace = document.getElementById('badge-whitespace');
    const optStripHTML = document.getElementById('opt-strip-html');

    // Live detection on input/paste — counts ALL hidden chars including newlines
    function updateLiveCount() {
        const text = inputClean.value;
        if (!text) {
            liveCount.classList.add('hidden');
            return;
        }
        const result = WatermarkDetector.detect(text, { includeFormatting: true });
        if (result.total > 0) {
            liveCount.textContent = `${result.total} hidden characters found`;
            liveCount.classList.remove('hidden', 'is-clean');
        } else {
            liveCount.textContent = '✓ No hidden characters';
            liveCount.classList.remove('hidden');
            liveCount.classList.add('is-clean');
        }
    }

    inputClean.addEventListener('input', updateLiveCount);
    inputClean.addEventListener('paste', () => setTimeout(updateLiveCount, 50));

    btnClean.addEventListener('click', () => {
        const text = inputClean.value;
        if (!text.trim()) return;

        // Detect — full detection (with formatting chars like newlines)
        const fullResult = WatermarkDetector.detect(text, { includeFormatting: true });
        // Detect — watermark-only (without formatting chars)
        const invisResult = WatermarkDetector.detect(text, { includeFormatting: false });
        const homoResult = WatermarkDetector.detectHomoglyphs(text);
        const wsResult = WatermarkDetector.detectWhitespaceAnomalies(text);

        // Clean (only strips actual watermark chars, not newlines)
        const cleaned = WatermarkDetector.clean(text, {
            normalize: optNormalize.checked,
            fixHomoglyphs: optHomoglyphs.checked,
            stripHTML: optStripHTML.checked,
        });

        // Show results
        resultsClean.classList.remove('hidden');
        outputClean.value = cleaned;

        // Show annotated view with ALL hidden chars (like CleanPaste)
        annotatedResult.classList.remove('hidden');
        annotatedText.innerHTML = WatermarkDetector.revealHTML(text, { includeFormatting: true });
        annotatedCount.textContent = `${fullResult.total} hidden characters found`;
        annotatedCount.className = fullResult.total > 0 ? 'badge badge-danger' : 'badge badge-success';

        // Update badges
        if (invisResult.total > 0) {
            badgeInvisible.classList.remove('hidden');
            badgeInvisible.querySelector('.badge-count').textContent = invisResult.total;
        } else {
            badgeInvisible.classList.add('hidden');
        }

        if (homoResult.total > 0) {
            badgeHomoglyphs.classList.remove('hidden');
            badgeHomoglyphs.querySelector('.badge-count').textContent = homoResult.total;
        } else {
            badgeHomoglyphs.classList.add('hidden');
        }

        if (wsResult.total > 0) {
            badgeWhitespace.classList.remove('hidden');
            badgeWhitespace.querySelector('.badge-count').textContent = wsResult.total;
        } else {
            badgeWhitespace.classList.add('hidden');
        }

        if (invisResult.total === 0 && homoResult.total === 0 && wsResult.total === 0) {
            badgeCleanEl.classList.remove('hidden');
        } else {
            badgeCleanEl.classList.add('hidden');
        }

        // Detection details
        if (invisResult.total > 0 || homoResult.total > 0 || wsResult.total > 0) {
            detectionDetails.classList.remove('hidden');
            detectionList.innerHTML = '';

            // Invisible chars
            invisResult.chars.forEach((entry, ch) => {
                const el = document.createElement('div');
                el.className = 'detection-item';
                el.innerHTML = `
                    <div class="detection-item-name">
                        <span>🔴</span>
                        <span>${entry.info.name}</span>
                        <span class="detection-item-code">${entry.info.code}</span>
                    </div>
                    <span class="detection-item-count">×${entry.count}</span>
                `;
                detectionList.appendChild(el);
            });

            // Homoglyphs
            homoResult.chars.forEach((entry, ch) => {
                const el = document.createElement('div');
                el.className = 'detection-item';
                el.innerHTML = `
                    <div class="detection-item-name">
                        <span>🟡</span>
                        <span>Homoglyph: "${ch}" → "${entry.replacement}"</span>
                        <span class="detection-item-code">${entry.code}</span>
                    </div>
                    <span class="detection-item-count">×${entry.count}</span>
                `;
                detectionList.appendChild(el);
            });

            // Whitespace anomalies
            wsResult.issues.forEach((issue) => {
                const el = document.createElement('div');
                el.className = 'detection-item';
                el.innerHTML = `
                    <div class="detection-item-name">
                        <span>🔵</span>
                        <span>${issue.description}</span>
                    </div>
                    <span class="detection-item-count">×${issue.count}</span>
                `;
                detectionList.appendChild(el);
            });
        } else {
            detectionDetails.classList.add('hidden');
        }

        // Animate results
        resultsClean.style.animation = 'none';
        resultsClean.offsetHeight; // trigger reflow
        resultsClean.style.animation = 'fadeIn 0.3s ease';
    });

    // Copy cleaned text (bottom button)
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(outputClean.value).then(() => {
            copyStatus.classList.remove('hidden');
            setTimeout(() => copyStatus.classList.add('hidden'), 2000);
        });
    });

    // Copy clean text (annotated section inline button)
    btnCopyClean.addEventListener('click', () => {
        const cleaned = outputClean.value;
        navigator.clipboard.writeText(cleaned).then(() => {
            btnCopyClean.classList.add('copied');
            btnCopyClean.innerHTML = '<span>✓</span> Copied!';
            setTimeout(() => {
                btnCopyClean.classList.remove('copied');
                btnCopyClean.innerHTML = '<span>📋</span> Copy';
            }, 2000);
        });
    });

    // =========================================================================
    // Reveal Tab
    // =========================================================================
    const inputReveal = document.getElementById('input-reveal');
    const btnReveal = document.getElementById('btn-reveal');
    const resultsReveal = document.getElementById('results-reveal');
    const revealedText = document.getElementById('revealed-text');
    const charBreakdown = document.getElementById('char-breakdown');
    const revealCount = document.getElementById('reveal-count');

    btnReveal.addEventListener('click', () => {
        const text = inputReveal.value;
        if (!text.trim() && text.length === 0) return;

        const detection = WatermarkDetector.detect(text, { includeFormatting: true });

        // Show results
        resultsReveal.classList.remove('hidden');

        // Revealed text with annotations
        revealedText.innerHTML = WatermarkDetector.revealHTML(text, { includeFormatting: true });

        // Count
        revealCount.textContent = `${detection.total} hidden character${detection.total !== 1 ? 's' : ''} found`;
        revealCount.className = detection.total > 0 ? 'badge badge-danger' : 'badge badge-success';

        // Breakdown
        charBreakdown.innerHTML = '';
        if (detection.chars.size > 0) {
            detection.chars.forEach((entry) => {
                const el = document.createElement('div');
                el.className = 'char-breakdown-item';
                el.innerHTML = `
                    <div>
                        <span class="char-breakdown-name">${entry.info.name}</span>
                        <span class="char-breakdown-code">${entry.info.code}</span>
                    </div>
                    <span class="char-breakdown-count">${entry.count}</span>
                `;
                charBreakdown.appendChild(el);
            });
        }

        resultsReveal.style.animation = 'none';
        resultsReveal.offsetHeight;
        resultsReveal.style.animation = 'fadeIn 0.3s ease';
    });

    // =========================================================================
    // Inject Tab (Demo)
    // =========================================================================
    const inputInject = document.getElementById('input-inject');
    const btnInject = document.getElementById('btn-inject');
    const resultsInject = document.getElementById('results-inject');
    const outputInject = document.getElementById('output-inject');
    const injectCount = document.getElementById('inject-count');
    const btnCopyInject = document.getElementById('btn-copy-inject');
    const copyInjectStatus = document.getElementById('copy-inject-status');
    const optZwsp = document.getElementById('opt-zwsp');
    const optZwnj = document.getElementById('opt-zwnj');
    const optBom = document.getElementById('opt-bom');
    const optInvisSep = document.getElementById('opt-invis-sep');

    btnInject.addEventListener('click', () => {
        const text = inputInject.value;
        if (!text.trim()) return;

        const result = WatermarkDetector.inject(text, {
            zwsp: optZwsp.checked,
            zwnj: optZwnj.checked,
            bom: optBom.checked,
            invisSep: optInvisSep.checked,
        });

        resultsInject.classList.remove('hidden');
        outputInject.value = result.text;
        injectCount.textContent = `${result.count} characters injected`;

        resultsInject.style.animation = 'none';
        resultsInject.offsetHeight;
        resultsInject.style.animation = 'fadeIn 0.3s ease';
    });

    btnCopyInject.addEventListener('click', () => {
        navigator.clipboard.writeText(outputInject.value).then(() => {
            copyInjectStatus.classList.remove('hidden');
            setTimeout(() => copyInjectStatus.classList.add('hidden'), 2000);
        });
    });

    // =========================================================================
    // Keyboard shortcuts
    // =========================================================================
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                if (tabName === 'clean') btnClean.click();
                else if (tabName === 'reveal') btnReveal.click();
                else if (tabName === 'inject') btnInject.click();
            }
        }
    });

    // =========================================================================
    // Auto-detect on paste (clean tab) — auto-click Clean if watermarks found
    // =========================================================================
    inputClean.addEventListener('paste', () => {
        setTimeout(() => {
            const text = inputClean.value;
            if (text) {
                const detection = WatermarkDetector.detect(text, { includeFormatting: true });
                if (detection.total > 0) {
                    btnClean.click();
                }
            }
        }, 100);
    });

    // =========================================================================
    // AI Compatibility Grid — render from WatermarkDetector.AI_WATERMARK_INFO
    // =========================================================================
    const aiCompatGrid = document.getElementById('ai-compat-grid');
    if (aiCompatGrid && WatermarkDetector.AI_WATERMARK_INFO) {
        Object.entries(WatermarkDetector.AI_WATERMARK_INFO).forEach(([name, info]) => {
            const card = document.createElement('div');
            card.className = `ai-card ai-card-${info.effectiveness}`;
            card.innerHTML = `
                <div class="ai-card-header">
                    <span class="ai-card-icon">${info.icon}</span>
                    <span class="ai-card-name">${name}</span>
                </div>
                <div class="ai-card-techniques">
                    ${info.techniques.map(t => `<span class="ai-technique">${t}</span>`).join('')}
                </div>
                <p class="ai-card-note">${info.note}</p>
                <div class="ai-card-status">
                    ${info.effectiveness === 'full'
                        ? '<span class="status-full">✓ Full Removal</span>'
                        : '<span class="status-partial">◐ Partial</span>'}
                </div>
            `;
            aiCompatGrid.appendChild(card);
        });
    }
});
