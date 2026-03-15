import { useState, useRef } from 'react'
import './App.css'

interface TradeRow {
  serial: number
  capitalBefore: number
  profitOrLoss: number
  capitalAfter: number
  isProfit: boolean
}

function simulateTrades(
  initialCapital: number,
  numTrades: number,
  successPct: number,
  profitPct: number,
  stopLossPct: number
): TradeRow[] {
  const rows: TradeRow[] = []
  let capital = initialCapital
  const successRate = successPct / 100

  // Use a seeded-like deterministic distribution based on success %
  // Spread wins/losses evenly using round-robin based on probability
  for (let i = 0; i < numTrades; i++) {
    const capitalBefore = capital
    // Deterministic win/loss based on position in sequence
    // Every 1/successRate trades, we get successRate wins
    const threshold = (i * successRate) % 1
    const nextThreshold = ((i + 1) * successRate) % 1
    const isProfit = nextThreshold < threshold || nextThreshold === 0

    const profitOrLoss = isProfit
      ? capitalBefore * (profitPct / 100)
      : -capitalBefore * (stopLossPct / 100)

    const capitalAfter = capitalBefore + profitOrLoss

    rows.push({
      serial: i + 1,
      capitalBefore,
      profitOrLoss,
      capitalAfter,
      isProfit,
    })

    capital = capitalAfter
  }

  return rows
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function InputField({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step ?? 1}
          className="input-field"
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
    </div>
  )
}

export default function App() {
  const [initialCapital, setInitialCapital] = useState('100000')
  const [numTrades, setNumTrades] = useState('20')
  const [successPct, setSuccessPct] = useState('55')
  const [profitPct, setProfitPct] = useState('3')
  const [stopLossPct, setStopLossPct] = useState('1.5')
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [hasRun, setHasRun] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const handleRun = () => {
    const ic = parseFloat(initialCapital)
    const nt = parseInt(numTrades)
    const sp = parseFloat(successPct)
    const pp = parseFloat(profitPct)
    const sl = parseFloat(stopLossPct)

    if (!ic || !nt || !sp || !pp || !sl) return

    const result = simulateTrades(ic, nt, sp, pp, sl)
    setTrades(result)
    setHasRun(true)
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const finalCapital = trades.length > 0 ? trades[trades.length - 1].capitalAfter : 0
  const totalPnL = finalCapital - parseFloat(initialCapital || '0')
  const totalPnLPct = parseFloat(initialCapital) > 0 ? (totalPnL / parseFloat(initialCapital)) * 100 : 0
  const winCount = trades.filter(t => t.isProfit).length
  const lossCount = trades.length - winCount

  return (
    <div className="app">
      <div className="scanline" />

      <header className="header">
        <div className="header-tag">TRADING STRATEGY SIMULATOR</div>
        <h1 className="header-title">
          <span className="title-bracket">[</span>
          CAPITAL GROWTH
          <span className="title-bracket">]</span>
        </h1>
        <p className="header-sub">PROJECT YOUR TRADING PERFORMANCE</p>
      </header>

      <main className="main">
        <section className="config-panel">
          <div className="panel-label">▸ PARAMETERS</div>
          <div className="inputs-grid">
            <InputField
              label="INITIAL CAPITAL"
              value={initialCapital}
              onChange={setInitialCapital}
              suffix="₹"
              min={1}
              step={1000}
            />
            <InputField
              label="NO. OF TRADES"
              value={numTrades}
              onChange={setNumTrades}
              min={1}
              max={500}
            />
            <InputField
              label="SUCCESS RATE"
              value={successPct}
              onChange={setSuccessPct}
              suffix="%"
              min={0}
              max={100}
              step={0.5}
            />
            <InputField
              label="PROFIT TARGET"
              value={profitPct}
              onChange={setProfitPct}
              suffix="%"
              min={0.1}
              step={0.1}
            />
            <InputField
              label="STOP LOSS"
              value={stopLossPct}
              onChange={setStopLossPct}
              suffix="%"
              min={0.1}
              step={0.1}
            />
          </div>
          <button className="run-btn" onClick={handleRun}>
            <span className="run-icon">▶</span>
            RUN SIMULATION
          </button>
        </section>

        {hasRun && trades.length > 0 && (
          <>
            <section className="summary-panel" ref={tableRef}>
              <div className="panel-label">▸ SUMMARY</div>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="card-label">FINAL CAPITAL</div>
                  <div className={`card-value ${finalCapital >= parseFloat(initialCapital) ? 'profit' : 'loss'}`}>
                    ₹{fmt(finalCapital)}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-label">NET P&L</div>
                  <div className={`card-value ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{fmt(totalPnL)}
                    <span className="card-pct"> ({totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%)</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-label">WIN / LOSS</div>
                  <div className="card-value neutral">
                    <span className="profit">{winCount}W</span>
                    <span className="separator"> · </span>
                    <span className="loss">{lossCount}L</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-label">RISK:REWARD</div>
                  <div className="card-value neutral">
                    1 : {(parseFloat(profitPct) / parseFloat(stopLossPct)).toFixed(2)}
                  </div>
                </div>
              </div>
            </section>

            <section className="table-section">
              <div className="panel-label">▸ TRADE LOG</div>
              <div className="table-wrapper">
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>CAPITAL BEFORE</th>
                      <th>P&L</th>
                      <th>CAPITAL AFTER</th>
                      <th>OUTCOME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((row) => (
                      <tr
                        key={row.serial}
                        className={row.isProfit ? 'row-profit' : 'row-loss'}
                      >
                        <td className="td-serial">{row.serial.toString().padStart(2, '0')}</td>
                        <td className="td-capital">₹{fmt(row.capitalBefore)}</td>
                        <td className={`td-pnl ${row.isProfit ? 'profit' : 'loss'}`}>
                          {row.isProfit ? '+' : ''}₹{fmt(row.profitOrLoss)}
                          <span className="pct-badge">
                            {row.isProfit ? '+' : ''}{((row.profitOrLoss / row.capitalBefore) * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="td-capital">₹{fmt(row.capitalAfter)}</td>
                        <td className="td-outcome">
                          <span className={`badge ${row.isProfit ? 'badge-profit' : 'badge-loss'}`}>
                            {row.isProfit ? '▲ WIN' : '▼ LOSS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <span>TRADE-ANALYZE · FOR EDUCATIONAL USE ONLY</span>
      </footer>
    </div>
  )
}