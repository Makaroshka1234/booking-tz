# 🎨 Tailwind Styles Guide

## Компонентні класи (globals.css)

### Заголовки
```jsx
<h1 className="heading-1">Великий заголовок</h1>
<h2 className="heading-2">Средній заголовок</h2>
<h3 className="heading-3">Малий заголовок</h3>
<h4 className="heading-4">Дуже малий заголовок</h4>
```

### Текст
```jsx
<p className="text-subtitle">Subtitle text</p>
<p className="text-caption">Caption text</p>
```

### Карточки
```jsx
{/* Base card */}
<div className="card-base">Content</div>

{/* Interactive card with hover effect */}
<div className="card-interactive">Clickable content</div>
```

### Контейнери
```jsx
{/* Main container */}
<div className="container-base">Content</div>

{/* Small container */}
<div className="container-sm">Centered content</div>

{/* Center layout */}
<div className="layout-center">Centered content</div>
```

### Гріди
```jsx
{/* 2 column grid (1 col on mobile) */}
<div className="layout-grid-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* 3 column grid (1 col on mobile, 2 on tablet) */}
<div className="layout-grid-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Empty States
```jsx
<div className="state-empty">
  <div className="state-empty-icon">📅</div>
  <h3>Нічого не знайдено</h3>
</div>
```

### Loading States
```jsx
<div className="state-loading h-12 w-32" />
```

### Бейджи
```jsx
<span className="badge-success">Успішно</span>
<span className="badge-warning">Попередження</span>
<span className="badge-error">Помилка</span>
<span className="badge-info">Інформація</span>
```

### Форми
```jsx
{/* Група форми */}
<div className="form-group">
  <label>Name</label>
  <input />
</div>

{/* Рядок з 2 полями */}
<div className="form-row">
  <input placeholder="Field 1" />
  <input placeholder="Field 2" />
</div>
```

### Секції
```jsx
<div className="section-header">
  <h2 className="section-title">Заголовок секції</h2>
  <button>Action</button>
</div>
```

## Tailwind Spacing (Utility)

```jsx
{/* Gutter spacing */}
<div className="p-gutter">Padding</div>
<div className="gap-gutter">Gap between items</div>

{/* Different sizes */}
<div className="p-gutter-sm">Small padding</div>
<div className="p-gutter-lg">Large padding</div>
<div className="p-gutter-xl">Extra large padding</div>
```

## Responsive Prefixes

```jsx
{/* Мобільний: 1 колона, планшет: 2 колони, десктоп: 3 колони */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item</div>
</div>

{/* Текст розмір */}
<h1 className="text-2xl sm:text-3xl">Responsive heading</h1>

{/* Паддинг */}
<div className="p-4 sm:p-8">Responsive padding</div>

{/* Flex напрямок */}
<div className="flex flex-col sm:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Theme Configuration (config/theme.ts)

### Использование в коді
```tsx
import { themeColors, componentVariants } from "@/config/theme"

<div className={componentVariants.card.hover}>Content</div>
<span className={componentVariants.badge.success}>Success</span>
```

## Breakpoints

- **sm**: 640px (планшет)
- **md**: 768px (планшет landscape)
- **lg**: 1024px (десктоп)
- **xl**: 1280px (великий десктоп)
- **2xl**: 1536px (дуже великий экран)

## Color Utilities

Кольори беруться з CSS змінних:

```css
--primary: 0 0% 9.02%;          /* Чорний */
--destructive: 0 84.2% 60.2%;    /* Червоний */
--border: 0 0% 89.8%;            /* Сірий */
--background: 0 0% 100%;         /* Білий */
```

Змініть у `globals.css` `:root` для зміни теми.

## Dark Mode

Автоматично включається via `prefers-color-scheme: dark`

```jsx
<div className="dark:bg-slate-950">Light/Dark variant</div>
```

## Animations

```jsx
{/* Fade in */}
<div className="animate-fade-in">Content</div>

{/* Slide up */}
<div className="animate-slide-up">Content</div>
```

## Best Practices

1. **Використовуйте компонентні класи** (`.heading-1`, `.card-base`)
2. **Уникайте inline стилів** - добавляйте в `globals.css`
3. **Задавайте responsive класи** - `md:`, `lg:` prefixes
4. **Kerуйте кольорами через CSS змінні** - легше мінияти тему
5. **Групуйте related styles** - використовуйте `space-y`, `gap`

## Quick Reference

| Назва | Клас | Використання |
|-------|------|---|
| Заголовок 1 | `.heading-1` | Сторінки |
| Заголовок 2 | `.heading-2` | Секції |
| Заголовок 3 | `.heading-3` | Підсекції |
| Карточка | `.card-base` | Контейнери з borderm |
| Гід 2 колони | `.layout-grid-2` | Макети |
| Гід 3 колони | `.layout-grid-3` | Макети |
| Форма | `.form-row` | Поля форм |
| Пусто | `.state-empty` | No data states |
