import { createElement, useEffect } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../../Layout/Footer";
import { Navbar } from "../../Layout/Navbar";
import { FaBookOpen, FaChartLine, FaShieldAlt, FaTags } from "react-icons/fa";
import styles from "./Features.module.css";

const toolkitPreviews = [
  {
    title: "Trade Journal",
    description: "Capture every trade and the thinking behind it.",
    icon: FaBookOpen,
  },
  {
    title: "Analytics",
    description: "See the performance patterns in your trading data.",
    icon: FaChartLine,
  },
  {
    title: "Strategies & Tags",
    description: "Keep setups organized for clearer trade reviews.",
    icon: FaTags,
  },
  {
    title: "Trading Rules",
    description: "Review your trades against the rules you define.",
    icon: FaShieldAlt,
  },
];

const featureGroups = [
  {
    title: "Trade History & Journal",
    description:
      "Keep every trade in one searchable history. Record the setup, direction, result, and context while the details are still fresh.",
    image: "/features/tradehistory.png",
    alt: "Kyros Journal trade history screen",
  },
  {
    title: "Trading Analytics & Performance Charts",
    description:
      "Turn your journal into a clearer view of performance with analytics and charts that help you see results across your trading data.",
    image: "/features/analytics.png",
    alt: "Kyros Journal analytics dashboard",
    wideImage: true,
  },
  {
    title: "Strategies & Tags",
    description:
      "Organize trades around the strategies and tags you actually use, making it easier to review which setups and ideas are showing up in your results.",
    image: "/features/tradesetups.png",
    alt: "Kyros Journal strategies and tags screen",
  },
  {
    title: "Trading Rules & Compliance Tracking",
    description:
      "Define rules for risk, trade limits, stop-losses, risk-to-reward, directions, and sessions, then review the trades that violate them.",
    visual: true,
  },
  {
    title: "Trade Comparison",
    description:
      "Compare groups of trades by account, strategy, symbol, direction, tag, market type, status, or grade to find useful differences in performance.",
    image: "/features/compare.png",
    alt: "Kyros Journal trade comparison screen",
  },
  {
    title: "Notes & Trade Screenshots",
    description:
      "Capture the thinking behind your decisions with trading notes and supporting screenshots that keep your review connected to the trade.",
    image: "/features/notes.png",
    alt: "Kyros Journal trading notes screen",
    wideImage: true,
  },
  {
    title: "Trade Import & Account Management",
    description:
      "Bring trades into an account with CSV or JSON import, then keep multiple trading accounts organized from one place.",
    image: "/features/myaccount.png",
    alt: "Kyros Journal account management screen",
  },
];

const setMeta = (selector, attribute, value) => {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
};

export const Features = () => {
  useEffect(() => {
    const title = "Features | Kyros Journal";
    const description =
      "Explore Kyros Journal features for recording trades, analyzing performance, managing strategies, tracking rules, and reviewing your trading decisions.";
    const canonical = "https://kyrosjournal.dev/features";

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute("href", canonical);
  }, []);

  return (
    <div className={styles.container}>
      <Navbar />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>THE KYROS TOOLKIT</p>
            <h1 className={styles.title}>Every tool. One trading workflow.</h1>
            <p className={styles.intro}>
              Connect trade journaling, performance analytics, strategy
              organization, and trading-rule review in one focused workspace.
            </p>
            <a href="#feature-list-title" className={styles.primaryBtn}>
              Explore the toolkit
            </a>
          </div>
          <div className={styles.previewGrid} aria-label="Kyros Journal toolkit previews">
            {toolkitPreviews.map(({ title, description, icon: Icon }) => (
              <div className={styles.previewCard} key={title}>
                <span className={styles.previewIcon} aria-hidden="true">
                  {createElement(Icon)}
                </span>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.features} aria-labelledby="feature-list-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The journal, connected</p>
            <h2 id="feature-list-title">A clearer process from entry to review.</h2>
          </div>
          {featureGroups.map((feature, index) => (
            <article
              className={`${styles.feature} ${feature.wideImage ? styles.featureWideImage : ""}`}
              key={feature.title}
            >
              <div className={styles.featureCopy}>
                <span className={styles.number}>0{index + 1}</span>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
              <div className={styles.visual}>
                {feature.visual ? (
                  <div className={styles.rulesVisual} aria-label="Trading rules and compliance overview">
                    <div className={styles.visualHeader}><span>Rule checks</span><b>Active</b></div>
                    {["Maximum risk per trade", "Required stop-loss", "Allowed sessions"].map((rule) => (
                      <div className={styles.ruleRow} key={rule}>
                        <span>{rule}</span><strong>✓</strong>
                      </div>
                    ))}
                    <div className={styles.violation}><span>Compliance summary</span><b>Review by trade</b></div>
                  </div>
                ) : (
                  <img src={feature.image} alt={feature.alt} loading="lazy" />
                )}
              </div>
            </article>
          ))}
        </section>

        <section className={styles.finalCta}>
          <h2>Make your next review more useful.</h2>
          <p>Start with the data you already have and build a journal around your process.</p>
          <Link to="/register" className={styles.primaryBtn}>Create Your Journal</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};
