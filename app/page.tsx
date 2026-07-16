"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container-sm space-y-8">
        <div className="text-center space-y-4">
          <h1 className="heading-1">MeetingRoom</h1>
          <p className="text-subtitle">
            Просто та зручно бронюйте переговорні кімнати
          </p>
        </div>

        <p className="text-subtitle text-center max-w-xl mx-auto">
          Керуйте доступністю кімнат, організуйте бронювання та запрошуйте колег
          все в одному місці
        </p>

        {!loading && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <>
                <Link href="/rooms" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">
                    Мої кімнати
                  </Button>
                </Link>
                <Link href="/rooms" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    Перейти до бронювань
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">
                    Почати роботу
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    Вхід в аккаунт
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}

        <div className="layout-grid-3 pt-8">
          <div className="space-y-2 text-center">
            <h3 className="heading-4">Легко бронювати</h3>
            <p className="text-caption">
              Виберіть кімнату, дату та час за кілька кліків
            </p>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="heading-4">Запрошуйте колег</h3>
            <p className="text-caption">
              Добавляйте членів кімнати та керуйте доступом
            </p>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="heading-4">Без конфліктів</h3>
            <p className="text-caption">
              Система автоматично перевіряє доступність кімнати
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
