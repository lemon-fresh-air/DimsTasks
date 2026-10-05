# DimsTasks

Персональний local-first таск-менеджер: швидкий, офлайн-доступний і без акаунтів.

## Локальний запуск

```bash
python scripts/build.py
python -m http.server 8000 --directory dist
```

Відкрийте `http://localhost:8000`.

Дані зберігаються в IndexedDB поточного браузера. У меню «Дані» доступні експорт і відновлення JSON.

