# Implementation Plan: Add OpenCode Zen & OpenRouter as AI Provider Options

## Requirements Restatement

Currently LP Factory uses only **Anthropic API** (direct) for AI copy generation. The user wants to add **OpenCode Zen** and **OpenRouter** as alternative AI provider options, so users can choose which provider to use for generating LP copy.

## Current State

- **Settings**: Stores `apiKey` (Anthropic) and `netlifyToken`
- **AI usage**: In `handleBuild()` (line 951), calls Anthropic API directly with `x-api-key` header
- **Test function**: `testApi()` (line 1546) tests against Anthropic endpoint
- **TopBar**: Shows "API OK" / "No API" status (line 348)
- **Step 4 hint**: "Leave empty = Claude AI generates on build (needs API key)" (line 1109)

## Implementation Phases

### Phase 1: Add AI Provider Selector in Settings

Add a provider dropdown with 3 options:
- **Anthropic** (Direct) — current behavior, `sk-ant-...` key
- **OpenCode Zen** — endpoint `https://opencode.ai/zen/v1/messages` (Anthropic-compatible), Zen API key
- **OpenRouter** — endpoint `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible), `sk-or-...` key

New settings fields:
- `settings.aiProvider` — `"anthropic"` | `"opencode"` | `"openrouter"` (default: `"anthropic"`)
- `settings.apiKey` — reuse existing field (works for all 3 providers)

### Phase 2: Update Settings UI

Replace the current "Anthropic API Key" card with a provider-aware card:
- Provider selector (3 radio buttons or tab-style toggle)
- API key input with provider-specific placeholder:
  - Anthropic: `sk-ant-api03-...`
  - OpenCode Zen: `zen_...`
  - OpenRouter: `sk-or-v1-...`
- Test button that hits the correct endpoint
- Provider-specific help text

### Phase 3: Update `testApi()` Function

Route test calls based on selected provider:
- **Anthropic**: Current behavior (POST to `https://api.anthropic.com/v1/messages`)
- **OpenCode Zen**: POST to `https://opencode.ai/zen/v1/messages` with same Anthropic-format body
- **OpenRouter**: POST to `https://openrouter.ai/api/v1/chat/completions` with OpenAI-format body

### Phase 4: Update `handleBuild()` AI Call

Create a unified `callAI()` function that routes based on `settings.aiProvider`:

**Anthropic** (current):
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access
Body: { model, max_tokens, messages }
Response: d.content[0].text
```

**OpenCode Zen** (Anthropic-compatible):
```
POST https://opencode.ai/zen/v1/messages
Headers: Authorization: Bearer <key>, anthropic-version
Body: { model: "claude-sonnet-4-20250514", max_tokens, messages }
Response: d.content[0].text (same as Anthropic)
```

**OpenRouter** (OpenAI-compatible):
```
POST https://openrouter.ai/api/v1/chat/completions
Headers: Authorization: Bearer <key>, HTTP-Referer, X-Title
Body: { model: "anthropic/claude-sonnet-4", max_tokens, messages }
Response: d.choices[0].message.content
```

### Phase 5: Update UI Labels & Indicators

- **TopBar** (line 348): Show provider name instead of generic "API OK" — e.g., "Anthropic ✓", "Zen ✓", "OpenRouter ✓"
- **Step 4 hint** (line 1109): Update to "Leave empty = AI generates on build (needs API key in Settings)"
- **Cost display**: Keep $0.003 estimate for all providers (approximate)

## Files Changed

1. **`lp-factory-web/src/App.jsx`** — All changes in this single file:
   - Settings component (provider selector + dynamic UI)
   - `testApi()` function (multi-provider test)
   - `handleBuild()` function (multi-provider AI call)
   - TopBar indicator label
   - Step 4 hint text

## Risks

- **LOW**: OpenCode Zen API format — documented as Anthropic-compatible, should work with same body format
- **LOW**: OpenRouter API format — well-documented OpenAI-compatible format
- **LOW**: CORS — both services should support browser-side calls (OpenRouter explicitly does, OpenCode Zen designed for it)

## Estimated Complexity: LOW-MEDIUM

Single file change, 5 touch points, well-defined API contracts.
