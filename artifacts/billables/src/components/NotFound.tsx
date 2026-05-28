import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-md w-full text-center p-10 rounded-2xl bg-stone-50 border border-stone-200 shadow-xl">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-stone-100 text-stone-400">
          <Compass className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="text-primary font-bold text-xs uppercase tracking-widest mb-2">
          404 Not Found
        </div>
        <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">
          Lost in the void.
        </h1>
        <p className="text-stone-500 mb-8 leading-relaxed text-sm">
          This record or endpoint doesn't exist within the current workspace.
        </p>
        <Link
          href="/overview"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
