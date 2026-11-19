// Anticipated questions and open clarifications. Illustrative answers drawn from the proposal.

export const FAQ_CATS = ["All", "Functional", "SAP", "Security", "Architecture", "Operations", "Commercial"];

const F = (cat, q, a) => ({ cat, q, a });
export const FAQS = [
  F("Functional", "Can a customer use both the ERP connector and CBQ Net Banking?", "Yes. The connector is another CBQ channel. Payments sent from SAP can be approved in Net Banking, and Net Banking continues to work as today. Limits are shared because CBQ enforces them, not the platform."),
  F("Functional", "What happens to payments under the STP threshold?", "They go straight through after SAP checker release. Payments above the customer's STP limit wait for a CBQ OTP or Net Banking approval. The threshold is CBQ's per-customer configuration."),
  F("Functional", "Are single manual payments supported, or only F110 runs?", "Both. F110 runs and F-53 manual payments use the same cockpit, the same canonical API and the same status write-back."),
  F("Functional", "How are rejected payments handled?", "The CBQ reason code and text are written back to the SAP document. The item stays open in SAP; the user corrects the master data and includes it in the next run as a new payment with a new idempotency key."),
  F("Functional", "Can the customer reconcile in SAP instead of on the platform?", "Yes. The platform always provides camt.053 for standard SAP Electronic Bank Statement processing. Platform matching is an addition that reduces manual effort, not a replacement."),
  F("Functional", "Which services are in Phase 1?", "Onboarding and lifecycle, balance, statements, domestic single and bulk payments, status, reconciliation, monitoring and audit. Alerts, name verification, bill payment, international and WPS are priced options."),
  F("SAP", "Does the add-on need SAP Business Technology Platform or PI/PO?", "No. It is an ABAP add-on delivered as transports, calling the CBQ API gateway directly over HTTPS with mTLS."),
  F("SAP", "Will it survive SAP upgrades?", "It lives in its own namespace and is designed to rely on standard SAP interfaces. Innoval tests each new SAP release and publishes supported versions within 90 days of general availability."),
  F("SAP", "What does the customer's Basis team have to do?", "Import signed transports, install the connector certificate in STRUST, map the house bank and accounts, build roles from the supplied authorisation objects, and enter the one-time activation code. The effort is agreed with each customer's Basis team during onboarding."),
  F("SAP", "Is RISE with SAP supported?", "Private cloud editions, including RISE, are supported. S/4HANA Cloud Public Edition is excluded because it does not accept ABAP add-ons."),
  F("Security", "Where are banking credentials stored?", "Nowhere in the ERP. The connector authenticates with a per-customer certificate issued from CBQ PKI and short-lived OAuth tokens. Users approve with CBQ's own OTP or Net Banking."),
  F("Security", "How is tenant data isolated?", "Every row carries a tenant key enforced by PostgreSQL row-level security, plus per-tenant certificates and tokens. Cross-tenant access is tested in every VAPT."),
  F("Security", "Can the platform approve a payment on its own?", "No. The platform validates and routes. Every authorisation decision is CBQ's: limits, mandates, OTP, Net Banking approval."),
  F("Security", "How does Innoval support production without standing access?", "Only through CBQ PAM, with session recording and CBQ-approved time-boxed access. No VPNs or shared accounts."),
  F("Security", "What prevents duplicate payments?", "Each SAP document carries an idempotency key stored before any CBQ call. A repeat with the same key returns the original result. After an uncertain outcome, the platform queries status instead of retrying."),
  F("Architecture", "Why hub and spoke rather than direct ERP-to-CBQ integration?", "All banking logic lives in one place. A CBQ API change touches one adapter, not every ERP connector, and CBQ has one entry and one exit point to secure and monitor."),
  F("Architecture", "Which technology stack runs the hub?", "Node.js services in containers on CBQ's Kubernetes/OpenShift (or VMs), PostgreSQL, Kafka or RabbitMQ, OpenTelemetry. CBQ standards can replace any of these."),
  F("Architecture", "Can CBQ host it in its own data centre instead of the cloud?", "Yes. The deployment is container-based and has no dependency on a specific cloud provider."),
  F("Architecture", "How are CBQ API changes absorbed?", "Only the CBQ API adapter maps to CBQ formats. The canonical API stays stable and versioned, so connectors do not change."),
  F("Operations", "What are the availability and recovery commitments?", "99.5% monthly availability, recovery time under 2 hours and recovery point under 15 minutes, with warm standby DR in Qatar."),
  F("Operations", "What does CBQ operations see?", "Tenant health, connector versions and heartbeats, volumes, latency, error codes, incidents and a tamper-evident audit trail, with one correlation ID per transaction."),
  F("Operations", "How are connector upgrades rolled out?", "Through the CBQ portal with a version matrix. The hub enforces a minimum version, so outdated connectors are blocked after a notice period."),
  F("Commercial", "How are additional ERPs priced?", "Fixed unit price per connector in the commercial proposal, built on the same SDK and certified with the same test kit."),
  F("Commercial", "Is source code escrow offered?", "Yes, with a recognised escrow agent, updated at every major release."),
  F("Commercial", "What does CBQ need to provide?", "API specifications and sandbox at kickoff, environments by month 3, security service onboarding, test data, UAT users and customers for the pilot."),
];

export const CLARIFICATIONS = [
  { id: "CL-07", topic: "CBQ reconciliation API availability", raised: "27 Oct 2026", owner: "CBQ API owner", st: ["Open", "warn"] },
  { id: "CL-09", topic: "Preferred message broker (Kafka or RabbitMQ)", raised: "27 Oct 2026", owner: "CBQ architecture", st: ["Open", "warn"] },
  { id: "CL-11", topic: "Event push for payment status from Connected Banking", raised: "27 Oct 2026", owner: "CBQ API owner", st: ["Open", "warn"] },
  { id: "CL-12", topic: "STP threshold defaults per customer segment", raised: "27 Oct 2026", owner: "CBQ product", st: ["Open", "warn"] },
  { id: "CL-14", topic: "Data retention period for statements on the platform", raised: "27 Oct 2026", owner: "CBQ compliance", st: ["Open", "warn"] },
];

export const NEXT_STEPS = [
  "Written responses to open clarifications within 3 working days",
  "Access to this clickable demo for CBQ's evaluation team",
  "Technical deep-dive on the SAP add-on with CBQ's SAP and security teams",
  "Reference contacts shared at shortlisting or clarification stage, subject to client consent",
];
