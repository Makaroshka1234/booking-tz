# Аудит рефакторингу — Додаток для бронювання кімнат

**Проект**: Next.js 16 + React 19 + Firebase + Zustand  
**Дата**: 2026-07-16  
**Статус**: Готовий до рефакторингу

---

## Резюме

Додаток для бронювання кімнат має міцну архітектурну основу, але страждає від помірного дублювання коду та упущених можливостей абстракції. Ключові покращення дадуть скорочення на 25-30% у шаблонному коді компонентів та покращать підтримуваність.

### Топ-5 пріоритетних покращень:

1. **Створити universal Zustand store factory** (30 хв) - Усунути дублювання store
2. **Винести паттерни Dialog + Form у перевикористовувані компоненти** (45 хв) - Скоротити дублювання JSX  
3. **Побудувати hook `useFormSubmit` для обробки форм** (60 хв) - Усунути шаблонний код форм
4. **Створити universal обгортку Firestore підписок** (45 хв) - Дотримуватися принципу DRY
5. **Винести управління станом діалогів в кастомні хуки** (40 хв) - Спростити компоненти сторінок

**Приблизна загальна трудовитрата**: ~4 години для суттєвих покращень  
**ROI**: Високий - знижує когнітивне навантаження, покращує тестованість, збільшує повторне використання коду

---

## 1. Аналіз дублювання коду

### 1.1 Паттерни Dialog + Form (КРИТИЧНІ)

**Місцезнаходження**: 15+ екземплярів по всьому коду:
- `RoomCard.tsx` (рядки 65-77 - діалог редагування)
- `RoomsList.tsx` (рядки 86-98, 120-147 - діалоги створення і редагування)
- `app/(dashboard)/rooms/page.tsx` (рядки 81-88, 105-113)
- `app/(dashboard)/rooms/[roomId]/page.tsx` (рядки 182-195, 210-223, 247-270)
- `MembersPanel.tsx` (рядки 114-166)

**Паттерн**:
```tsx
<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
  <DialogTrigger asChild>
    <Button>Редагувати</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Заголовок</DialogTitle>
    </DialogHeader>
    <SomeForm onSuccess={() => setIsEditOpen(false)} />
  </DialogContent>
</Dialog>
```

**Вартість дублювання**: ~120 рядків шаблонного JSX

**Рекомендація**: 
- Розширити компонент `CreateDialog` до `FormDialog`
- Зробити його універсальним для прийому заголовка, форми і її пропсів
- Автоматично обробляти callback `onSuccess`

### 1.2 Паттерн Store (КРИТИЧНІ)

**Поточні сховища** (3 ідентичні реалізації):

```tsx
// useAuthStore.ts - 16 рядків
interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
```

Той самий паттерн в:
- `useBookingStore.ts` - 16 рядків
- `useRoomStore.ts` - 16 рядків

**Вартість дублювання**: 48 рядків (100% надлишкова структура)

**Рекомендація**: Створити функцію store factory

### 1.3 Дублювання Firestore підписок (ВИСОКЕ)

**Паттерн** з'являється в:
- `subscribeToRooms()` - 17 рядків
- `subscribeToMyRooms()` - 17 рядків  
- `subscribeToJoinedRooms()` - 27 рядків

**Дублювана логіка**:
```tsx
const unsubscribe = onSnapshot(q, (snapshot) => {
  const items: (Item & { id: string })[] = []
  snapshot.forEach((doc) => {
    items.push({
      id: doc.id,
      ...doc.data(),
    } as Item & { id: string })
  })
  onItemsChange(items)
})
return unsubscribe
```

**Вартість дублювання**: ~40 рядків + повторена обробка помилок

**Рекомендація**: Створити universal hook `useFirestoreSubscription`

### 1.4 Дублювання виявлення конфліктів (СЕРЕДНЄ)

**Місцезнаходження**:
- `lib/firestore/bookings.ts` - функція `hasConflict()` (рядки 23-34)
- `lib/firestore/bookings.ts` - перевірка конфлікту в `createBooking()` (рядки 66-72)
- `lib/firestore/bookings.ts` - перевірка конфлікту в `updateBooking()` (рядки 124-132)

**Проблема**: Логіка виявлення конфліктів дублюється між створенням і оновленням. Коментарі попереджають про обмеження транзакцій.

**Рекомендація**: Винести виявлення конфліктів у окремий ютиліти з чіткою документацією

### 1.5 Обробка Toast/Помилок (СЕРЕДНЄ)

**Паттерн** використовується 20+ разів:
```tsx
try {
  await someAction()
  toast.success("✓ Повідомлення про успіх", {
    description: someDetail,
  })
  onSuccess?.()
} catch (error) {
  toast.error(
    error instanceof Error ? `✕ ${error.message}` : "✕ Помилка за замовчуванням"
  )
} finally {
  setIsLoading(false)
}
```

**Вартість дублювання**: ~8 рядків на форму, 20+ екземплярів = 160+ рядків

---

## 2. Можливості вилучення компонентів

### 2.1 Великі компоненти, що потребують розбиття

#### `app/(dashboard)/rooms/[roomId]/page.tsx` (350 рядків)
**Проблеми**:
- Змішування завантаження інформації про кімнату, підписки бронювань, стану діалогів і обробників видалення
- `handleUpdateBooking` і `handleDeleteBooking` — великі функції
- Логіка рендерингу карточки бронювання вбудована (30+ рядків)

**Рефакторинг**:
```
RoomPage (макет/оркестрація)
├── useRoomInfo() - завантажити дані кімнати
├── <BookingsSection> - рендерити список бронювань з редаганням/видаленням
│   ├── <BookingCard> - винести відображення бронювання (30 рядків)
│   ├── <CreateBookingDialog>
│   └── <EditBookingDialog>
├── <MembersSection> - вже винято, добре
└── useDeleteBooking() - винести обробник видалення
```

**Рядків збережено**: ~100 рядків

#### `MembersPanel.tsx` (217 рядків)
**Проблеми**:
- Управління формою в діалозі змішано з відображенням списку членів
- Фрагментація стану: `members`, `isLoading`, `isAddingMember`, `newMemberEmail`, `newMemberRole`, `isDialogOpen`, `removingId`, `deleteAlertOpen`
- Діалог додавання членів повинен бути окремим компонентом

**Рефакторинг**:
```
MembersPanel (відображення списку + оркестрація)
├── <MembersList> - рендерити членів
├── <AddMemberDialog> - винести форму в діалозі
└── useAddMember() - винести обробник додавання
```

**Рядків збережено**: ~50 рядків, кращий порядок стану

#### `RoomsList.tsx` (165 рядків)
**Проблеми**:
- Змішування підписки store з CRUD кімнат і відображенням
- Обробники редагування/видалення вбудовані в рендеринг

**Рефакторинг**:
```
RoomsList
├── <RoomCard> - вже винято, але може бути покращено
├── <CreateRoomDialog>
└── useRoomActions() - винести видалення/редагування
```

### 2.2 UI паттерни компонентів для винесення

#### Паттерн Empty State (з'являється 4+ рази)
**Поточний**:
```tsx
<div className="text-center py-8 border border-dashed rounded-lg">
  <p className="text-muted-foreground">Немає елементів</p>
</div>
```

**Краще**: `<EmptyState icon="📅" title="..." description="..." />`

#### Паттерн Loading State
**Поточний**: Власний скелет завантаження на кожній сторінці

**Краще**: Компонент `<LoadingGrid count={3} />`

#### Паттерн Confirmation
**Поточний**: Кілька імпортів `ConfirmDialog` і передача пропсів

**Краще**: Створити hook `useConfirm()` для чистішої інтеграції

---

## 3. Кастомні хуки для створення

### 3.1 Hook `useFormSubmit` (ПРІОРИТЕТ)

**Проблема**: Кожна форма має ідентичний паттерн try/catch/loading/toast

**Рішення**:
```tsx
interface UseFormSubmitOptions {
  onSubmit: (values: any) => Promise<void>
  onSuccess?: () => void
  successMessage?: string
  errorPrefix?: string
}

function useFormSubmit({ onSubmit, onSuccess, successMessage }: UseFormSubmitOptions) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (values: any) => {
    setIsLoading(true)
    try {
      await onSubmit(values)
      toast.success(successMessage || "✓ Дію завершено")
      onSuccess?.()
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return { handleSubmit, isLoading }
}
```

**Вплив на використання**: Скорочує шаблонний код форми на ~20 рядків на форму × 5 форм = 100 рядків збережено

### 3.2 Hook `useDialogState`

**Проблема**: Кожний компонент керує станом відкриття діалогу окремо

```tsx
const [isEditOpen, setIsEditOpen] = useState(false)
const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
const [isCreateOpen, setIsCreateOpen] = useState(false)
```

**Рішення**:
```tsx
function useDialogState() {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  
  return {
    isOpen: (key: string) => open[key] ?? false,
    open: (key: string) => setOpen(p => ({ ...p, [key]: true })),
    close: (key: string) => setOpen(p => ({ ...p, [key]: false })),
    toggle: (key: string) => setOpen(p => ({ ...p, [key]: !p[key] })),
  }
}
```

**Використання**:
```tsx
const dialogs = useDialogState()
<Dialog open={dialogs.isOpen('edit')} onOpenChange={(o) => o ? dialogs.open('edit') : dialogs.close('edit')}>
```

**Вплив**: Скорочує оголошення стану на 60%

### 3.3 Hook `useFirestoreSubscription`

**Проблема**: Повторюваний паттерн підписки в rooms.ts, bookings.ts

**Рішення**:
```tsx
function useFirestoreSubscription<T>(
  query: Query,
  mapper: (doc: DocumentSnapshot) => T
): [T[], boolean] {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const unsubscribe = onSnapshot(query, (snapshot) => {
      const mapped: T[] = []
      snapshot.forEach(doc => mapped.push(mapper(doc)))
      setData(mapped)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [query])
  
  return [data, loading]
}
```

**Вплив**: Усуває 40+ рядків з rooms.ts та bookings.ts

### 3.4 Hook `useDeleteWithConfirm`

**Проблема**: Паттерн видалення повторюється по компонентах (видалити кімнату, видалити бронювання, видалити члена)

**Рішення**:
```tsx
interface UseDeleteOptions {
  onConfirm: () => Promise<void>
  title: string
  description: string
  successMessage?: string
}

function useDeleteWithConfirm({
  onConfirm,
  title,
  description,
  successMessage,
}: UseDeleteOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      toast.success(successMessage ?? "✓ Успішно видалено")
      setIsOpen(false)
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return {
    dialog: { isOpen, setIsOpen, title, description, isLoading, onConfirm: handleDelete },
    openDialog: () => setIsOpen(true),
  }
}
```

**Вплив**: Спрощує MembersPanel, RoomCard, видалення бронювання на 30+ рядків кожна

### 3.5 Hook `useMemoTimeSlots`

**Проблема**: `generateTimeSlots()` перестворюється на кожен рендеринг BookingForm

**Поточний** (BookingForm.tsx, рядки 40-55):
```tsx
function generateTimeSlots(): { label: string; value: string }[] {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min of [0, 30]) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      slots.push({ label: timeStr, value: timeStr })
    }
  }
  return slots
}
const timeSlots = generateTimeSlots()
```

**Рішення**:
```tsx
function useMemoTimeSlots() {
  return useMemo(() => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      for (let min of [0, 30]) {
        const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
        slots.push({ label: timeStr, value: timeStr })
      }
    }
    return slots
  }, [])
}
```

**Вплив**: Мікрооптимізація, усуває непотрібні перевичислення

---

## 4. Рефакторинг сховища

### 4.1 Universal Zustand Store Factory

**Поточна проблема**:
```tsx
// 3 майже ідентичні сховища
const useAuthStore = create<AuthStore>(...)
const useBookingStore = create<BookingStore>(...)
const useRoomStore = create<RoomStore>(...)
```

**Функція Factory**:
```tsx
// store/createDataStore.ts
interface DataStoreState<T> {
  data: T | null | T[]
  loading: boolean
  error: Error | null
  setData: (data: T | T[] | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  reset: () => void
}

export function createDataStore<T>(initialData: T | null = null) {
  return create<DataStoreState<T>>((set) => ({
    data: initialData,
    loading: true,
    error: null,
    setData: (data) => set({ data, error: null }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => set({ data: initialData, loading: true, error: null }),
  }))
}
```

**Рефакторене використання**:
```tsx
// store/useAuthStore.ts
export const useAuthStore = createDataStore<User | null>(null)

// store/useBookingStore.ts
export const useBookingStore = createDataStore<(Booking & { id: string })[]>([])

// store/useRoomStore.ts
export const useRoomStore = createDataStore<(Room & { id: string })[]>([])
```

**Вплив**: 
- Скорочує файли сховища з 51 рядків на ~20 рядків всього
- Додає стан помилок (зараз відсутній)
- Додає можливість скиду (корисно для logout)
- Більш підтримуваний як єдине джерело істини

### 4.2 Покращення використання сховища

**Поточна проблема**: Сховища використовуються, але логіка в компонентах

**Кращий підхід**: Перемістити бізнес-логіку у виведені хуки

```tsx
// hooks/useAuthStatus.ts
export function useAuthStatus() {
  const { data: user, loading } = useAuthStore()
  return {
    isAuthenticated: !!user && !loading,
    user,
    loading,
    isLoading: loading,
  }
}

// hooks/useMyRooms.ts
export function useMyRooms(userId: string | undefined) {
  const { data: rooms, setData, setLoading } = useRoomStore()
  
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    const unsubscribe = subscribeToMyRooms(userId, (rooms) => {
      setData(rooms)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [userId, setData, setLoading])
  
  return rooms
}
```

---

## 5. Рефакторинг ютиліт Firestore

### 5.1 Universal обгортка підписок

**Поточний**: Повторюваний код в subscribeToRooms, subscribeToMyRooms, subscribeToJoinedRooms

**Створити**: `lib/firestore/generic.ts`

```tsx
export function createSubscription<T extends { id: string }>(
  query: Query,
  converter?: (doc: DocumentSnapshot) => T
): (callback: (data: T[]) => void) => () => void {
  return (callback: (data: T[]) => void) => {
    return onSnapshot(query, (snapshot) => {
      const data: T[] = []
      snapshot.forEach((doc) => {
        data.push(
          converter ? converter(doc) : { id: doc.id, ...doc.data() }
        )
      })
      callback(data)
    })
  }
}
```

**Рефакторений rooms.ts**:
```tsx
const roomsSubscription = createSubscription<Room & { id: string }>(
  query(roomsCollection, orderBy("createdAt", "desc"))
)

export function subscribeToRooms(
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  return roomsSubscription(onRoomsChange)
}

export function subscribeToMyRooms(
  uid: string,
  onRoomsChange: (rooms: (Room & { id: string })[]) => void
): () => void {
  return roomsSubscription(
    onRoomsChange,
    query(roomsCollection, where("createdBy", "==", uid), orderBy("createdAt", "desc"))
  )
}
```

**Вплив**: Скорочує код на 50+ рядків, покращує консистентність

### 5.2 Вилучення виявлення конфліктів

**Поточна проблема**: Логіка конфліктів дублюється і коментарі попереджають про обмеження

**Рішення**: Винести з чіткою документацією

```tsx
// lib/firestore/bookings/conflicts.ts

/**
 * Перевірити, чи конфліктують часові інтервали.
 * Конфлікт виникає, якщо: newStart < existingEnd && existingStart < newEnd
 * 
 * ВАЖЛИВО: Ця функція використовує логіку на клієнті. Для надійності у production
 * це повинно бути забезпечено через Cloud Function (callable).
 * Див.: https://firebase.google.com/docs/firestore/solutions/sched-overlap
 */
export function hasConflict(
  newStart: Timestamp,
  newEnd: Timestamp,
  existing: { startTime: Timestamp; endTime: Timestamp }
): boolean {
  return (
    newStart.toMillis() < existing.endTime.toMillis() &&
    existing.startTime.toMillis() < newEnd.toMillis()
  )
}

export function findConflictingBooking(
  newStart: Timestamp,
  newEnd: Timestamp,
  existingBookings: any[],
  excludeId?: string
): any | null {
  return existingBookings.find((booking) => {
    if (excludeId && booking.id === excludeId) return false
    return hasConflict(newStart, newEnd, booking)
  })
}
```

**Вплив**: Спільна логіка, краща тестованість, чітка документація

---

## 6. Покращення форм

### 6.1 Спільний базовий компонент форми

**Проблема**: LoginForm, RegisterForm, RoomForm, BookingForm — усі схожі

**Паттерн для винесення**:
```tsx
// components/forms/FormBase.tsx

interface FormBaseProps<T> {
  onSubmit: (values: T) => Promise<void>
  schema: ZodSchema
  defaultValues?: T
  isLoading?: boolean
  children: (form: UseFormReturn<T>) => React.ReactNode
  onSuccess?: () => void
  submitLabel?: string
}

export function FormBase<T>({
  onSubmit,
  schema,
  defaultValues,
  isLoading = false,
  children,
  onSuccess,
  submitLabel = "Відправити",
}: FormBaseProps<T>) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues })
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (values: T) => {
    setLoading(true)
    try {
      await onSubmit(values)
      toast.success("✓ Успіх")
      onSuccess?.()
      form.reset()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {children(form)}
        <Button type="submit" disabled={isLoading || loading}>
          {isLoading || loading ? "Завантаження..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
```

**Рефакторена LoginForm**:
```tsx
export function LoginForm() {
  const router = useRouter()
  
  return (
    <FormBase
      schema={loginSchema}
      onSubmit={(values) => loginUser(values.email, values.password)}
      onSuccess={() => router.push("/rooms")}
      submitLabel="Вхід"
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* поле пароля */}
        </>
      )}
    </FormBase>
  )
}
```

**Вплив**: Скорочує файли форм з 5 × 60-70 рядків на 5 × 30 рядків = 150-200 рядків збережено

---

## 7. Компоненти UI паттернів

### 7.1 Компонент `EmptyState`

**Поточний**: Дублюється в 4+ місцях з еможі + текстом

**Створити**: `components/ui/empty-state.tsx`

```tsx
interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-lg">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {action}
    </div>
  )
}
```

**Використання**:
```tsx
<EmptyState
  icon="📅"
  title="Бронювання не знайдено"
  description="Будьте першими, хто забронює цю кімнату"
  action={<Button>Створити бронювання</Button>}
/>
```

**Вплив**: Усуває 20+ рядків повторюваного JSX

### 7.2 Компонент `LoadingGrid`

**Поточний**: Повторюваний код скелета в кількох сторінках

```tsx
interface LoadingGridProps {
  count?: number
  columns?: 1 | 2 | 3
}

export function LoadingGrid({ count = 3, columns = 3 }: LoadingGridProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 p-4 border border-border rounded-lg">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
```

**Вплив**: Усуває 30-40 рядків з компонентів сторінок

---

## 8. Рекомендації щодо організації файлів

### Поточна структура:
```
app/
  (auth)/
  (dashboard)/
    bookings/
    rooms/
components/
  forms/
  ui/
  (вільні компоненти)
hooks/
lib/
  firestore/
  (ютиліти)
store/
```

### Рекомендована структура (за функціями):

```
app/
  (auth)/
    login/
    register/
features/
  auth/
    hooks/
      useAuth.ts (перейменовано, краще ясності)
      useAuthStatus.ts (новий)
    types/
    utils/
  rooms/
    components/
      RoomCard.tsx
      RoomsList.tsx
      RoomForm.tsx
    hooks/
      useMyRooms.ts
      useRoomActions.ts
    lib/
      subscriptions.ts (консолідовано)
    pages/ або прямо в app/
  bookings/
    components/
      BookingCard.tsx
      BookingForm.tsx
    hooks/
      useBookings.ts
      useBookingActions.ts
    lib/
shared/
  components/
    EmptyState.tsx
    LoadingGrid.tsx
    FormDialog.tsx
  hooks/
    useFormSubmit.ts
    useDialogState.ts
    useDeleteWithConfirm.ts
  ui/ (перемістити shadcn сюди)
  utils/
```

**Переваги**:
- Функції самодостатні
- Легше розуміти залежності
- Простіше витягти функції в пакети
- Чітке розділення відповідальності

---

## 9. Ранжування пріоритетів і порядок реалізації

### Швидкі перемоги (30-60 хв кожна)

1. **Створити hook `useMemoTimeSlots`**
   - Файл: `hooks/useMemoTimeSlots.ts`
   - Вплив: Видалити 15 рядків з BookingForm.tsx
   - Ризик: Дуже низький

2. **Винести компонент `EmptyState`**
   - Файл: `components/ui/empty-state.tsx`
   - Місцезнаходження: сторінка кімнат, детали кімнати, сторінка бронювань
   - Вплив: 20 рядків збережено
   - Ризик: Дуже низький

3. **Консолідувати створення сховища**
   - Файл: `store/createDataStore.ts`
   - Вплив: 30 рядків збережено, додає стан помилок
   - Ризик: Низький

### Середні перемоги (60-120 хв кожна)

4. **Створити hook `useDeleteWithConfirm`**
   - Місцезнаходження: RoomCard, MembersPanel, RoomPage бронювання
   - Вплив: 30-40 рядків збережено на місцезнаходженні
   - Ризик: Низький

5. **Винести компонент `FormDialog`**
   - Файл: `components/FormDialog.tsx`
   - Місцезнаходження: 15+ пар діалог + форма
   - Вплив: 100+ рядків збережено
   - Ризик: Низький (просто абстракція існуючого коду)

6. **Створити hook `useFormSubmit`**
   - Файл: `hooks/useFormSubmit.ts`
   - Місцезнаходження: Усі компоненти форм
   - Вплив: 100+ рядків збережено
   - Ризик: Середній (змінює паттерни форм)

### Великіші рефакторинги (120-180 хв кожна)

7. **Розділити `app/(dashboard)/rooms/[roomId]/page.tsx`**
   - Створити: BookingCard, BookingsList, BookingDialog компоненти
   - Вплив: Покращує підтримуваність, ~100 рядків видалено
   - Ризик: Середній (суттєвий рефакторинг)

8. **Рефакторити Firestore підписки**
   - Створити: `lib/firestore/generic.ts` з помічниками
   - Вплив: 50+ рядків збережено, краща консистентність
   - Ризик: Середній (впливає на кілька функцій)

9. **Винести `AddMemberDialog` з `MembersPanel`**
   - Створити: `components/forms/AddMemberForm.tsx`
   - Створити: `components/AddMemberDialog.tsx`
   - Вплив: 50 рядків видалено, краща тестованість
   - Ризик: Низький

10. **Реорганізувати структуру файлів за функціями**
    - Створити папки функцій
    - Перемістити пов'язані файли
    - Вплив: Основний - покращена підтримуваність
    - Ризик: Високий (суттєвий рефакторинг)

---

## 10. Приклади коду: До/Після

### Приклад 1: Консолідація сховища

**До** (48 рядків у 3 файлах):
```tsx
// useAuthStore.ts
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

// useBookingStore.ts
const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  loading: true,
  setBookings: (bookings) => set({ bookings }),
  setLoading: (loading) => set({ loading }),
}))

// useRoomStore.ts
const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  loading: true,
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ loading }),
}))
```

**Після** (20 рядків всього):
```tsx
// store/createDataStore.ts - 10 рядків
export function createDataStore<T>(initialData: T | null = null) {
  return create<DataStoreState<T>>((set) => ({
    data: initialData,
    loading: true,
    error: null,
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }))
}

// store/useAuthStore.ts - 1 рядок
export const useAuthStore = createDataStore<User | null>(null)

// store/useBookingStore.ts - 1 рядок
export const useBookingStore = createDataStore<Booking[]>([])

// store/useRoomStore.ts - 1 рядок
export const useRoomStore = createDataStore<Room[]>([])
```

**Економія**: 28 рядків (58% скорочення), краща підтримуваність, додається обробка помилок

---

### Приклад 2: Вилучення Dialog + Form

**До** (25 рядків у RoomCard.tsx):
```tsx
<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">
      Редагувати
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Редагувати кімнату</DialogTitle>
    </DialogHeader>
    <RoomForm room={room} onSuccess={() => setIsEditOpen(false)} />
  </DialogContent>
</Dialog>
```

**Після** (3 рядки):
```tsx
<FormDialog<RoomFormValues>
  open={isEditOpen}
  onOpenChange={setIsEditOpen}
  title="Редагувати кімнату"
  form={<RoomForm room={room} onSuccess={() => setIsEditOpen(false)} />}
  trigger={<Button variant="outline" size="sm">Редагувати</Button>}
/>
```

**Економія**: 22 рядки на екземпляр × 15 екземплярів = 330 рядків скорочення

---

### Приклад 3: Видалення з підтвердженням

**До** (40+ рядків у RoomCard.tsx):
```tsx
const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
const [isDeleting, setIsDeleting] = useState(false)

async function handleDelete() {
  setIsDeleting(true)
  try {
    await deleteRoom(room.id)
    toast.success("✓ Кімната видалена")
    setIsDeleteAlertOpen(false)
    onDeleteSuccess?.()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Помилка")
  } finally {
    setIsDeleting(false)
  }
}

<ConfirmDialog
  open={isDeleteAlertOpen}
  onOpenChange={setIsDeleteAlertOpen}
  title="Видалити кімнату?"
  description="Ця дія необоротна..."
  confirmText={isDeleting ? "Видалення..." : "Видалити"}
  onConfirm={handleDelete}
  isLoading={isDeleting}
>
  <Button variant="destructive" size="sm">Видалити</Button>
</ConfirmDialog>
```

**Після** (5 рядків):
```tsx
const { dialog, openDialog } = useDeleteWithConfirm({
  onConfirm: () => deleteRoom(room.id),
  title: "Видалити кімнату?",
  description: "Ця дія необоротна...",
  successMessage: "✓ Кімната видалена",
})

<ConfirmDialog {...dialog}>
  <Button variant="destructive" size="sm" onClick={openDialog}>Видалити</Button>
</ConfirmDialog>
```

**Економія**: 35 рядків на екземпляр × 3+ екземпляри = 105+ рядків скорочення

---

## 11. Покращення тестування

### Поточний стан
- Немає файлів тестів у кодобазі
- Хуки і ютиліти важко тестувати через тісний зв'язок

### Рекомендації

Після рефакторингу додати тести для:

1. **Hook `useFormSubmit`** - Основний для всіх форм
```tsx
describe('useFormSubmit', () => {
  it('обробляє успішне відправлення', async () => { /* */ })
  it('обробляє помилки з toast', async () => { /* */ })
  it('викликає callback onSuccess', async () => { /* */ })
})
```

2. **Hook `useDeleteWithConfirm`** - Використовується в 3+ компонентах
3. **Виявлення конфліктів** - Критична бізнес-логіка
4. **Store factory** - Основне управління станом

### Покриття E2E тестами
- Потік створення кімнати
- Потік бронювання кімнати
- Робочі процеси редагування/видалення
- Управління членами

---

## 12. Оптимізація продуктивності (Наступний крок)

### Визначені проблеми
1. Масив `timeSlots` перестворюється на кожен рендеринг BookingForm - **ВИПРАВЛЕНО useMemoTimeSlots**
2. Підписки сховища не очищаються правильно - **Моніторити з новою структурою сховища**
3. Немає оптимізації запитів у підписках (рекомендуються індекси)
4. DialogContent перендеровується на кожну зміну стану

### Рекомендації
1. Використовувати `React.memo` для чистих компонентів (EmptyState, LoadingGrid, BookingCard)
2. Додати Firestore індекси для запиту приєднаних кімнат (roomMembers)
3. Розглянути Suspense boundaries для асинхронних компонентів
4. Профілювати з React DevTools Profiler після рефакторингу

---

## 13. Roadmap реалізації

### Фаза 1: Основа (Тиждень 1 - 4 години)
- Створити фабрику `createDataStore`
- Винести компоненти `EmptyState`, `LoadingGrid`
- Створити hook `useMemoTimeSlots`
- Створити hook `useFormSubmit`

### Фаза 2: Діалоги й форми (Тиждень 1-2 - 6 годин)
- Створити компонент `FormDialog`
- Рефакторити все форми використовуючи паттерн FormBase
- Оновити все використання форм

### Фаза 3: Дії й хуки (Тиждень 2 - 5 годин)
- Створити hook `useDeleteWithConfirm`
- Створити hook `useDialogState`
- Оновити компоненти, що використовують паттерни видалення/редагування

### Фаза 4: Firestore й очистка (Тиждень 2-3 - 4 години)
- Консолідувати підписки firestore
- Винести виявлення конфліктів
- Рефакторити підписки на кімнати/бронювання

### Фаза 5: Структура файлів (Тиждень 3 - 3 години)
- Реорганізувати за функціями
- Перемістити файли в папки функцій
- Оновити імпорти

### Фаза 6: Тестування (Тиждень 3-4 - 4 години)
- Додати unit тести для хуків
- Додати компонентні тести для вилучених компонентів
- Додати E2E тести для критичних потоків

**Загальна оцінка**: 26 годин протягом 4 тижнів (6-7 годин/тиждень)

---

## 14. Оцінка ризиків та пом'якшення

### Високі ризики
1. **Рефакторинг сховища** - Використовується скрізь
   - Пом'якшення: Ретельне тестування, поступовий розкат

2. **Зміни функцій Firestore** - Критичні для даних
   - Пом'якшення: Зберегти старі функції, створити шар обгортки

3. **Розділення компонента** - RoomPage великий
   - Пом'якшення: Винести в окремі файли поступово

### Середні ризики
1. **Управління станом діалогів** - Часто використовується
   - Пом'якшення: Використовувати feature flags, ретельно тестувати

2. **Зміни паттернів форм** - Впливає на всі форми
   - Пом'якшення: По одній формі в раз, зберегти старий паттерн доступним

### Низькі ризики
- Вилучення UI компонентів
- Створення хуків
- Реорганізація файлів

---

## 15. Висновок

Додаток для бронювання кімнат добре структурований з добрими базовими паттернами. Аудит рефакторингу визначає **~500-700 рядків усуваного дублювання** та **скорочення на 30-40% у шаблонному коді** через:

1. Консолідація паттернів сховища
2. Вилучення і повторне використання хуків
3. Абстракція компонентів
4. Консолідація функцій ютиліт

**Ключові метрики після рефакторингу**:
- ~200 менше рядків коду (з 2000 -> 1800 приблизно)
- На 40% менше шаблонного коду у формах
- 5 нових перевикористовуваних хуків
- Краща тестованість
- Краща організація функцій

**ROI**: Високий вплив на підтримуваність з помірною трудовитратою.

---

## Додаток: Швидка довідка

### Хуки для створення
- `useFormSubmit` - Обробка форм
- `useDeleteWithConfirm` - Робочі процеси видалення
- `useDialogState` - Управління станом діалогів
- `useFirestoreSubscription` - Universal підписки
- `useMemoTimeSlots` - Мемоізація часових слотів
- `useAuthStatus` - Помічник статусу автентифікації

### Компоненти для вилучення/створення
- `FormDialog` - Обгортка діалогу + форми
- `FormBase` - Базовий компонент форми
- `EmptyState` - UI порожнього стану
- `LoadingGrid` - Сітка скелета завантаження
- `BookingCard` - Відображення бронювання
- `BookingsList` - Список бронювань
- `AddMemberDialog` - Діалог додавання члена

### Файли для створення/рефакторингу
- `store/createDataStore.ts` - Фабрика сховища
- `lib/firestore/generic.ts` - Universal помічники підписок
- `lib/firestore/bookings/conflicts.ts` - Ютиліти виявлення конфліктів
- Папки функцій для кімнат, бронювань, автентифікації

### Швидкі перемоги
1. Винести `useMemoTimeSlots` (15 хв)
2. Винести `EmptyState` (20 хв)
3. Консолідувати сховища (30 хв)
4. Винести `useDeleteWithConfirm` (45 хв)
5. Винести `FormDialog` (60 хв)

**Загалом швидкі перемоги: ~2.5 години для 200+ рядків збережено**
