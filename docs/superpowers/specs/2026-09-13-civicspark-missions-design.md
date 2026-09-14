# CivicSpark Missions Design

## Product

CivicSpark Missions turns a live congressional bill into a teacher-led, seven-chapter civic learning experience. Students join with a short code and pseudonym, record an initial view, examine source-backed evidence, weigh competing arguments, complete a knowledge check, write a personal letter, and submit it to their teacher. Teachers review submissions, view anonymous learning gains, and export approved letters as a packet for the appropriate congressional office.

The existing bill browser and representative tools remain available under “Explore Congress,” but the homepage and submission narrative center the classroom mission workflow.

## Experience

The student journey is: context, initial position, evidence, perspectives, knowledge check, reflection and letter, completion. Each screen has one primary action, a persistent progress indicator, autosave, keyboard support, reduced-motion support, and responsive behavior down to 375px.

Teachers sign in by email magic link, create a mission from a current bill, select a grade band and objective, review generated content, publish a six-character join code, review student letters, and export approved work. Students do not create accounts.

The visual system uses deep ink/navy, warm paper surfaces, and a bright spark accent. The mission should feel like an interactive editorial story rather than a dashboard or competitive game. Motion is progressive enhancement and never controls content visibility.

## Data and Trust

Supabase stores missions, frozen source content, pseudonymous participants, responses, and derived aggregate metrics. Row-level security isolates teachers and missions. Student access is scoped by a random browser-held token whose hash is stored server-side. The system never collects student email, address, ZIP code, school, or legal name.

Mission content is generated once from captured Congress.gov metadata, actions, CRS summaries, and available official text. Every factual evidence card and answer explanation cites a stored source. Content with missing or invalid citations cannot be published. Teachers can edit all content before publication.

Letters are assembled from cited mission facts and a student’s own structured responses. AI may organize and edit but cannot invent personal experiences or unsupported facts. Letters are never sent automatically.

## Success

The competition-ready release must support teacher creation through packet export, remain usable when Congress.gov or the AI provider is temporarily unavailable after mission generation, and pass mobile, keyboard, accessibility, authorization, and concurrency checks. The pilot target is one teacher and at least 15 students, with at least 80% completion, a 20-point average knowledge gain, 10 approved letters, and anonymized qualitative feedback.

Student accounts, public discussion, leaderboards, social feeds, automatic contact-form submission, and multiple mission formats are outside the pre-submission scope.
