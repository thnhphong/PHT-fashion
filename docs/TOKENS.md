# Token Management with Caveman

This project adopts the **Caveman Workflow** to optimize token usage and improve AI response speed.

## Why Caveman?
AI agents often use excessive tokens on pleasantries, filler words, and repetitive grammar. Caveman mode strips these away, focusing only on technical substance.
- **Cost**: Saves ~65-75% tokens per response.
- **Speed**: Faster response generation.
- **Clarity**: Direct, unambiguous technical instructions.

## Intensity Levels

| Level | Description | Token Savings |
|-------|-------------|---------------|
| **lite** | Professional but tight. No filler. | ~20-30% |
| **full** | Drop articles (a/an/the), fragments OK. | ~50-60% |
| **ultra** | Abbreviate prose (auth, db, fn), strip conjunctions. | ~75% |

## Guidelines
1. **Default to `full`**: Best balance of readability and savings.
2. **Use `ultra` for routine tasks**: Refactoring, repetitive edits, or simple queries.
3. **Switch to `lite` or `normal` for complex architecture**: When high precision in prose is required to avoid ambiguity.
4. **Auto-Clarity**: The assistant will automatically drop caveman for security warnings or destructive actions.

## Commands
- `/caveman lite` - Set to lite mode.
- `/caveman full` - Set to full mode.
- `/caveman ultra` - Set to ultra mode.
- `stop caveman` - Revert to normal prose.
