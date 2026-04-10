#!/bin/bash
# Session Start Hook — Chiqueteza
# Exibe o STATUS.md do projeto para o Claude ter contexto imediato a cada sessão.

set -euo pipefail

STATUS_FILE="$CLAUDE_PROJECT_DIR/.claude/STATUS.md"
CLAUDE_MD="$CLAUDE_PROJECT_DIR/CLAUDE.md"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  CHIQUETEZA — CONTEXTO DA SESSÃO"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -f "$STATUS_FILE" ]; then
  cat "$STATUS_FILE"
else
  echo "⚠️  STATUS.md não encontrado em .claude/STATUS.md"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Feature docs disponíveis em .claude/features/"
echo "═══════════════════════════════════════════════════════════"
ls "$CLAUDE_PROJECT_DIR/.claude/features/" 2>/dev/null | sed 's/\.md$//' | sed 's/^/  → /'
echo ""
echo "  Leia o CLAUDE.md na raiz e o doc da feature em foco."
echo "═══════════════════════════════════════════════════════════"
echo ""
