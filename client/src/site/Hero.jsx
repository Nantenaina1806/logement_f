import { Search } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-amber-950/50" />

      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <div className="max-w-3xl">
          <span className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur sm:text-sm">
            Plateforme immobilière professionnelle — Fianarantsoa
          </span>
          <h1 className="text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
            Trouvez un logement fiable à Fianarantsoa, rapidement et simplement.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
            Consultez les offres disponibles, filtrez selon vos besoins et envoyez directement votre demande à l’équipe.
          </p>
          <a
            href="#logements"
            className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-amber-600 px-6 py-3 text-base font-bold text-white shadow-xl transition hover:bg-amber-700"
          >
            <Search size={18} /> Voir les logements
          </a>
        </div>
      </div>
    </section>
  );
}
