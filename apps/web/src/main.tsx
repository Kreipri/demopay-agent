import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownLeft,
  Check,
  ShieldCheck,
  Wallet,
  Activity,
  Layers,
  RefreshCw,
  Play,
  LockKeyhole,
  X,
  ExternalLink,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ChevronRight,
  Command,
  Link2,
} from "lucide-react";
import type { Decision, RequestItem, Snapshot } from "@demopay/shared";
import "./style.css";
type Data = { requests: RequestItem[]; snapshot: Snapshot };
const explorer = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;
const shorten = (s?: string) =>
  s ? `${s.slice(0, 6)}…${s.slice(-6)}` : "Not connected";
const fmt = (s?: string) =>
  Number(s ?? 0).toLocaleString(undefined, { maximumFractionDigits: 7 });
function App() {
  const [data, setData] = useState<Data | null>(null),
    [decisions, setDecisions] = useState<Decision[]>([]),
    [selected, setSelected] = useState("req-001"),
    [tab, setTab] = useState("Overview"),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [modal, setModal] = useState(false),
    [token, setToken] = useState(
      () => sessionStorage.getItem("demopay-operator") ?? "",
    ),
    [checkout, setCheckout] = useState<{
      id: string;
      url: string;
      status?: string;
    } | null>(null);
  async function api(path: string, body?: unknown) {
    const res = await fetch(`/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const value = await res.json();
    if (!res.ok)
      throw new Error(
        value.error ?? value.snapshot?.error ?? "The service is unavailable.",
      );
    return value;
  }
  async function refresh() {
    const res = await fetch("/api/state");
    const value = await res.json();
    setData(value);
    if (!res.ok)
      throw new Error(
        value.snapshot?.error ?? "Testnet connection unavailable",
      );
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function task(name: string, fn: () => Promise<void>) {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete action.");
    } finally {
      setBusy("");
    }
  }
  const snap = data?.snapshot,
    live = !!snap?.live,
    configured = !!snap?.configured;
  const item = data?.requests.find((r) => r.id === selected),
    decision = decisions.find((d) => d.requestId === selected);
  const authorized = !!snap?.proofs.some(
    (p) => p.kind === "payment.authorized",
  );
  const claimed = !!snap?.proofs.some((p) => p.kind === "payment.claimed");
  async function reviewAll() {
    await task("review", async () => {
      const result = await api("/agent/review", {});
      setDecisions(result.decisions);
      setMessage(
        result.mode === "preview"
          ? "Preview complete. These are sample decisions; no money moved."
          : "Agent review complete. Decisions use the live Noir spending policy.",
      );
    });
  }
  async function run() {
    if (!token) {
      setModal(true);
      return;
    }
    await task("pay", async () => {
      const result = await api("/agent/run", { requestId: selected });
      setDecisions((prev) => [
        ...prev.filter((d) => d.requestId !== selected),
        result.decision,
      ]);
      setMessage(
        result.hash
          ? "Payment authorized on Testnet. The merchant can now collect it."
          : result.decision.reasons.join(" "),
      );
      await refresh();
    });
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="DemoPay home">
          <span className="brand-icon">
            <Layers size={23} />
          </span>
          demopay<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">D</span>
          <div>
            <strong>Demo workspace</strong>
            <small>Payment operations</small>
          </div>
          <span className="workspace-arrow">⌄</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            [Layers, "Overview"],
            [Wallet, "Payment requests"],
            [Activity, "Payment trail"],
            [Link2, "Connections"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Layers;
            return (
              <button
                key={String(label)}
                className={tab === label ? "nav-item active" : "nav-item"}
                onClick={() => setTab(String(label))}
              >
                <I size={18} />
                {String(label)}
                {label === "Payment requests" && (
                  <span className="nav-count">3</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <div className="mini-agent">
            <span className="status-dot" /> A smaller permission.
            <br />A clearer payment.
          </div>
          <p>Every payment stays within the budget you approve.</p>
          <span className="tiny">POWERED BY NOIR + VELO</span>
        </div>
        <div className="sidebar-bottom">
          <div className="network-badge">
            <span /> STELLAR TESTNET
          </div>
          <p>Practice funds. Real payment logic.</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} /> <strong>{tab}</strong>
          </div>
          <div className="top-actions">
            <span className="connection">
              <span className={live ? "status-dot" : "status-dot muted"} />
              {live
                ? "Testnet connected"
                : configured
                  ? "Connection needs attention"
                  : "Preview workspace"}
            </span>
            <button
              className="icon-button"
              aria-label="Refresh Testnet state"
              disabled={!!busy}
              onClick={() => task("refresh", refresh)}
            >
              <RefreshCw
                size={17}
                className={busy === "refresh" ? "spin" : ""}
              />
            </button>
            <button
              className="avatar"
              title="Operator access"
              aria-label="Open operator access"
              onClick={() => setModal(true)}
            >
              <LockKeyhole size={16} />
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR PAYMENT CONTROL ROOM</div>
              <h1>
                {tab === "Overview" ? "Good decisions. Clear payments." : tab}
              </h1>
              <p>
                {tab === "Overview"
                  ? "Give your agent a budget. See every decision. Follow the money."
                  : tab === "Connections"
                    ? "The tools behind each permission, payment, and confirmation."
                    : tab === "Payment trail"
                      ? "Follow the difference between authorization and collection."
                      : "One supplier, three requests, and rules the agent must follow."}
              </p>
            </div>
            <span className="date-label">SANDBOX / 01</span>
          </div>
          {error && (
            <div className="notice error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {message && (
            <div className="notice success" role="status">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}
          {!configured && (
            <div className="preview-banner">
              <ShieldCheck size={18} />
              <span>
                <strong>You’re exploring a preview.</strong> Requests and
                balances below are sample data. Connect a Testnet sandbox to
                move practice funds.
              </span>
            </div>
          )}
          {(tab === "Overview" || tab === "Payment requests") && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-label">
                    <span className="pulse" /> CONSTRAINED PAYMENT AGENT
                  </div>
                  <h2>
                    Your rules.
                    <br />
                    Its next move.
                  </h2>
                  <p>
                    The agent checks each request against your supplier list,
                    invoice history, and spending permission before it acts.
                  </p>
                  <button
                    className="button light"
                    disabled={!!busy || !data}
                    onClick={reviewAll}
                  >
                    {busy === "review" ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <Play size={15} />
                    )}{" "}
                    Review all requests <ArrowRight size={17} />
                  </button>
                </div>
                <div
                  className="hero-diagram"
                  aria-label="Payment flow: request, agent checks, Noir authorization, merchant collection"
                >
                  <div className="diagram-top">
                    <span>PAYMENT REQUEST</span>
                    <span className="diagram-chip">INV-1042</span>
                  </div>
                  <div className="diagram-line">
                    <div className="diagram-node">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <strong>Permission before payment</strong>
                      <small>Supplier · Invoice · Spending limit</small>
                    </div>
                    <span className="diagram-check">
                      <Check size={15} />
                    </span>
                  </div>
                  <div className="diagram-divider">
                    <span />
                  </div>
                  <div className="diagram-bottom">
                    <div>
                      <small>APPROVED AMOUNT</small>
                      <strong>
                        3.00 <span>XLM</span>
                      </strong>
                    </div>
                    <span className="diagram-arrow">
                      <ArrowUpRight size={25} />
                    </span>
                  </div>
                  <div className="hero-footnote">
                    {live
                      ? "LIVE POLICY · NOIR TESTNET"
                      : "ILLUSTRATIVE EXAMPLE · NO MONEY MOVED"}
                  </div>
                </div>
              </section>
              <section className="metrics">
                <Metric
                  title="Available budget"
                  value={live ? fmt(snap?.balance) : "20.00"}
                  note={live ? "Held in Noir escrow" : "Sample escrow balance"}
                  icon={<Wallet size={17} />}
                />
                <Metric
                  title="Limit per payment"
                  value={live ? fmt(snap?.cap) : "5.00"}
                  note="Enforced by Noir permission"
                  icon={<ShieldCheck size={17} />}
                />
                <Metric
                  title="Pending collection"
                  value={live ? fmt(snap?.pending) : "0.00"}
                  note="Authorized, awaiting merchant"
                  icon={<Clock3 size={17} />}
                />
                <Metric
                  title="Requests to review"
                  value="3"
                  note="1 supplier · 2 unique invoices"
                  icon={<Layers size={17} />}
                  unit=""
                />
              </section>
              <div className="section-header">
                <div>
                  <h3>
                    Payment requests <span className="count">3</span>
                  </h3>
                  <p>
                    Fictional supplier invoices for this Testnet demonstration.
                  </p>
                </div>
                <span className="quiet-label">
                  RULE-BASED AGENT · NO LLM COST
                </span>
              </div>
              <section className="request-layout">
                <div className="request-table">
                  <div className="table-head">
                    <span>SUPPLIER / INVOICE</span>
                    <span>AMOUNT</span>
                    <span>DECISION</span>
                  </div>
                  {data?.requests.map((r, index) => {
                    const d = decisions.find((x) => x.requestId === r.id);
                    return (
                      <button
                        key={r.id}
                        className={`request-row ${selected === r.id ? "selected" : ""}`}
                        onClick={() => setSelected(r.id)}
                      >
                        <div className="supplier">
                          <span className={`supplier-avatar shade-${index}`}>
                            O
                          </span>
                          <div>
                            <strong>{r.vendor}</strong>
                            <small>
                              {r.invoice}{" "}
                              <span>
                                ·{" "}
                                {index === 2
                                  ? "Resubmitted"
                                  : "Supplier payment"}
                              </span>
                            </small>
                          </div>
                        </div>
                        <div className="row-amount">
                          {Number(r.amount).toFixed(2)} <small>XLM</small>
                        </div>
                        <div>
                          <span
                            className={`status-pill ${r.id === "req-001" && authorized ? "paid" : d?.action === "hold" ? "held" : d?.action === "pay" ? "eligible" : "waiting"}`}
                          >
                            {r.id === "req-001" && authorized
                              ? claimed
                                ? "Collected"
                                : "Authorized"
                              : d?.action === "hold"
                                ? "Held"
                                : d?.action === "pay"
                                  ? "Eligible"
                                  : "Unreviewed"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {!data && (
                    <div className="empty">Loading payment requests…</div>
                  )}
                  <div className="table-footer">
                    <ShieldCheck size={14} /> The contract enforces spending
                    limits. Your app checks business rules.
                  </div>
                </div>
                <aside className="decision-card">
                  <div className="decision-heading">
                    <span className="eyebrow">AGENT WORKSPACE</span>
                    <Command size={17} />
                  </div>
                  <h3>{item?.invoice ?? "Choose a request"}</h3>
                  <p className="description">{item?.description}</p>
                  <div className="evidence">
                    <span>DELIVERY EVIDENCE</span>
                    <p>{item?.evidence}</p>
                    <small>
                      Demonstration fixture · not independently verified
                    </small>
                  </div>
                  <div className="decision-reasons">
                    {decision ? (
                      decision.reasons.map((reason, i) => (
                        <div key={i} className="reason">
                          {decision.action === "pay" ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <AlertCircle size={16} />
                          )}
                          <span>{reason}</span>
                        </div>
                      ))
                    ) : (
                      <div className="no-decision">
                        <Activity size={22} />
                        <p>
                          Run a review to see the agent’s reasoning before any
                          payment.
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    className="button primary full"
                    disabled={
                      !!busy || !live || (selected === "req-001" && authorized)
                    }
                    onClick={run}
                  >
                    {busy === "pay" ? (
                      <RefreshCw size={16} className="spin" />
                    ) : (
                      <Play size={16} />
                    )}{" "}
                    {selected === "req-001" && authorized
                      ? "Payment already authorized"
                      : "Run agent on this request"}
                    <ArrowRight size={16} />
                  </button>
                  <p className="decision-foot">
                    {live
                      ? "The agent rechecks the live policy before acting."
                      : "Live execution requires a configured Testnet sandbox."}
                  </p>
                </aside>
              </section>
            </>
          )}
          {(tab === "Overview" || tab === "Payment trail") && (
            <section className="trail-section">
              <div className="section-header">
                <div>
                  <h3>A payment has two milestones</h3>
                  <p>
                    Authorization reserves the amount for a merchant. Collection
                    transfers it.
                  </p>
                </div>
                <span className="outline-label">NOIR PAYMENT FLOW</span>
              </div>
              <div className="milestones">
                <Milestone
                  number="01"
                  title="Budget approved"
                  description="The owner funds escrow and grants spending permission."
                  done={live}
                />
                <Milestone
                  number="02"
                  title="Payment authorized"
                  description="The agent allocates 3 XLM to the merchant."
                  done={authorized}
                />
                <Milestone
                  number="03"
                  title="Merchant collects"
                  description="The merchant claims the pending payment."
                  done={claimed}
                />
              </div>
              <div className="ledger-list">
                {snap?.proofs.length ? (
                  snap.proofs.map((p, i) => (
                    <a
                      key={p.hash + p.kind + i}
                      className="ledger-row"
                      href={explorer(p.hash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="ledger-icon">
                        <Check size={16} />
                      </span>
                      <div>
                        <strong>{p.kind.replaceAll(".", " · ")}</strong>
                        <small>Confirmed Testnet transaction</small>
                      </div>
                      <code>{shorten(p.hash)}</code>
                      <ExternalLink size={15} />
                    </a>
                  ))
                ) : (
                  <div className="empty">
                    <Activity size={22} />
                    <p>No verified transaction evidence loaded.</p>
                    <small>
                      {configured
                        ? "Refresh after an operation confirms."
                        : "Connect your sandbox to start a real Testnet payment trail."}
                    </small>
                  </div>
                )}
              </div>
              <div className="claim-bar">
                <div>
                  <strong>Merchant collection</strong>
                  <p>Only collects pending XLM for the sandbox merchant.</p>
                </div>
                <button
                  className="button secondary"
                  disabled={!!busy || !live || Number(snap?.pending ?? 0) <= 0}
                  onClick={() => {
                    if (!token) {
                      setModal(true);
                      return;
                    }
                    task("claim", async () => {
                      await api("/merchant/claim", {});
                      setMessage("Merchant collection confirmed on Testnet.");
                      await refresh();
                    });
                  }}
                >
                  <ArrowDownLeft size={16} />
                  {busy === "claim" ? "Collecting…" : "Collect pending payment"}
                </button>
              </div>
            </section>
          )}
          {(tab === "Overview" || tab === "Connections") && (
            <>
              <div className="section-header">
                <div>
                  <h3>Two tools. Different jobs.</h3>
                  <p>Your application is where Noir and Velo meet.</p>
                </div>
              </div>
              <section className="integration-grid">
                <div className="integration-card">
                  <div className="integration-top">
                    <div className="integration-logo noir">N</div>
                    <span
                      className={`status-pill ${live ? "eligible" : "waiting"}`}
                    >
                      {live ? "Connected" : "Setup required"}
                    </span>
                  </div>
                  <h3>Noir handles agent spending.</h3>
                  <p>
                    Device identity, delegated permission, and escrow. All
                    contract calls use the Noir SDK.
                  </p>
                  <div className="integration-detail">
                    <span>Network</span>
                    <strong>Stellar Testnet</strong>
                  </div>
                  <div className="integration-detail">
                    <span>Agent</span>
                    <code>{shorten(snap?.agent)}</code>
                  </div>
                  <div className="integration-detail">
                    <span>Merchant</span>
                    <code>{shorten(snap?.merchant)}</code>
                  </div>
                </div>
                <div className="integration-card">
                  <div className="integration-top">
                    <div className="integration-logo velo">V</div>
                    <span
                      className={`status-pill ${snap?.veloConfigured ? "eligible" : "waiting"}`}
                    >
                      {snap?.veloConfigured
                        ? "Key configured"
                        : "Setup required"}
                    </span>
                  </div>
                  <h3>Velo handles contributions.</h3>
                  <p>
                    Create a 10 XLM Testnet contribution checkout and verify its
                    payment status with Velo.
                  </p>
                  <div className="flow-note">
                    A contribution goes to your Velo receiver. Moving it into
                    Noir escrow is a separate owner action.
                  </div>
                  <button
                    className="text-button"
                    disabled={!!busy || !snap?.veloConfigured}
                    onClick={() => {
                      if (!token) {
                        setModal(true);
                        return;
                      }
                      task("checkout", async () => {
                        const result = await api("/velo/checkout", {});
                        setCheckout({
                          id: result.paymentIntentId,
                          url: result.checkoutUrl,
                        });
                      });
                    }}
                  >
                    Create contribution checkout <ArrowUpRight size={17} />
                  </button>
                  {checkout && (
                    <div className="checkout-result">
                      <a href={checkout.url} target="_blank" rel="noreferrer">
                        Open hosted checkout <ExternalLink size={13} />
                      </a>
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          task("status", async () => {
                            const intent = await api(
                              `/velo/intents/${checkout.id}`,
                            );
                            setCheckout({ ...checkout, status: intent.status });
                          })
                        }
                      >
                        Verify status
                      </button>
                      <span>{checkout.status ?? "Status not checked"}</span>
                    </div>
                  )}
                </div>
              </section>
              {tab === "Connections" && (
                <section className="contracts">
                  <h3>Deployed contracts</h3>
                  <p>
                    Pinned to the Builder Handbook supplied for this submission.
                  </p>
                  {Object.entries(snap?.contracts ?? {}).map(([name, id]) => (
                    <div key={name}>
                      <strong>{name}</strong>
                      <a
                        href={`https://stellar.expert/explorer/testnet/contract/${id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <code>{id}</code>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
          <footer>
            <span>
              demopay<span className="brand-dot">.</span>{" "}
              <span className="footer-tag">
                A payment decision you can follow.
              </span>
            </span>
            <span>
              Testnet only <span className="footer-dot">·</span> No real funds
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operator-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close operator access"
              onClick={() => setModal(false)}
            >
              <X size={19} />
            </button>
            <span className="modal-symbol">
              <LockKeyhole size={24} />
            </span>
            <h2 id="operator-title">Operator access</h2>
            <p>
              Only the operator can run the agent, collect funds, or create
              contribution checkouts. Everyone can explore the public workspace.
            </p>
            <label htmlFor="operator-token">Operator token</label>
            <input
              id="operator-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your sandbox operator token"
            />
            <button
              className="button primary full"
              onClick={() => {
                sessionStorage.setItem("demopay-operator", token);
                setModal(false);
                setMessage(
                  "Operator token saved for this tab. It will be checked when you run an action.",
                );
              }}
            >
              Use operator token <ArrowRight size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => {
                setToken("");
                sessionStorage.removeItem("demopay-operator");
                setModal(false);
              }}
            >
              Clear access
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Metric({
  title,
  value,
  note,
  icon,
  unit = "XLM",
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  unit?: string;
}) {
  return (
    <article className="metric">
      <div className="metric-title">
        {title}
        {icon}
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <small>{note}</small>
    </article>
  );
}
function Milestone({
  number,
  title,
  description,
  done,
}: {
  number: string;
  title: string;
  description: string;
  done: boolean;
}) {
  return (
    <div className={`milestone ${done ? "done" : ""}`}>
      <span className="milestone-number">
        {done ? <Check size={16} /> : number}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
