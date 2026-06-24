# 🛡️ COMANDOS Security Audit

**Комплексный аудит безопасности любого проекта** — сайт, веб-приложение,
Telegram-бот, API, мобильное приложение или скрипты. Навык для Claude Code (а также
OpenAI Codex и Google Antigravity), который проверяет проект и выдаёт понятный
человеку отчёт: что небезопасно, чем грозит и как починить.

> Часть библиотеки навыков **[COMANDOS AI](https://comandos.ai)** — центра
> AI-бизнес-автоматизаций. Telegram: [@ai_comandos](https://t.me/ai_comandos)

## Что внутри

- `SKILL.md` — точка входа для Claude Code (роутер + поток аудита).
- `AGENTS.md` / `GEMINI.md` — точки входа для OpenAI Codex / Google Antigravity.
- `references/` — чеклисты по доменам (секреты, зависимости, авторизация, конфиги,
  код/OWASP, типы проектов, live-проверки, шаблон отчёта).
- `scripts/` — два zero-dependency Node-сканера:
  - `secrets-scan.mjs` — ищет утёкшие ключи/токены/пароли в коде и истории git.
  - `deps-audit.mjs` — проверяет зависимости на известные уязвимости.

## Установка (Claude Code)

```bash
# глобально, в ~/.claude/skills/
git clone https://github.com/Comandosai/comandos-security-audit \
  ~/.claude/skills/comandos-security-audit
```
Или нажмите **«Получить навык»** на [comandos.ai/hub/skills](https://comandos.ai/hub/skills) —
корзина соберёт готовый промт установки.

## Использование

Откройте свой проект и скажите агенту:

> **«проверь безопасность моего проекта»**

Навык определит тип проекта, прогонит проверки, при необходимости спросит ссылку на
живую версию и выдаст отчёт.

Ручной запуск сканеров (необязательно):
```bash
node ~/.claude/skills/comandos-security-audit/scripts/secrets-scan.mjs .
node ~/.claude/skills/comandos-security-audit/scripts/deps-audit.mjs .
```

## Требования

- Node.js ≥ 18 (для сканеров)
- git (опционально — для проверки истории на утечки секретов)

## ⚠️ Этика

Навык — для проверки **своих** проектов или проектов, на аудит которых есть явное
разрешение. Все проверки читающие и неразрушающие: никаких атак, перебора паролей
или сканирования чужих ресурсов.

## Лицензия

Apache-2.0 © 2026 COMANDOS AI
