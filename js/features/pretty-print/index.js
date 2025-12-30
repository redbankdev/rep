// Pretty Print Feature - Automatically format request/response bodies
import { events, EVENT_NAMES } from '../../core/events.js';
import { prettyPrintHTTP } from '../../core/utils/pretty-print.js';
import { highlightHTTP } from '../../core/utils/network.js';
import { state } from '../../core/state.js';

/**
 * Setup pretty print feature
 * Integrates with view switching to automatically format bodies in pretty view
 */
export function setupPrettyPrint(elements) {
    // Listen for view switches to apply pretty printing
    events.on(EVENT_NAMES.UI_VIEW_SWITCHED, ({ pane, view }) => {
        if (view !== 'pretty') return;

        if (pane === 'request') {
            applyRequestPrettyPrint(elements);
        } else if (pane === 'response') {
            applyResponsePrettyPrint(elements);
        }
    });

    // Listen for response updates to apply pretty printing if in pretty view
    events.on(EVENT_NAMES.UI_UPDATE_RESPONSE_VIEW, ({ content }) => {
        // Check if pretty view is active
        const prettyView = document.getElementById('res-view-pretty');
        const isPrettyViewActive = prettyView && 
            (prettyView.style.display !== 'none' || prettyView.classList.contains('active'));
        
        if (isPrettyViewActive && content) {
            const prettyContent = prettyPrintHTTP(content);
            const responseDisplay = elements.rawResponseDisplay || document.getElementById('raw-response-display');
            if (responseDisplay) {
                responseDisplay.innerHTML = highlightHTTP(prettyContent);
            }
        }
    });
}

/**
 * Apply pretty printing to request content
 */
function applyRequestPrettyPrint(elements) {
    // Get current request content
    let content = '';
    const rawInput = elements.rawRequestInput || document.getElementById('raw-request-input');
    const rawTextarea = elements.rawRequestTextarea || document.getElementById('raw-request-textarea');
    
    // Check if we're coming from raw view (textarea has content)
    if (rawTextarea && rawTextarea.value) {
        content = rawTextarea.value;
    } else if (rawInput) {
        content = rawInput.innerText || rawInput.textContent || '';
    }

    if (!content) return;

    // Apply pretty printing
    const prettyContent = prettyPrintHTTP(content);

    // Update the display
    events.emit(EVENT_NAMES.UI_UPDATE_REQUEST_CONTENT, {
        text: prettyContent,
        highlighted: highlightHTTP(prettyContent)
    });
}

/**
 * Apply pretty printing to response content
 */
function applyResponsePrettyPrint(elements) {
    const content = state.currentResponse || '';
    if (!content) return;

    // Apply pretty printing
    const prettyContent = prettyPrintHTTP(content);

    // Update the display
    const responseDisplay = elements.rawResponseDisplay || document.getElementById('raw-response-display');
    if (responseDisplay) {
        responseDisplay.innerHTML = highlightHTTP(prettyContent);
    }
}
