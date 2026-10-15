# yulia.profinance: монорепозиторій

Усі проєкти в одному репозиторії. При кожному пуші в `main` GitHub Actions збирає всі застосунки в `dist/` і публікує їх на GitHub Pages одним сайтом.

| Папка | Що це | Адреса |
| --- | --- | --- |
| `apps/landing/` | Сторінка для клієнтів (HTML + CSS, без збірки) | `/` |
| `apps/planner/` | Фінансовий планер (Vite + React + TypeScript) | `/planner/` |
| `packages/design-system/` | Дизайн-система бренду | не публікується |

## Робота локально

Потрібен Node 22 (`nvm use`).

```bash
npm install            # один раз
npm run dev:planner    # планер на http://localhost:5173
npm run build          # зібрати весь сайт у dist/
```

Лендинг можна відкривати напряму: `apps/landing/index.html`.

## Як додати новий застосунок

1. Створіть `apps/<назва>/`.
2. Якщо потрібна збірка, додайте папку в `workspaces` у кореневому `package.json`.
3. Додайте копіювання в `scripts/build.sh`, щоб застосунок опинився в `dist/<назва>/`.
