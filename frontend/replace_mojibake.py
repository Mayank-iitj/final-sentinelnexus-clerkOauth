import os

filepath = r'c:\Users\MS\final-sentinelnexus-clerkOauth\frontend\src\app\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Mojibake characters
replacements = {
    'â„¢': '™',
    'â€”': '—',
    'âŠ—': '⊗',
    'â˜…': '★',
    'âš™': '⚙',
    'âš”': '⚔',
    'âš–': '⚖',
    'ðŸ“„': '📄',
    'âœ“': '✓',
    'Â©': '©',
    'ðŸ¤': '🤝'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete.")
