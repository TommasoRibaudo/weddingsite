import type { DietaryResponse } from '@/app/actions/menu';

function DietBadge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-green-muted text-green text-xs font-body font-semibold px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

export default function AdminDietaryList({ responses }: { responses: DietaryResponse[] }) {
  if (!responses.length) {
    return (
      <p className="font-body text-gray-500 italic">No dietary preferences submitted yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((r) => {
        const diets: string[] = [];
        if (r.vegan) diets.push('Vegan');
        if (r.vegetarian) diets.push('Vegetarian');
        if (r.gluten_free) diets.push('Gluten-free');

        return (
          <div
            key={r.id}
            className="border border-greige rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-gray-800">{r.guest_name}</p>
              {diets.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {diets.map((d) => (
                    <DietBadge key={d} label={d} />
                  ))}
                </div>
              )}
              {r.notes && (
                <p className="font-body text-sm text-gray-600 mt-1 italic">{r.notes}</p>
              )}
              {diets.length === 0 && !r.notes && (
                <p className="font-body text-sm text-gray-400 italic mt-1">No restrictions</p>
              )}
            </div>
            <p className="font-body text-xs text-gray-400 shrink-0">
              {new Date(r.updated_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
