import { Strategy } from "../TradeSetups/Strategy/Strategy";

export const Strategies = () => (
  <section className="app-page">
    <header className="app-page-heading">
      <h1 className="app-page-title">Strategies</h1>
      <p className="app-page-subtitle">Create and manage your trading strategies.</p>
    </header>
    <Strategy showHeading={false} />
  </section>
);
