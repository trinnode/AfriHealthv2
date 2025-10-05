<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# AfriHealth Ledger Yellow Paper (v1.0)

Main takeaway: AfriHealth Ledger is a Hedera-native, privacy-preserving healthcare and insurance platform that gives patients granular control over data access, enables providers to request consent and log itemized billing, automates payments via AI-assisted policies and oracles, and introduces an on-ledger community insurance pool. The system combines Hedera Smart Contract Service (EVM), Hedera Token Service (HTS), and Hedera Consensus Service (HCS), using an EIP-2535 Diamond architecture for modular upgradeability and auditable compliance. A dual-UI (Patient and Provider) plus optional Admin/Insurer portals ensure non-technical usability and scalable governance.

## 1. Goals, Scope, and Design Principles

AfriHealth Ledger targets three intertwined problems in African healthcare:

- Patient-controlled data access and consent portability across providers.
- Transparent, itemized billing and near-instant settlement with user acceptance.
- Inclusive risk pooling through an on-ledger micro-insurance pool with automated, fraud-resistant claims workflows.

Design principles:

- Hedera-first: Use Hedera SDKs and services where native advantages exist (low latency, predictable fees, HCS immutability, HTS governance) and follow Hedera-specific deployment guidance.[^1][^2][^3][^4]
- Modularity and future-proofing: Adopt EIP-2535 Diamond to separate concerns (consent, identity, billing, tokens, insurance, AI policy, governance) and enable partial upgrades with minimized risk.[^5][^6][^7][^8][^9][^10][^11][^12]
- Data minimization: Store PHI off-chain; store verifiable metadata, consent events, policies, and settlement proofs on-chain/HCS.
- Human-first UX: Two distinct UIs optimized for non-technical users; PWA with offline-first patterns and biometrics; concise, guided flows for consent and billing.[^13][^14][^15][^16][^17][^18]
- Compliance and auditability: Immutable HCS trails for consent and claims, role-based access, time-bound grants, emergency access with justification, and fraud mitigation via multi-signature and oracle-verified data.[^19][^20][^21][^22][^23][^24]


## 2. System Architecture Overview

Logical layers:

- Presentation: Web PWA + Mobile-friendly Patient and Provider UIs; optional Admin/Insurer consoles.
- Application services: API gateway, identity/verification, AI inference services, monitoring, optional secure backend (for caching, indexing, analytics; not holding secrets or PHI).
- Hedera integration:
    - Smart Contract Service (SCS): EVM contracts behind a Diamond. Facets implement business logic and call Hedera system contracts when needed.[^2][^25]
    - Hedera Token Service (HTS): Native token mint/burn/transfer, KYC/Freeze/Custom fees to represent platform credits and insurance pool token shares.[^26][^27][^28][^4]
    - Hedera Consensus Service (HCS): Ordered, timestamped logs for consent, billing events, claims status, and audit trail subscriptions.[^29][^4]
- Off-chain confidential storage: Encrypted PHI in patient-held vaults or trusted providers; only hashes/pointers, scopes, and proofs are on-ledger.
- Oracles and automation: Chainlink Automation and Functions for scheduled checks, fiat pricing, claims rules, and medical coding/coverage checks.[^30][^31][^32][^33]
- AI services:
    - Billing automation policy engine (approve/hold/flag) under patient-configurable rules.
    - Clinical suggestion assistant for providers with strict disclaimers and scope-limited to augment—not replace—clinical judgement.[^34][^35][^36][^37][^38]

Data flows:

- Event-driven through HCS topics for consent/billing/claims; clients and services subscribe via mirror nodes for real-time UI updates and audit trails.[^4][^29]


## 3. Smart Contract Architecture (EIP-2535 Diamond)

3.1 Rationale and standards

- Diamond pattern enables a single entry-point with modular facets for consent, billing, tokens, insurance, governance, and AI policy, allowing safe partial upgrades and bypassing contract size limits.[^6][^7][^8][^9][^39][^10][^5]
- Hedera supports Solidity contracts with caching, predictable fees, and system-contract conveniences; deploy via Hedera SDK to set Hedera-native properties (admin keys, memos, associations).[^3][^25][^1][^2]

3.2 Core contracts

- Diamond.sol: Proxy and fallback routing; DiamondCutFacet; DiamondLoupeFacet (EIP-2535 compliance).[^10][^6]
- AccessControlFacet: Roles—Patient, Provider, Insurer, Admin; supports multisig policies for sensitive actions (e.g., insurance payouts).[^22][^11]
- IdentityFacet: Link Hedera Account IDs, verified credentials, optional DID references; manage provider verification flags.
- ConsentFacet: Create/update/revoke consent grants with scopes, time bounds, break-glass emergency overrides with justification and alerting; emit HCS messages for immutable logs.[^40][^41][^4]
- RecordsRegistryFacet: On-chain registration of off-chain record pointers (hashes, URIs), tagged by consent scope and retention policy; zero PHI on-chain.
- BillingFacet: Provider creates itemized bills; patient approves/declines; after approval, triggers settlement via HTS token or HBAR with AI policy checks and oracle rates; publishes HCS events for transparency.[^4]
- TokenFacet (HTS integration):
    - PlatformCredit (fungible, user incentives and operational credits).
    - InsurancePoolToken (fungible shares of pool).
    - Optional NFT badges for reputation/compliance milestones.
    - Utilize KYC/freeze where relevant; custom fees to fund ecosystem grants.[^27][^28][^26]
- TreasuryFacet: Fee routing, incentives distribution, developer treasury, subsidy logic for vulnerable users or sponsored transactions.
- InsurancePoolFacet: Create/join pool, premium accrual, underwriting parameters, reinsurance vault references, coverage rules, reserves; claims lifecycle (submit, attest, evaluate, approve/deny, payout) with multi-signature and oracles.[^20][^21][^42][^19][^22]
- ClaimsFacet: Structured claims with diagnosis/procedure codes, provider attestations, required evidence hashes, deadlines, and dispute workflows; fraud flags, sampling for audit.[^19][^20][^22]
- OracleFacade: Integration points to Chainlink Feeds/Functions/Automation for FX rates, medical code coverage tables, fraud models, and off-chain attestations; configurable sources and SLAs.[^31][^32][^33][^30]
- AIPolicyFacet: Patient-configurable automatic payment rules with guardrails (e.g., auto-approve below X, require 2nd confirmation for certain CPT/ICD categories, daily cap); explainability metadata and overrides.
- GovernanceFacet: Parameter updates via role/multisig or token-holder votes; emergency pause; upgrade approvals with time-locks; emission schedule updates for incentives; resolver pattern option for multi-asset logic updates at scale.[^9][^5]
- DisputeFacet: Escalations, arbitrator assignment (community council or insurer), evidence submission windows, binding outcomes; HCS-logged for transparency.[^4]
- AuditFacet: On-chain accessor for HCS topic references, Merkle proofs, upgrade history (loupe), and admin actions digest.[^29][^6][^4]

3.3 Diamond storage and upgrade safety

- Per-facet storage structs in library namespaces; immutable constants for storage slots; upgrade pre- and post-checks; selector conflicts detection; upgrade events logged to HCS with state-change summaries for audit.[^8][^6][^10]

3.4 Insurance pool model details

- Reserve ratio, solvency threshold, and payout ladder.
- Premium pricing calibrated by risk tiers and community experience; discount incentives for preventive actions (vaccinations, adherence) recorded as verifiable off-chain proofs with hashes on-chain.
- Claims evaluation matrix combining rule engine and insurer/vetted-provider multi-signing to minimize fraud (phantom billing, upcoding, unbundling).[^22][^19]
- Reinsurance vault config for catastrophic events; tranching possible in later versions.


## 4. Hedera Services Integration

4.1 Smart Contract Service (SCS)

- Deploy via Hedera SDK to set Admin Key, Contract Memo, Auto Renew, Staking preferences, and to benefit from jumbo Ethereum transactions for large bytecode.[^1][^3]
- Observe Hedera EVM differences (e.g., automatic token associations, system contract calls availability) when designing flows.[^25][^43][^1]

4.2 Hedera Token Service (HTS)

- Mint/burn PlatformCredit and InsurancePoolToken with role-based keys; optional KYC gates for regulated segments.[^26][^27][^2][^4]
- Custom fees to support grant pool or public-good analytics.
- Token associations managed at account creation/login; present balances in crypto and fiat using oracle feeds.

4.3 Hedera Consensus Service (HCS)

- Topics: ConsentTopic, BillingTopic, ClaimsTopic, GovernanceTopic, AuditTopic.
- Emit structured messages from facets at each lifecycle step; UIs and indexers subscribe via mirror nodes for immediate consistency and user feedback.[^29][^4]


## 5. AI and Oracle Automation

5.1 Chainlink Automation and Functions

- Schedule premium collection reminders, coverage period checks, auto-cancel of expired consents, and SLA timers for claim steps.[^33][^30][^31]
- Functions fetch FX rates, codebook updates, coverage tables; attest results back to contracts via OracleFacade.[^32][^30]

5.2 AI policy engine (patient-side)

- Configurable rules stored on-chain (thresholds, categories to hold/auto-approve, daily/monthly caps).
- On billing approval attempt, AIPolicyFacet evaluates the rule set; if oracle/AI signals risk or exceeds limits, require explicit approval.
- All AI decisions provide a short rationale label and HCS log for transparency and override history.

5.3 Clinical suggestion assistant (provider-side)

- Off-chain AI with strict constraints: never emits diagnosis, only suggest “possible next steps” based on structured symptoms and codes provided by provider; clearly disclaimers and opt-in only.[^35][^38][^34]
- No PHI leaves secure context; inference results are transient and not recorded on-chain, except optional de-identified quality-improvement aggregates.

5.4 Fraud analytics

- Off-chain models flag anomalies (upcoding, unbundling, duplicate claims, excessive frequency); feedback integrated into ClaimsFacet as risk score requiring multi-sign approvals.[^19][^22]


## 6. Data Model and Privacy

6.1 On-chain/HCS data

- Identifiers: Hedera Account IDs, optional DID references, role flags.
- Consent metadata: scope, duration, provider, hashes of scope docs, revocation logs.
- Billing: item IDs, codes, amounts, provider attestations, patient acceptance status, settlement hash.
- Insurance: policy terms hash, premium schedule, claim IDs, decision states, signers.
- Zero PHI: diagnoses textual descriptions, lab values, images remain off-chain, encrypted.

6.2 Off-chain PHI

- Provider EHR systems or patient vaults store encrypted data; pointers and integrity hashes registered on-chain.
- Access via consent grants and authenticated provider identities; retrieval recorded to HCS with purpose-of-use.

6.3 Emergency access (“break glass”)

- Provider can request temporary access when patient incapacitated; emergency reason codes required; post-event patient notification and dispute window; higher audit scrutiny.[^41][^40][^4]


## 7. UX Design: Dual UI and Accessibility

7.1 Patient app

- Home: three balances (HTS token, HBAR wallet, fiat equivalents via oracle).
- My Consents: simple cards, scope icons, expiry, revoke/extend in one tap.
- Bills \& Payments: itemized bills with AI tags (approve, hold, dispute); explainable reasons; monthly cap visibility.
- Insurance: join pool, see coverage, pay premium, submit claims via guided checklist with document upload.
- Security: biometric unlock, clear privacy labels, offline caching of non-sensitive data; PWA for low-bandwidth usage.[^14][^15][^16][^17][^18][^13]

7.2 Provider app

- Verify identity and license; role-bound capabilities.
- Request consent flow: select scope templates, duration, emergency flag if applicable.
- Create bill: pick codes, add notes, attach evidence hash; see patient’s AI policy hints (e.g., likely to require confirmation).
- Claims: submit on behalf of patient with authorization; track statuses and respond to additional info requests.

7.3 Admin/Insurer consoles

- Pool configuration, reserves, reinsurance; claims queues; fraud flags; governance proposals.

7.4 Non-technical clarity

- Use plain language with tooltips; reduce steps; show trust badges (Hedera-secured, audit-logged); provide localized languages common in target regions.[^15][^13][^14]


## 8. Edge Cases and Resilience

- Consent expired mid-session: API and contracts re-check on execution; UI prompts to renew.
- Provider suspended: role revoked; pending payouts paused; patients notified.
- Oracle outage: fail-safe to manual approval; cap timeouts; retry via Automation; no automatic payout without required attestations.[^30][^31][^33]
- Double-billing: BillingFacet deduplicates by provider-patient-episode hash; HCS audit highlights duplicates.
- Disputes: timer-based escalation; automatic partial payments disabled until resolved; evidence locking windows.
- Patient lost keys: social recovery or guardian-based rekeying via IdentityFacet; session keys with limited scope and time.
- Chain upgrades and Diamond cuts: announce via GovernanceTopic with time-lock; provide roll-back plans and loupe visibility.[^7][^6][^10]
- Regulatory requests: export HCS logs by account and timeframe via AuditFacet; no PHI disclosure from chain.


## 9. Development and Deployment Plan

9.1 Smart contracts

- Start from mudgen diamond-3 reference; define facets and storage libs; thorough unit/integration tests; loupe tests.[^39][^6][^10]
- Deploy via Hedera SDK (ContractCreateTransaction / ContractCreateFlow) to set Hedera-native properties and handle jumbo payloads when needed.[^3][^1]
- System contracts: use Hedera system smart contracts for token operations where applicable.[^2][^25]
- CI/CD: run static analysis, property-based testing for state invariants (consent revocation always blocks new reads, no payout without patient acceptance unless emergency + multi-sign).

9.2 Hedera topics and tokens

- Create HCS topics for Consent/Billing/Claims/Governance/Audit on testnet first; subscribe mirror node in dev tools for live event-driven UI.[^29][^4]
- Create HTS tokens:
    - PlatformCredit: mint on registration, configurable emissions; may leverage KYC/freeze for fraud mitigation or regional compliance.[^27][^26]
    - InsurancePoolToken: issued on premium contribution; redemption subject to pool rules and reserve ratio.

9.3 SDK and integration

- Hedera JS SDK for contract create/calls, HTS operations, HCS pub/sub; align with Hedera docs on deployment specifics and gas/fees.[^44][^1][^2][^3][^4]
- For EVM tooling convenience, if using Hardhat through JSON-RPC relay, still prefer SDK for Hedera-specific properties (admin key, memo, associations).[^43][^1][^3]
- Reference smart contract samples and ABI handling patterns from Hedera repos for event decoding and error handling.[^45][^46]

9.4 Indexer and API gateway

- Optional backend to subscribe to HCS topics, index events, aggregate views for UI; no PHI stored.
- Expose read-only APIs for wallets and balances, claims status, consent summaries.
- Cache oracle results with TTL; verify on-chain when executing critical paths.

9.5 AI services

- Billing AI policy: deterministic, explainable rules on-chain; optional off-chain heuristic risk scoring with signed attestations through Functions to OracleFacade.[^32][^30]
- Provider assistant: deploy small curated models or rule-based clinical suggestions; enforce opt-in and disclaimers; keep all PHI in session memory only.


## 10. Tokenomics and Incentives

- PlatformCredit: minted at onboarding; incentivize actions: completing preventive care, on-time premium payments, participating in governance, and providing verified outcomes. Burning or fees could fund grant pool for clinics in underserved areas.[^28][^26]
- InsurancePoolToken: reflects pro-rata share of reserves; pricing and redemption governed by pool rules and cooldowns; publish NAV snapshots on HCS for transparency.
- Governance: hybrid—Admin/Insurer multisig for safety-critical; community voting for non-critical parameters via staked PlatformCredit to prevent spam.


## 11. Insurance Pool Mechanics

- Premiums collected on schedule (Automation reminders); coverage window enforced by contract.
- Claims submission includes code sets, cost, evidence hashes, and provider/patient signatures where applicable; OracleFacade retrieves coverage matrix validity and FX rates; multi-sign approvals required (e.g., provider + insurer) to mitigate fraud.[^21][^20][^22][^19]
- Partial payouts for uncontested line items; disputed lines go to DisputeFacet; SLA timers escalate to arbitrators.
- Solvency policy: dynamic premium adjustments via governance if utilization spikes; reinsurance vault triggers beyond catastrophe threshold.


## 12. Security and Compliance

- Role-based access and fine-grained permissions across facets; critical actions require multisig.[^11][^22]
- Reentrancy guards, input validation, per-facet storage boundaries to avoid collisions; upgrade timelocks; emergency pause.
- HCS audit chains of all critical lifecycle events; keep logs tamper-proof and timestamped.[^4][^29]
- Privacy by design: PHI off-chain, encrypted; scope-limited access; explicit consent and revocation flows with clear UI and audit trails consistent with healthcare standards literature.[^23][^24][^19]


## 13. Testing Strategy

- Unit tests per facet: success and failure paths; fuzzing of boundary conditions (time expiry, cap thresholds).
- Integration tests: end-to-end user stories—consent grant, provider request, bill issue, patient AI-policy evaluation, approval, settlement, claims submission, oracle attestations, payout.
- HCS latency tolerance: simulate reorg-equivalents by delayed confirmation checks and UI spinners; ensure idempotent handlers.[^29][^4]
- Oracle failure simulations: fallback logic; prevent unintended payouts; capture incidents in AuditTopic.


## 14. Observability and Operations

- On-chain: governance and audit functions expose state; loupe for facets; HCS topics documented; mirror-node dashboards.
- Off-chain: metrics on API latency, oracle response times, Automation job success rates; alarms for solvency thresholds and claims backlog.
- Versioning: semantic versions for facets; publish resolver mappings if adopting diamond-resolver for multi-asset patterns.[^9]


## 15. Adoption and Go-To-Market

- Pilot with 2–3 clinics/hospitals; co-design consent templates with clinicians.
- Patient education: explain data ownership, “approve before pay,” and emergency access transparency.
- Partnerships: insurers for pool underwriting; NGOs for subsidies; academic partners for evaluation and UX iteration.
- Funding alignment: Hedera ecosystem grants; AI-blockchain grants; public health pilots; emphasize immutable auditability and low-fee settlement advantages.[^47][^48][^49]


## 16. Example User Journeys

16.1 Patient onboarding and token mint

- Create account (Hedera testnet/mainnet); auto-associate tokens; receive PlatformCredit mint; balances show HBAR, HTS, and fiat equivalents via oracle feeds.[^26][^27][^2][^4]

16.2 Provider consult and consent

- Provider requests consent scope (e.g., “Labs last 12 months, medications” for 30 days).
- Patient accepts; ConsentFacet stores metadata; HCS logs event; provider can now fetch specific records via off-chain link with access token; each retrieval logs a purpose-of-use event to HCS.[^40][^41][^4]

16.3 Billing and payment

- Provider submits itemized bill; AIPolicyFacet checks thresholds. If within patient auto-approve parameters, UI displays confirmation with explainable AI rationale; otherwise requests explicit confirmation.
- On approval, HTS transfer executes; BillingTopic records; fiat equivalents shown via oracle rate at settlement time.[^30][^26][^4]

16.4 Insurance claim

- Patient or provider files claim; ClaimsFacet runs rule checks and requests multi-sign approvals; OracleFacade validates coverage codes and FX; partial payout possible; disputes escalate if unresolved within SLA.[^20][^21][^31][^33][^22][^19]


## 17. Implementation References and Best Practices

- EIP-2535 Diamonds and reference implementations for facets, loupe, and diamondCut.[^12][^6][^7][^8][^39][^10][^11]
- Hedera deployment specifics (jumbo tx limits, admin key, contract memo, associations) using SDK; differences from generic EVM tools.[^25][^43][^1][^2][^3]
- HTS and HCS usage models and benefits for tokenization and immutable audit trails.[^28][^27][^26][^4][^29]
- Insurance and healthcare claim processing and fraud mitigation research for multi-entity and multi-signature workflows.[^24][^42][^21][^23][^20][^22][^19]


## 18. Roadmap

- Milestone 1 (Hackathon MVP): Identity, Consent, Billing, Token facets; HCS logging; basic AI policy rules; Provider and Patient UIs; small insurance pool with manual approvals; oracle FX.
- Milestone 2: Full insurance claims lifecycle with Automation and Functions; fraud flags; dispute resolution; governance voting; multilingual UX and offline-first.
- Milestone 3: Reinsurance vaults; tokenomics refinement; provider reputation NFTs; broader insurer integrations; clinical assistant expansion (opt-in).


## 19. Risks and Mitigations

- Smart contract upgrade risk: diamondCut behind multisig and timelock; publish plans via GovernanceTopic; audits recommended.[^6][^10]
- Oracle dependency: multi-source feeds; circuit breakers; manual override processes with on-chain accountability.[^31][^33][^30]
- Regulatory variance: configurable consent templates and data residency; keep PHI off-chain; exportable audit logs for compliance reviews.[^19][^4][^29]
- User error: strong defaults (no auto-pay above low caps), clear prompts, undo windows for non-final actions, and granular activity history.


## 20. Conclusion

AfriHealth Ledger fuses Hedera’s performant primitives (SCS, HTS, HCS) with a modular, auditable Diamond architecture to deliver patient-centered consent, transparent billing with AI-guarded automation, and a practical on-ledger insurance pool. The combination of immutable consensus logs, predictable fees, and role-based governance creates a system that non-technical users can trust and institutions can adopt. This blueprint is original, realistic, and implementable within a staged roadmap aligned to hackathon goals and long-term grant funding prospects.[^7][^8][^10][^1][^2][^6][^22][^9][^31][^26][^30][^19][^4][^29]
<span style="display:none">[^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60]</span>

<div align="center">⁂</div>

[^1]: https://docs.hedera.com/hedera/core-concepts/smart-contracts/deploying-smart-contracts

[^2]: https://hedera.com/smart-contract

[^3]: https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/create-a-smart-contract

[^4]: https://hedera.com/consensus-service

[^5]: https://docs.amplified.fi/super-vault-architecture/vault-architecture-and-core-tech/eip-2535-diamond-standard

[^6]: https://www.certik.com/resources/blog/diamond-proxy-contracts-best-practices

[^7]: https://www.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-1

[^8]: https://rareskills.io/post/diamond-proxy

[^9]: https://hedera.com/blog/iobuilders-helps-transform-digital-assets-on-hedera-through-asset-tokenization-studio

[^10]: https://github.com/mudgen/diamond-3

[^11]: https://forum.openzeppelin.com/t/introduction-to-the-diamond-standard-eip-2535-diamonds/12505

[^12]: https://soliditydeveloper.com/eip-2535

[^13]: https://www.moontechnolabs.com/blog/healthcare-user-experience-design/

[^14]: https://designlab.com/blog/ux-design-healthcare-user-experience

[^15]: https://procreator.design/blog/healthcare-ux-design-strategies-practices/

[^16]: https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications

[^17]: https://topflightapps.com/ideas/healthcare-mobile-app-design/

[^18]: https://mindster.com/mindster-blogs/healthcare-app-design-guide/

[^19]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11082361/

[^20]: https://ietresearch.onlinelibrary.wiley.com/doi/full/10.1049/ccs2.12112

[^21]: https://journals.sagepub.com/doi/full/10.1177/14604582251339422

[^22]: https://arxiv.org/html/2407.17765v1

[^23]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10563467/

[^24]: https://www.sciencedirect.com/science/article/pii/S1084804523000528

[^25]: https://docs.hedera.com/hedera/core-concepts/smart-contracts/system-smart-contracts

[^26]: https://www.antiersolutions.com/blogs/hedera-hashgraph-the-gateway-to-secure-and-swift-asset-tokenization/

[^27]: https://rejolut.com/blog/how-to-create-a-token-on-hedera-using-hedera-consensus-service/

[^28]: https://www.rapidinnovation.io/post/how-to-create-tokens-using-hedera-consensus-service

[^29]: https://hedera.com/blog/build-your-first-hcs-powered-web-app

[^30]: https://docs.chain.link/chainlink-automation

[^31]: https://docs.chain.link/chainlink-automation/overview/automation-economics

[^32]: https://docs.chain.link/chainlink-functions/resources/billing

[^33]: https://chain.link/education-hub/smart-contract-automation-use-cases

[^34]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8412875/

[^35]: https://www.keragon.com/blog/ai-and-blockchain-in-healthcare

[^36]: https://geekyants.com/blog/the-future-of-healthcare-ai-blockchain-and-automation

[^37]: https://www.mindbowser.com/role-of-blockchain-ml-ai-in-mhealth-app-development/

[^38]: https://onlinelibrary.wiley.com/doi/10.1002/ett.4884

[^39]: https://www.quicknode.com/guides/ethereum-development/smart-contracts/the-diamond-standard-eip-2535-explained-part-2

[^40]: https://hedera.com/blog/acoers-rightshash-builds-on-hedera-to-pioneer-decentralized-management-and-protection-of-users-rights

[^41]: https://www.exp.science/hedera-ecosystem/consentcheq

[^42]: https://onlinelibrary.wiley.com/doi/10.1155/2021/6787406

[^43]: https://soliditydeveloper.com/hedera

[^44]: https://hedera.com/blog/how-to-develop-on-hedera-back-to-the-basics

[^45]: https://github.com/hashgraph/hedera-smart-contracts-libs-lab

[^46]: https://github.com/hashgraph/hedera-smart-contract-starter

[^47]: https://www.binance.com/en-NG/square/post/2023-09-05-healthready-launches-on-hedera-mainnet-to-improve-patient-data-access-and-verification-1091299

[^48]: https://digital-strategy.ec.europa.eu/en/policies/blockchain-funding

[^49]: https://eufundingportal.eu/blockchain/

[^50]: https://stackoverflow.com/questions/78209485/solidity-smart-contract-hedera-hashgraph-javascript-sdk-integration

[^51]: https://thesai.org/Downloads/Volume13No6/Paper_79-Implementation_of_Electronic_Health_Record.pdf

[^52]: https://www.sciencedirect.com/science/article/pii/S2096720921000440

[^53]: https://www.settlemint.com/insurance-services-blockchain-use-case

[^54]: https://ideausher.com/blog/hedera-hashgraph/

[^55]: https://www.scnsoft.com/insurance/smart-contracts

[^56]: https://www.linkedin.com/pulse/tm007-modular-shiny-smart-contracts-eip-2535-diamonds-antematter

[^57]: https://github.com/hiero-ledger/hiero-improvement-proposals/discussions/707?sort=new

[^58]: https://hedera.com/learning/smart-contracts/smart-contract-design-patterns

[^59]: https://blockchain.oodles.io/blog/healthcare-insurance-blockchain-smart-contracts/

[^60]: https://www.youtube.com/watch?v=e6WCbOyK7FA

