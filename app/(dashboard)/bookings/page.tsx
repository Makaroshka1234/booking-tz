export default function BookingsPage() {
  return (
    <div className="container-base space-y-8 py-8">
      <div>
        <h1 className="heading-2">Мої бронювання</h1>
        <p className="text-subtitle">Все ваші бронювання в одному місці</p>
      </div>

      <div className="state-empty">
        <div className="state-empty-icon"></div>
        <h3 className="heading-4 mb-2">Бронювань не знайдено</h3>
        <p className="text-caption">
          Перейдіть до кімнат щоб створити нове бронювання
        </p>
      </div>
    </div>
  );
}
