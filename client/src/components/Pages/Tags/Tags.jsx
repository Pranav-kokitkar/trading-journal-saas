import { Tags as TagsManagement } from "../TradeSetups/Tags/Tags";

export const Tags = () => (
  <section className="app-page">
    <header className="app-page-heading">
      <h1 className="app-page-title">Tags</h1>
      <p className="app-page-subtitle">Organize your trades with custom labels.</p>
    </header>
    <TagsManagement showHeading={false} />
  </section>
);
