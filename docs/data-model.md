# Модель даних DimsTasks

DimsTasks зберігає доменні об'єкти в чотирьох окремих object stores IndexedDB: `lists`, `sections`, `projects`, `tasks`. Екрани й картки є лише представленнями цих записів і не дублюють дані.

## Спільні поля

Кожен запис має стабільний `id`, `entityVersion`, ISO-час `createdAt` і `updatedAt`, а також `customFields` для експериментальних чи користувацьких атрибутів. Нові звичайні поля можна додавати без зміни версії IndexedDB; версію бази потрібно піднімати лише при зміні object stores або індексів.

## Сутності

### List

```js
{ id, entityVersion, title, description, kind, position, customFields, createdAt, updatedAt }
```

`kind`: `inbox | regular`. Системний Інбокс має стабільний id `system-list-inbox` і створюється автоматично.

### Section

```js
{ id, entityVersion, listId, title, description, position, customFields, createdAt, updatedAt }
```

Секція завжди належить одному списку. Завдання може посилатися лише на секцію зі свого `listId`.

### Project

```js
{ id, entityVersion, title, goal, description, status, dueDate, dueTime,
  completedAt, position, customFields, createdAt, updatedAt }
```

`status`: `active | completed | archived`. Завершення проєкту підтверджується вручну.

### Task

```js
{ id, entityVersion, listId, sectionId, projectId, title, description,
  status, completedAt, dueDate, dueTime, position, projectPosition,
  customFields, createdAt, updatedAt }
```

`listId` обов'язковий; за замовчуванням це Інбокс. `sectionId` і `projectId` можуть бути `null`. `position` задає порядок у списку/секції, `projectPosition` — незалежний порядок кроків проєкту. `status`: `active | completed | archived`.

Дата зберігається як локальне `YYYY-MM-DD`, час окремо як `HH:mm`; це дозволяє мати дату без часу. `completedAt` заповнюється лише після виконання.

## Обчислювані правила

- Поточний крок проєкту — перше активне завдання за `projectPosition`; він не зберігається окремо.
- Звичайний список показує активні завдання без проєкту та лише поточний крок кожного проєкту.
- Переміщення завдання до іншого списку скидає несумісний `sectionId` у `null`.
- Видалення секції не видаляє завдання; їхній `sectionId` стає `null`.
- Видалення проєкту не видаляє завдання; їхній `projectId` і `projectPosition` стають `null`.
- Видалення звичайного списку переміщує його завдання до Інбоксу.

## Розширення моделі

Новий атрибут спочатку додається до фабрики відповідної сутності в `src/js/model.js` із безпечним значенням за замовчуванням. Існуючі записи мають читатися толерантно до відсутнього поля. Якщо для поля не потрібен IndexedDB-індекс, версію бази змінювати не треба. Якщо потрібні новий store, індекс або структурна міграція — збільшується `DB_VERSION` і додається збережувальний upgrade-крок у `src/js/db.js`.

`customFields` призначене для атрибутів, які ще не стали частиною стабільного домену. Важливі поля, за якими фільтрують, сортують або будують бізнес-правила, мають бути явними полями сутності.

## Резервна копія

Формат 2 експортує всі чотири stores в одному envelope. Імпорт формату 1 підтримується міграцією старих задач до Інбоксу. Відновлення замінює локальні дані, але завжди відтворює системний Інбокс, якщо його немає в копії.

