import { Check } from 'lucide-react'

const quests = [
  {
    title: 'Juega un set hoy',
    reward: '+120 XP',
    progress: 50,
    complete: false,
  },
  {
    title: 'Gana 50 XP',
    reward: '+50 XP',
    progress: 100,
    complete: true,
  },
  {
    title: 'Registra tu resultado',
    reward: '+30 XP',
    progress: 30,
    complete: false,
  },
]

function DailyQuests() {
  return (
    <section className="border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-open-muted">Retos diarios</p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            Completa tu ciclo
          </h2>
        </div>
        <span className="border border-open-light bg-open-bg px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          2/3
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {quests.map((quest) => (
          <article key={quest.title} className="grid gap-3">
            <div className="flex items-start gap-3">
              <span
                className={[
                  'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                  quest.complete
                    ? 'border-open-dark bg-open-dark text-white'
                    : 'border-open-light bg-open-surface text-transparent',
                ].join(' ')}
              >
                <Check size={14} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate text-sm font-semibold text-open-ink">
                    {quest.title}
                  </h3>
                  <span className="shrink-0 text-xs font-semibold text-open-muted">
                    {quest.reward}
                  </span>
                </div>
                <div className="mt-2 h-2 border border-open-light bg-open-light">
                  <div
                    className="h-full bg-open-dark"
                    style={{ width: `${quest.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DailyQuests
