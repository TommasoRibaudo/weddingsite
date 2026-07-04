'use client';

import { useLanguage } from '@/components/LanguageProvider';

export default function MenuDisplay() {
  const { t } = useLanguage();

  if (!t.menu.courses.length) return null;

  return (
    <section className="mb-12">
      <div className="space-y-8">
        {t.menu.courses.map((course) => (
          <div key={course.name} className="border-b border-greige pb-8 last:border-0 last:pb-0">
            <h2 className="font-body font-semibold text-xs uppercase tracking-widest text-green mb-4">
              {course.name}
            </h2>
            <div className="space-y-4">
              {course.items.map((item, index) => (
                <div key={`${course.name}-${item.name}-${index}`}>
                  <p className="font-body text-lg text-charcoal">{item.name}</p>
                  {item.description && (
                    <p className="font-body text-sm text-charcoal/65 italic">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
