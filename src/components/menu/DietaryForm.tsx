'use client';
import { useState, useTransition } from 'react';
import { saveAllDietaryPreferences, type DietaryResponse } from '@/app/actions/menu';
import { useLanguage } from '@/components/LanguageProvider';

const DIET_KEYS = ['vegan', 'vegetarian', 'gluten_free'] as const;
type DietKey = (typeof DIET_KEYS)[number];

type PersonEntry = {
  uid: string;
  name: string;
  vegan: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  notes: string;
};

const MAX_PEOPLE = 5;

function blankEntry(): PersonEntry {
  return {
    uid: Math.random().toString(36).slice(2),
    name: '',
    vegan: false,
    vegetarian: false,
    gluten_free: false,
    notes: '',
  };
}

function fromResponse(r: DietaryResponse): PersonEntry {
  return {
    uid: r.id,
    name: r.guest_name,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    gluten_free: r.gluten_free,
    notes: r.notes ?? '',
  };
}

export default function DietaryForm({ existing }: { existing: DietaryResponse[] }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<PersonEntry[]>(
    existing.length > 0 ? existing.map(fromResponse) : [blankEntry()]
  );

  function update(index: number, patch: Partial<PersonEntry>) {
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    setSaved(false);
  }

  function addPerson() {
    if (people.length < MAX_PEOPLE) setPeople((prev) => [...prev, blankEntry()]);
  }

  function removePerson(index: number) {
    setPeople((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (people.some((p) => !p.name.trim())) {
      setError(t.menu.nameRequired);
      return;
    }
    setSaved(false);
    setError('');
    startTransition(async () => {
      const result = await saveAllDietaryPreferences(
        people.map((p) => ({
          guest_name: p.name.trim(),
          vegan: p.vegan,
          vegetarian: p.vegetarian,
          gluten_free: p.gluten_free,
          notes: p.notes.trim() || null,
        }))
      );
      if (result.ok) {
        setSaved(true);
        window.dispatchEvent(new Event('dietary-preferences-saved'));
      } else setError(result.error ?? t.menu.genericError);
    });
  }

  return (
    <section id="food-preferences" className="mt-12 scroll-mt-20 border-t border-greige pt-12">
      <h2 className="font-body text-4xl text-green mb-2">{t.menu.dietaryTitle}</h2>
      <p className="font-body text-charcoal/70 mb-8">{t.menu.dietaryIntro}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {people.map((person, index) => (
          <div key={person.uid} className="border border-greige rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <label className="font-body font-semibold text-charcoal/80 shrink-0 w-14">
                {t.menu.personNameLabel}
              </label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => update(index, { name: e.target.value })}
                placeholder={t.menu.personNamePlaceholder}
                maxLength={50}
                className="flex-1 border border-greige rounded-lg px-3 py-2 font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green"
              />
              {people.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePerson(index)}
                  className="font-body text-sm text-red-500 hover:text-red-700 transition-colors shrink-0"
                >
                  {t.menu.removePerson}
                </button>
              )}
            </div>

            <fieldset>
              <legend className="font-body font-semibold text-charcoal/80 mb-3">
                {t.menu.dietLegend}
              </legend>
              <div className="flex flex-wrap gap-4">
                {DIET_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={person[key as DietKey]}
                      onChange={(e) => update(index, { [key]: e.target.checked })}
                      className="w-5 h-5 accent-green rounded"
                    />
                    <span className="font-body text-charcoal/80 group-hover:text-green transition-colors">
                      {t.menu.dietLabels[key]}
                      {t.menu.dietSuffix}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="block font-body font-semibold text-charcoal/80 mb-2">
                {t.menu.notesLabel}
              </label>
              <textarea
                rows={2}
                value={person.notes}
                onChange={(e) => update(index, { notes: e.target.value })}
                placeholder={t.menu.notesPlaceholder}
                className="w-full border border-greige rounded-lg px-4 py-3 font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green resize-none"
              />
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3 mt-2">
          {people.length < MAX_PEOPLE && (
            <button
              type="button"
              onClick={addPerson}
              className="font-body font-semibold text-green border-2 border-green rounded-lg px-8 py-3 hover:bg-green-pale transition-colors"
            >
              {t.menu.addPerson}
            </button>
          )}

          {saved && <p className="font-body text-green text-sm">{t.menu.saved}</p>}
          {error && <p className="font-body text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="bg-green text-white font-body font-semibold px-8 py-3 rounded-lg hover:bg-green-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? t.menu.saving : t.menu.save}
          </button>
        </div>
      </form>
    </section>
  );
}
