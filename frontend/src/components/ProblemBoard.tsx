export default function ProblemBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Sample Problems</h2>
        <ul className="space-y-3">
          <li className="rounded-xl border border-slate-200 p-4">Basic Arrays (Explorer)</li>
          <li className="rounded-xl border border-slate-200 p-4">Circuit Validation (ECE)</li>
          <li className="rounded-xl border border-slate-200 p-4">Graph Traversal (Apprentice)</li>
        </ul>
      </div>
    </div>
  );
}
