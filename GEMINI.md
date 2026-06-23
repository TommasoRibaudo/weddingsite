# Wedding Website - Gemini Context

Gemini is the coding assistant and repository builder for the Wedding Website project. Gemini handles the full development lifecycle: UI styling, page routing, database integration (Supabase), testing, and code documentation.

---

## Role & Responsibilities

Gemini is responsible for:

- **Implementation:** Writing and editing frontend source code (Next.js App Router), implementing pages (Gate `/`, Home `/home`, Gifts `/gifts`, Gallery `/gallery`, Admin `/admin`), and integrating Supabase DB and Storage according to the [PRD.md](file:///C:/Users/User/Documents/weddingsite/PRD.md) roadmap.
- **Styling & Design:** Crafting a premium, responsive white and green theme (`#386b40`) using **Crimson Pro** for body text and **La Luxe Script** for accents/headings.
- **Testing:** Verifying features locally against the test cases defined in [MANUAL_TESTS.md](file:///C:/Users/User/Documents/weddingsite/MANUAL_TESTS.md) before finalizing.
- **Project Management:** Coordinating tasks, maintaining clean environment variable templates, and documenting progress.

---

## Workflow: Implementation & Orchestration

Gemini uses the phases defined in [PRD.md](file:///C:/Users/User/Documents/weddingsite/PRD.md) as the primary source of truth for features, and [MANUAL_TESTS.md](file:///C:/Users/User/Documents/weddingsite/MANUAL_TESTS.md) for quality assurance.

1. **Selection:** Identify the current phase to implement from the [PRD.md](file:///C:/Users/User/Documents/weddingsite/PRD.md) Build Phases.
2. **Implementation:** 
   - Write clean, modular React components.
   - Strictly follow the Next.js agent rules in [AGENTS.md](file:///C:/Users/User/Documents/weddingsite/AGENTS.md) (e.g., checking `node_modules/next/dist/docs/`).
   - Implement server-side check/actions for security-sensitive operations (e.g., passwords, time-gate validation).
3. **Verification:** Start the dev server (`npm run dev`) and step through the verification plan in [MANUAL_TESTS.md](file:///C:/Users/User/Documents/weddingsite/MANUAL_TESTS.md).
4. **Documentation:** Keep the project state clear in chat and update relevant readmes or configs when dependencies change.

---

## Access & Security Model

Since this site is private but uses shared guest passwords:

- **Secrets:** NEVER commit actual passwords, session secrets, or Supabase credentials. Keep them in `.env.local` (which is git-ignored) and document keys in `.env.example`.
- **Server Enforcement:** Ensure password verification and photo feed time-gate checks happen server-side to prevent bypasses.
- **Search Engines:** Keep `robots.txt` and `noindex` headers configured to prevent search engine indexing.

---

## Reference Documents

- [AGENTS.md](file:///C:/Users/User/Documents/weddingsite/AGENTS.md): Technical instructions and Next.js version guidelines.
- [PRD.md](file:///C:/Users/User/Documents/weddingsite/PRD.md): Product requirements, access/security model, and build phases.
- [MANUAL_TESTS.md](file:///C:/Users/User/Documents/weddingsite/MANUAL_TESTS.md): Manual test cases for gates, gifts, gallery, and admin.
- [README.md](file:///C:/Users/User/Documents/weddingsite/README.md): Setup instructions, environment variables, and fallback font configuration.
