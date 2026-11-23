Índice
Who we are
What we process
What you give us
What we collect through use
What we receive from others
Operator Pass
Fluxer Feedback
How we use information
Legal bases
Approximate location
Who receives data
Sharing you choose
Our service providers
Law, safety and business changes
Content safety
Where data is kept
Retention
Active accounts and content
Phone verification
Deletion
Other retention periods
Your controls
Security
Your rights
Users in Brazil
Children and age requirements
Cookies and browser storage
Third-party content and links
Legal requests
Changes to this policy
Contact
California disclosures
Esta página solo está disponible en inglés.

1. Who we are
This policy applies to the official Fluxer instance, apps, APIs and websites run by Fluxer Platform AB. Fluxer is open source, so if you use an instance someone else hosts, that operator is the data controller for it and must tell you how it handles your data.

For the official service, Fluxer Platform AB is the controller of your personal data under the General Data Protection Regulation, supervised in Sweden by the Swedish Authority for Privacy Protection (IMY). Our legal identity, registered address, authorized representative and every contact route are on our company information page.

We have not appointed a data protection officer under GDPR Article 37 or a representative in the United Kingdom under UK GDPR Article 27. We keep both decisions under review and will update this section if that changes.

2. What we process
2.1 What you give us
To sign up, you give us an email address or a display name, and an account started with only a display name can add an email later. Every account has a username, and we pick one if you don't. Right after sign-up, the app asks for your date of birth.

A password and other profile details, such as an avatar and a bio, are optional. We store passwords only as Argon2id hashes, so we can't look up what your password is.

Your content is what you create and share, meaning messages, files, images, reactions, communities and profile information. Calls need connection information to work, and call media is encrypted in transit (section 9). When you share your screen, a small preview thumbnail is created by default so that people permitted to join the call can see what you're sharing, and you can turn the preview off when you start sharing.

If our anti-abuse checks restrict an account, we may ask you to verify a phone number to lift the restriction. We email you a one-time code, and you text it from your phone to our verification number. Section 7.2 says what we keep afterwards.

If you're in the United Kingdom or Brazil, age-restricted content stays locked unless you choose to unlock it with an age range from Apple or Google on your account, as section 2.2 and our regional restrictions page describe in more detail.

Unlocking it is always optional and only applies in those two countries, and elsewhere your date of birth decides. Accounts in the United Kingdom that passed the credit card check we used to offer keep a record that they're 18 or older, and we've removed the cards saved only for that check from our Stripe account.

Our support team handles support messages and attachments in helpdesk software we host ourselves, so no third-party support provider processes them.

Stripe processes payments, and we never get full card numbers. We get only what we need to record and manage a purchase, such as billing country, partial card details, payment status and dates. If you donate, we keep your email address, your Stripe customer and subscription details and any business name and tax ID you give us, so you can manage your donation and we can keep accounting records.

If you buy Plutonium through the App Store or Google Play, Apple or Google handles the payment (section 4.2), and we don't receive your card or other payment details. The app gives Apple or Google a random identifier that links the purchase to your account, and we get back what we need to give you Plutonium and manage the purchase, such as the product, store country, purchase status and dates.

If you buy for a business, we keep the company name, address and VAT ID you give at checkout, or the CNPJ if you buy for a company in Brazil, so that we can issue an invoice, keep accounting records and record whether a right of withdrawal applies to the purchase. We record a CNPJ with the payment at Stripe.

When we check a VAT ID with the European Commission's VAT Information Exchange System (VIES), it goes to the Commission and the issuing country's tax authority. We keep the answer, which may list the registered name and address and a consultation number, and record the result with the payment at Stripe. This rests on our VAT and bookkeeping duties (section 3.1), and section 7.4 says how long we keep it.

When someone redeems a gift code that was paid for, VAT on it is due in the country where it is redeemed, so we record which country that is. We work it out from the approximate location described in section 3.2 and the billing and card country on the account that redeems it, and we keep it with the payment records for that gift (section 7.4). This rests on our legal duty to account for VAT (section 3.1).

We don't ask for special category data such as health, religion, ethnicity, sexual orientation or political views. If you choose to include something like that in a message or profile, we won't use it to profile you, target you or treat you differently.

2.2 What we collect through use
Technical information includes the IP address you connect from, device and browser details, operating system, language and similar connection data.

To keep the service reliable, we keep server-side request metrics, error logs and aggregate performance measurements. We build them from request and error information and not from the content of any messages or files.

The web and desktop apps send us no usage analytics, screen tracking or crash reports. The only reports they send us are the peer-to-peer call reports described below.

The iOS and Android apps send us crash and performance reports only if you turn on "Send crash and performance reports" under "Advanced" in settings. The setting is off by default, and the app may ask you to turn it on after it crashes.

A report includes crash and error details, the screens you opened, moments when the app stuttered, how long network requests took, and your device and app version. Reports leave out instance addresses, IDs and message content. With the setting on, they come to us even if you are signed in to an instance we do not operate.

When a peer-to-peer call connects or fails to connect, the web and desktop apps send us a report for each person you connect to. The iOS and Android apps send these reports only if "Send crash and performance reports" is on.

A report says whether the connection worked, how long it took, what kind of network route it used, which channel the call was in and how many people were in it. It doesn't include the user IDs or IP addresses of the people you connect to.

We add the IP address and country you connected from, your app platform and your operating system to each report, and keep it for as long as section 7.4 says.

Only in the United Kingdom and Brazil, where the law says a date of birth you enter isn't enough for age-restricted content, the iOS and Android apps show "Unlock mature content" when you use fluxer.com, as our regional restrictions page explains. Using it is always optional, we will never require it, and skipping it only keeps age-restricted content locked. It's never offered anywhere else or on instances that others host.

When you press it, the app asks Apple's Declared Age Range or Google Play's Age Signals on your device for your age range once, and sends us a result only if that range says you're 18 or older, never your date of birth or your exact age.

A result under 18 stays on your device and is never sent to Fluxer.

Each time you press "Unlock mature content", the iOS app creates a one-time key with Apple's App Attest and signs the result with it so we can check it came from our app on a real Apple device, and we delete that key as soon as we've checked the result.

The Android app adds a Play Integrity token, which we send to Google to check the result came from our app installed from Google Play on a real Android device. The token holds a one-way code made from the request, not your result, and Google handles that token under Google's privacy policy. We store nothing from the token.

Google also supplies a category that says whether the age was entered by you, set by a parent or verified by Google. We accept an adult range only when Google verified it. The category contains no card, document or photo, and we don't save it on your account. For a rejected request, it can appear in security logs kept under section 7.4.

Your account stores only that you're 18 or older and the time we received the result. We use it only to unlock mature content on fluxer.com in the UK and Brazil, and only when the date of birth on your account also says you're 18 or older.

You can remove the result at any time in the web or desktop app. Under "Sensitive content" in "Privacy", press "Remove age range". Removing it locks mature content again. Deleting your account also deletes the result we stored for it.

To understand how Fluxer is used, we look at counts from our own service records, such as sign-ups and active accounts, alongside the aggregate service metrics described above. We never use message content to produce any of this.

Security records include sign-in attempts, account changes, rate limit events, service errors and signals used to spot spam, fraud, abuse or unusual activity. We record the connecting IP address against security-relevant events such as sign-ins and file uploads, and keep those records for the periods in section 7.

Some security records are kept as long as you have your account. They are your most recent IP address, the IP address, country and browser details from account creation, and the IP addresses you've approved for sign-in. The IP address and country of each signed-in session are kept while the session lasts and for 30 days after it ends.

If a community bans you, Fluxer stores your account's email address and last-used IP address to enforce the ban, until the ban is lifted or your account is deleted. The community's owner, moderators and members can't see them.

Fluxer uses no third-party analytics or advertising services, no cross-site tracking pixels and no browser fingerprinting, and we don't build behavioral profiles or track which other sites you visit. Crash and performance reports go only to servers we run.

2.3 What we receive from others
Other users create data involving you when they mention, message, add, report or otherwise interact with you. Service providers send back limited operational information, such as email delivery status, the verification texts you send to our number, payment and fraud signals and infrastructure alerts. Public sources occasionally supply narrow security signals, such as the reputation of an IP address.

If you connect a Bluesky account to your profile, Bluesky sends us your Bluesky identifier and handle so that we can show the connection. We sign out of the Bluesky session as soon as we have them and don't keep any Bluesky sign-in tokens.

We combine this with what we collect only to run, secure and support Fluxer.

2.4 Operator Pass
The Operator Pass has its own privacy notice that applies in these cases.

you joined the Operator Pass waitlist
you buy a pass
you receive a pass someone passes on to you
you turn on the pass that comes with Visionary
you choose to appear on the Operators' wall
you're listed in a yearly Operators list
a buyer puts your name on an Operator certificate
you have left the Fluxer Labs community or have been removed from it
In each of these cases, the separate Operator Pass privacy notice says what personal data we keep about you, why we keep it and for how long.

2.5 Fluxer Feedback
If you use Fluxer Feedback, or something you wrote on GitHub or sent to our old bug report bot was copied there, the separate Fluxer Feedback privacy notice says what personal data we keep about you, why we keep it and for how long.

3. How we use information
We use personal data to run accounts and communications, provide support, process payments, prevent abuse, enforce our rules, keep the service reliable, comply with the law that applies to us and protect users, the public and Fluxer.

We don't use your content for advertising, behavioral profiling, AI training or commercial research, and our terms list what we never do with it. Fluxer shows no ads and has no advertising partnerships, and section 4 says who receives your personal data.

3.1 Legal bases
Where the GDPR or similar law applies, we rely on these legal bases.

Contract necessity, under Article 6(1)(b), applies to delivering messages, running communities, managing your account, processing purchases and giving you support, which is what we need to provide the service you signed up for.

Legitimate interests, under Article 6(1)(f), apply to these purposes.

security
fraud prevention
service reliability
protecting children and others from serious harm, including by reporting confirmed child sexual abuse material, as section 4.3 describes
the usage counts and aggregate service metrics in section 2.2
messages about changes to the service or these policies
Each activity has a documented assessment of its purpose, its necessity and the balance against your rights, and none of it is used for advertising. You can object to any of this processing at any time, as section 10 describes.

Legal obligations, under Article 6(1)(c), apply to our accounting and tax duties under Swedish law, valid requests we receive from public authorities, and compliance with data protection, security and consumer protection law.

Consent, under Article 6(1)(a), applies to the small set of processing that needs consent, such as optional communications. You can withdraw your consent at any time, and doing so does not affect the lawfulness of earlier processing.

3.2 Approximate location
We derive an approximate city, region, and country from your IP address for sign-in alerts, session information, fraud prevention, regional age rules, sanctions compliance, for working out where VAT is due, and for other legal duties.

Some countries demand age-verification methods we don't offer, such as government ID uploads or biometric scans, and access there may be restricted. We never check age with documents, selfies or face scans (section 11). Instead, some regional access decisions are automated and use the approximate location above. Travel, VPNs and unusual network setups can give the wrong outcome.

If you think a restriction is wrong, use our privacy contact. We acknowledge it promptly, and a person on our team reviews it. The restriction stays in place during the review. You can share your point of view at any stage, and we send you the outcome with our reasoning. Our regional restrictions page lists current restrictions.

4. Who receives data
We don't sell, rent, trade, broker or license your content or other personal data to anyone, and we never share it with anyone for their own advertising or marketing. We share it only in the situations in the rest of this section.

4.1 Sharing you choose
Messages and files go to the people and communities you select, your profile is visible according to your choices, and integrations you connect receive only the access you grant. The people who receive what you share can save it or pass it on to others.

The optional stream preview is visible only to people permitted to join the call. If you agree to join a peer-to-peer call, your audio and video go directly between you and the other people in the call, and they can see your IP address. The app asks for your agreement before you join one, unless you've chosen to always agree.

4.2 Our service providers
Each service provider that processes personal data on our behalf is reviewed for privacy and security before we start using it, acts only on our instructions and is bound by a data processing agreement under Article 28 of the GDPR.

Because a provider may use your personal data only on our instructions, it must give that data the same protection that this privacy policy describes.

We use these kinds of service providers.

Hosting providers run the service and relay call traffic. Section 6 says where your data is stored and how we protect it when it's processed outside the EU.
Payment processors like Stripe handle your payments and work out the tax on them. We create our own invoices, receipts and credit notes for every payment. If your bank asks you to confirm a renewal, Stripe emails you a link to confirm it.
If you pay with Pix in Brazil, Stripe's Pix partner EBANX processes the payment, appears as the recipient on your bank statement and emails you a receipt.
An email provider hosted in the European Union sends transactional email, including receipts and other billing emails with their invoices attached.
A text messaging provider receives texts sent to our verification number.
If you turn on push notifications, push services from Apple, Google or your browser vendor deliver notifications to your device. They get device push tokens and message, call or event identifiers. Our push relay notice also applies when the official app gets notifications from an instance we don't operate.
If you turn on push notifications on iOS, or in older versions of our Android app, Apple or Google receive each notification so they can show it, with the sender's name, the conversation and community name, a short preview of the message and a link to any image attached to it. Notifications to browsers and current versions of our Android app are encrypted, so the push service can't see what they say.
Our error monitoring and service monitoring run on infrastructure we control, and no application errors or crash data go to any third-party monitoring service.

Google provides YouTube embeds and Klipy provides GIF search (section 13). Some providers are independent controllers when you use them directly, such as Google when you play a YouTube video or Apple and Google when you buy Plutonium in their app stores, and their own policies then apply alongside ours.

When we pass personal data to an independent controller, such as the purchase details Apple, Google or Stripe need, we pass only what that purchase or feature needs. Apple, Google and Stripe must protect it under the GDPR and other data protection laws that apply to them, and you can use your rights under those laws with them directly.

We keep this section current and note material changes in our changelog.

Stripe, and EBANX for Pix payments, are also independent controllers of payment details for their own fraud prevention, security and legal duties, under the Stripe privacy policy and EBANX's own privacy policy for its customers in Brazil.

4.3 Law, safety and business changes
Apart from the sharing above, personal data leaves Fluxer only to comply with a valid legal obligation, legal process or enforceable governmental request, to enforce our terms of service and other agreements, to protect the safety, rights or property of users, the public or Fluxer, or to detect and deal with fraud, security or technical issues.

When a person on our team confirms that reported material shows the sexual abuse of a real child, we report it to the CyberTipline of the National Center for Missing & Exploited Children (NCMEC), a nonprofit organization in the United States that passes reports on to law enforcement in the US and other countries.

Each report we make to NCMEC about confirmed child sexual abuse material contains the material itself and the details needed to identify the account that shared it, such as its user ID, username, email address and IP addresses.

We do this under our legitimate interest in protecting children from abuse (section 3.1), and the transfer to the United States relies on Article 49(1)(d) of the GDPR. When we report an account's confirmed child sexual abuse material to NCMEC, we don't tell the person behind the account that we have made a report.

If Fluxer Platform AB is reorganized, acquired or sold, personal data may go with it only to a recipient that keeps following this policy or a replacement you affirmatively agree to. Where legally permitted, affected users get at least 30 days' notice and a chance to delete their account and request deletion of their data first.

5. Content safety
We run no generative AI or LLM inference over your messages, files or calls.

For explicit content preferences we use OpenNSFW2, a small pretrained image classifier running on Fluxer-operated infrastructure. It isn't generative AI or an LLM. For each image it checks, it gives one score for how likely the image is to be explicit.

It can't recognize text, remember or learn. It runs on the published weights without changes and makes no external API call, and nothing it sees or produces enters any training pipeline. Our help article says which images and videos it checks.

The result is used only to apply explicit content preferences and to restrict flagged media to users 18 or over. It doesn't punish accounts, and no report is filed.

To spot spam, coordinated abuse and account compromise, other automated protections use signals such as message frequency, link structure, account age, IP reputation, email domain and client details to find patterns in messages and accounts. These automated protections feed no advertising or behavioral profiles.

Rules written by people on our team, based on real abuse they have seen, flag likely spam and scam activity for a person on our team to look into.

In limited cases, these protections place limits on an account that is very likely spam, such as pausing its messaging, until a person on our team reviews it. Section 9 of our community guidelines lists what these limits are, and you can reply to our email about them, appeal, or ask for a person to review the decision.

Nobody at Fluxer reads or looks at your messages or other stored content, and we don't have anyone else do it for us. The only exceptions are when an authorized person on our team needs to look at the specific content involved to investigate a report, enforce our rules, respond to a credible safety issue or respond to a valid legal request as section 14 describes. Only some roles on our team can access that content.

Every access is recorded in an audit log that shows who accessed what, and we keep that log as long as the administrative audit records in section 7.4.

Where processing may pose a high risk to people's rights, we do a data protection impact assessment, as GDPR Article 35 requires. We have completed two, for the explicit content classifier and the regional access decisions in section 3.2.

Each one assesses whether the processing is necessary and proportionate, sets out the risks and records the measures that reduce them. We revisit them when processing materially changes or on a regular schedule, whichever comes first.

6. Where data is kept
We host most stored account information, messages, communities, files and other content with Vultr in Piscataway, New Jersey. Call traffic may go through Vultr locations worldwide so calls route near participants, and is encrypted in transit.

Crash and performance reports from the iOS and Android apps are received and stored separately, on rented servers at Hetzner in Finland, in the European Union. Encrypted disaster recovery copies are kept separately, and only Fluxer has the keys.

Data we host in the United States can be subject to lawful access requests under US law, and section 14 says how we review every request and when we tell you about it. One such law is the Clarifying Lawful Overseas Use of Data Act (the CLOUD Act). Under it, a provider subject to US jurisdiction can be required to produce data in its possession, custody or control, even if it stores the data outside the United States.

Our transfer assessments, provider reviews and legal request procedures account for this, and we keep looking for ways to rely less on US-hosted infrastructure. If regional hosting launches, we'll explain what it changes and doesn't change, and which legal regimes would still apply. Our help on hosting has answers to common questions.

Personal data may be processed outside your country, including in the United States and Canada. Our data processing agreements include standard contractual clauses approved by the European Commission or UK authorities, and we keep these clauses in place even where another transfer mechanism would apply.

These agreements are also backed by transfer impact assessments for each destination, by encryption in transit and at rest, by access controls and audit logging, and by contractual limits on how our providers may use the data.

These measures reduce the risk, but they can't make lawful access impossible for the data that our servers must be able to process to run Fluxer.

7. Retention
We keep personal data only as long as it's needed for the purposes in this policy, legal obligations, disputes and enforcement, then delete or anonymize it.

7.1 Active accounts and content
Account information, messages, communities and other content are kept while your active account needs them. Attachments may expire based on factors such as size, age and use, as our attachment expiration guide explains, and items in saved media aren't subject to ordinary expiration. Optional stream previews stay available for at most 24 hours after the latest upload, and only to people permitted to join the call.

7.2 Phone verification
Phone numbers used for verification aren't stored on your account. The text message you send us, including your number, is deleted from our own systems within 24 hours, and your account records only the fact that verification happened.

To stop one phone number from lifting restrictions on many accounts, we keep a one-way record of the number together with the account it verified for about a month at most. This record is never used for SMS two-factor authentication, account recovery, advertising, profiling, contact discovery or linking accounts.

7.3 Deletion
Deleted messages and account data normally leave active use within minutes. Encrypted disaster recovery copies may still contain them for up to 30 days, without any active processing or use for any purpose, until scheduled deletion.

Deleted media normally leaves active use within hours, though we may keep a copy of each deleted attachment for up to 24 hours before final erasure. That copy isn't shown to anyone, and authorized team members can use it only for disaster recovery.

Deleted media isn't included in longer-term backups, and CDN-cached copies are cleared as soon as possible after deletion, though rate limits and global propagation can add short delays. An erasure request under Article 17 of the GDPR is complete once the data is gone from our active systems and from our backups.

We keep some data after deletion only where the law requires it, such as bookkeeping and tax rules, or for the purposes and periods that section 7.4, the Operator Pass privacy notice and the Fluxer Feedback privacy notice set out, for example a payment dispute or an appeal. We keep it only as long as that purpose or duty requires.

Deleting a community or channel removes it and everything in it (messages, attachments, roles, settings and other associated data) right away, and it can't be restored. Its data then leaves our systems through the procedures above.

Accounts that have had no sign-ins or other meaningful activity for 2 years may be scheduled for deletion, with advance notice to the account's registered email address. Visionary accounts are never deleted for inactivity. Section 3 of the Operator Pass terms says when accounts with an Operator Pass are not deleted for inactivity.

When you delete your account in the Fluxer mobile app, you can choose to delete your messages with it. Messages you don't delete stay visible where you sent them, without your name or profile. The account deletion guide has the current criteria and timelines. Deleting your Fluxer account doesn't delete your Fluxer Feedback account, and section 10 of the Fluxer Feedback privacy notice says how you can delete it.

7.4 Other retention periods
Payment and transaction records are kept for at least 7 years, as Swedish bookkeeping law (Bokföringslag 1999:1078) requires, and longer only where needed for legal compliance, disputes or fraud prevention. Full card numbers are never stored. Payment records include invoices and credit notes, with the date we emailed each of them to you, and the result of any check of a VAT ID you gave us.

When you withdraw from a Plutonium purchase, we keep a note of when we received the withdrawal and what we refunded for 60 days, so that the purchase can't be refunded twice. We use the name you type only in the confirmation email we send you, and we don't store it with the purchase. The refund itself is a payment record.

We also log the billing emails we send you, such as receipts and withdrawal confirmations. The log shows what kind of email it was, when we sent it and whether it arrived, but not the email itself. We delete these records at the latest 3 years after we sent them, or 1 year after the subscription they belong to ends, if that is later.

Crash and performance reports from the iOS and Android apps are kept for 30 days, and a cleanup that runs once a day deletes them from our servers after that. Security and usage logs are kept for up to 90 days, then deleted or anonymized, unless this section or section 2.2 gives a particular record its own retention period.

Specific records may be kept longer only for an active security investigation, a binding legal obligation or an ongoing dispute, and they are deleted once that reason ends. We delete reports about peer-to-peer calls after 180 days.

Support conversations and their attachments are kept as long as we need them to handle your request and any follow-up, and are then deleted when we next review our support records. We keep them longer only when they form part of a payment record under the bookkeeping rules above, an open dispute or an appeal.

Administrative audit records of enforcement decisions and account changes are kept as long as accountability, appeals, disputes and legal compliance require, and are reviewed periodically. So that investigation and appeal remain possible when content is reported, we may preserve a snapshot of the reported item, relevant surrounding context, attachments and report details, even if the original is later deleted.

Snapshots are stored separately from ordinary user content, are never served to users, indexed or exported, and are readable only by authorized people on our team, and every access to them is recorded. We delete these snapshots, the context and attachments we copied and any extra details written in the report no later than 1 year after the report was filed, even if we haven't finished handling the report by then.

Only a binding legal obligation can make us keep specific material for longer than that. We keep the record of the report itself, which says what kind of report it was, which accounts and items the report was about and what we decided, as one of the administrative audit records of enforcement decisions above.

Section 4 of the Operator Pass privacy notice says how long we keep waitlist entries and the copies of names and avatars for the Operators' wall, and section 5 says how long we keep Operator certificates and the record of your choices at checkout. The Fluxer Feedback privacy notice says how long we keep what you post on Fluxer Feedback, your account there and the records we keep about them.

Content removed or disabled under a valid order under Regulation (EU) 2021/784 on terrorist content, and related data, is preserved for 6 months, or longer where applicable law requires. Generated self-service export files are kept for up to 7 days.

8. Your controls
You can request an export and delete messages at any time in "User settings", in the "Privacy" section on the web or the "Privacy dashboard" section in the mobile apps. You can schedule account deletion in the "Account" section on the web or the "Security & login" section in the mobile apps, and the mobile apps also have a "Delete now" option that deletes your account right away, without the grace period.

An export is a ZIP archive of machine-readable JSON files with your account, message, payment, relationship, session, security, preference and profile information, with download links for any attachments that are still available. It also includes, as PDF files, the pages of any Operator certificate that we keep for you. Download anything you want to keep before you delete it or before you let it expire.

Deleting a message also deletes its attachments. Bulk message deletion runs in the background and can take a while for large accounts. You can cancel scheduled account deletion by signing back in during the grace period in section 6.1 of the terms. Current instructions are in our data export, data retention and account deletion guides.

For anything you can't do in the app, use the privacy contact on our company information page, writing from the email address on your account where possible. We may ask for the information needed to verify your identity.

9. Security
We use technical and organizational measures to protect your personal data against accidental or unlawful destruction, loss, alteration, disclosure and unauthorized access. These measures include encryption in transit and at rest, access controls, security monitoring, data centers that are physically secure, patching and hardening, rate limiting, encrypted backups and audit logging of access to user data.

Your data is encrypted in transit between your device and our servers and at rest on our servers and backups, but nothing on Fluxer is currently end-to-end encrypted. The service needs server-side processing to work, so our own systems can technically access the message content and call media while they handle them, and you're trusting Fluxer and our hosting providers to protect that traffic.

Our roadmap has our plans for end-to-end encryption of calls, personal notes, direct messages and group DMs. End-to-end encryption protects a call or your content only once its feature has launched, and we will announce each one when it ships.

You can report security vulnerabilities through our security page.

If a personal data breach happens, we investigate it and take steps to fix it. As GDPR Articles 33 and 34 require, we notify the Swedish Authority for Privacy Protection (IMY) within 72 hours of becoming aware of a breach, unless it's unlikely to result in a risk to people's rights and freedoms, and we explain why if we notify later.

We notify affected users without undue delay where the risk to them is high. Notifications explain what happened, what data is likely affected, the probable consequences and what you can do to protect yourself.

10. Your rights
Depending on where you live, you may have the right to do these things.

access your personal data and receive a copy of it
correct data that is inaccurate or incomplete
have your data erased
restrict processing in certain situations
object to processing based on legitimate interests
receive a copy of your data in a structured, commonly used, machine-readable format so you can move it to another service (data portability)
withdraw consent at any time without affecting earlier lawful processing
ask for a person to review any automated decision that significantly affects you, share your point of view on it and contest that decision
If you object to processing based on legitimate interests, we stop unless we have compelling legitimate grounds that override your interests, rights and freedoms, or we need the data to establish, exercise or defend legal claims.

You can exercise any of these rights through your account controls or the privacy contact on our company information page. We may need to verify your identity, and an authorized agent can act on your behalf where the law permits it.

We respond within the period applicable law requires, usually within 30 days, or up to 45 where permitted. If we can't fully comply, for example because of a legal obligation or another person's rights, we explain why and what options remain open to you.

You can also complain to your data protection authority. In Sweden that is the Swedish Authority for Privacy Protection at imy.se, and in the UK the Information Commissioner's Office at ico.org.uk. The authority where you live is always an option too, and you're welcome to raise the issue with us first so we can try to fix it directly.

10.1 Users in Brazil
If the Brazilian General Data Protection Law (LGPD, Lei 13.709/2018) applies to your data, you also have the rights in its article 18. They include confirmation that we process your data, access, correction, anonymization, blocking or deletion, portability, information about who we share your data with and withdrawal of consent. Use our privacy contact, in Portuguese if you like, and a person on our team answers.

11. Children and age requirements
Section 1 of the terms sets the minimum age for using Fluxer and says when a parent or guardian must review the terms and agree to them for you.

Users under 18 may get stricter privacy and safety defaults and limits on age-restricted features. Nobody on Fluxer is profiled for advertising, including minors.

We never ask for or accept ID documents, selfies, face videos, facial age estimation, biometric scans or other documents to check anyone's age. Where a law requires methods we don't support, access may be restricted, as section 3.2 explains.

If you entered the wrong date of birth, the current account process is to create a new account with the correct date. Requests about your data rights still go through section 10, where we review your request and explain our response.

We don't knowingly collect personal information from children below the minimum age for their region, which in the United States means children under 13, in line with COPPA. If we learn that an account belongs to someone below the minimum age, we schedule the account for deletion, which deletes its personal data with it.

A parent or guardian can contact us through the privacy contact on our company information page, and we may ask them for proof of guardianship.

12. Cookies and browser storage
The Fluxer app sets no first-party cookies. Authentication and recent identity checks use request and response headers. Our marketing site sets one strictly necessary cookie, locale, which remembers your language choice for 1 year.

Strictly necessary cookies need no consent under the ePrivacy rules. If we ever add a non-essential cookie, we will update this section and ask for consent first.

Fluxer Feedback, our site for bug reports and feature requests, sets its own cookies, which the Fluxer Feedback privacy notice lists with what each one does.

The app uses your browser's local storage for account switching, interface state and preferences. Some preferences sync to your account so they follow you between devices, and everything else stays on your device. Embedded YouTube content may set its own cookies when you interact with it, under Google's privacy policy.

We treat a Global Privacy Control signal as a request to opt out of the sale and sharing of your personal information. Fluxer doesn't sell personal information or share it for advertising, so the signal has nothing to turn off. A Do Not Track signal has nothing to turn off either, because Fluxer doesn't track anyone across other sites.

13. Third-party content and links
We relay GIF searches, so Klipy never sees your IP address or device identifiers.

When a message contains a link, Fluxer may fetch the linked site from our servers to build a preview, so the site sees a request from Fluxer, not from your device. Those requests have a User-Agent containing Fluxerbot, and a site operator can block them, which stops previews and embedded media for that site in Fluxer.

YouTube previews are fetched server-side, so your device doesn't contact YouTube until you press play. Playing an embedded video connects your device to Google, which may then process information under its own privacy policy, and other embedded content behaves the same way when you interact with it.

14. Legal requests
We review every request for user information and put the privacy and security of the people involved first. We narrow or reject requests that are invalid or overbroad. Authorities should use the legal route on our company information page and identify the requesting authority, the legal basis and the specific information sought.

We notify affected users before we disclose their information, so that they have a chance to object, unless the law forbids doing so. If the law forbids telling them at the time, we tell them as soon as that legal restriction has ended.

The only other exception is a genuine emergency, where we may disclose without prior notice if that is necessary to prevent death or serious physical harm. We then tell the affected users as soon as doing so no longer puts anyone at risk.

The reports of confirmed child sexual abuse material that we make to NCMEC on our own initiative aren't legal requests, and section 4.3 describes them.

For a valid request about a call, the call data we keep are the connection information and, while one exists, the stream preview, as the rest of this policy describes.

15. Changes to this policy
We may update this policy as our service, practices or legal duties change. We record every update in our changelog and update the effective date at the top.

A change is material when it is adverse to you, meaning it reduces your rights or protections, expands what we collect or how long we keep it, adds recipients or uses in ways that increase your risk, or otherwise leaves you worse off than before. Where it's genuinely unclear whether a change is adverse, we treat it as material.

Material changes take effect no earlier than 30 days after we notify you by email, in the app or both, so that before they apply you can review them, export your data, delete your messages or delete your account using the tools in section 8. A change may take effect sooner only where the law requires it or it is urgently needed for security, and we then notify you as soon as we reasonably can and explain why.

Changes that are neutral or in your favor, such as new protections, stronger encryption or clearer descriptions of existing practice, take effect when published. If such a change is significant, we also tell you about it in the app or by email.

16. Contact
All privacy, support, legal, postal and telephone contact routes are on our company information page. For account requests, write from your account's email address where possible, as it makes verifying your identity easier and protects the account.

17. California disclosures
This section adds the disclosures the California Consumer Privacy Act requires and applies only to California residents, alongside the rest of this policy.

The personal information we collect falls into these categories.

Identifiers: username, email address, user ID, IP address, device identifiers and the phone number you send a text from during phone verification, which come from you, from automatic collection and from our service providers.
Customer records under Cal. Civ. Code § 1798.80(e): billing country, partial card details, payment records and any business name, address and VAT ID or tax ID you give us, which come from you, from our payment provider, Stripe, from Apple or Google when you buy through their stores and from the European Commission's VIES system when we check a VAT ID, as section 2.1 describes.
Internet or network activity: sign-in and session records, request logs and browser and operating system details, from automatic collection.
Geolocation: the approximate city, region and country derived from the IP address you connect from, which all come from automatic collection.
Audio, electronic, or visual information: the messages and files you send, your stream previews and your call traffic, all of which come directly from you.
Inferences: the results of regional eligibility checks and signals of spam or abuse risk, which we derive from information we collect automatically.
The sensitive personal information we collect is your account login credentials, meaning an email address with a password, and the contents of the messages you send to other people. We use them only to run, deliver and secure the service, as sections 3 and 5 describe, and never to infer characteristics about you.

We collect no biometric, employment or education information. California law also treats the personal information of consumers under 16 as sensitive, and we use it only to provide and secure the service, never for advertising or unrelated profiling.

For hosting, delivery, payments, communications, push notifications and security, we disclose identifiers, payment records, network and location information, push tokens, notification contents, call traffic, previews and uploaded files to the providers in section 4, and section 4 says what each of them receives and why.

We don't sell anyone's personal information, including the personal information of users under 16, and don't share it for cross-context behavioral advertising.

California residents can request access, deletion or correction, can limit the use and disclosure of sensitive personal information, can opt out of sale or advertising sharing, neither of which happens, and can act through an authorized agent where the law permits, all without being discriminated against for it. Requests go through your account controls or the privacy contact on our company information page.

Retention follows section 7, and Global Privacy Control follows section 12.