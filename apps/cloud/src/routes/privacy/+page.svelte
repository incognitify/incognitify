<!--
  DRAFT — template privacy policy. Have legal counsel review before launch.
  Operator: Udooku LLC. Reflects the actual data practices of the app as built.
-->
<main class="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 text-sm leading-relaxed">
  <a class="text-muted-foreground hover:underline" href="/">← Incognitify Cloud</a>
  <h1 class="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
  <p class="text-muted-foreground">Last updated: June 18, 2026</p>

  <p>
    Incognitify Cloud is operated by <strong>Udooku LLC</strong> ("Udooku", "we", "us"). This policy
    explains what we collect and how we handle it.
  </p>

  <h2 class="mt-4 text-lg font-semibold">What we collect</h2>
  <ul class="list-disc pl-5">
    <li><strong>Account &amp; organization data</strong> — your name, email, and the organizations and memberships you create.</li>
    <li><strong>Provider API keys</strong> — stored encrypted (see below). We display only the last four characters and a label.</li>
    <li><strong>Usage metadata</strong> — per request we record counts and metadata (provider, model, token counts, number of values masked, timestamps, success/error).</li>
  </ul>

  <h2 class="mt-4 text-lg font-semibold">What we do NOT store</h2>
  <p>
    We do <strong>not</strong> store the content of your prompts or the LLM responses, and we do not
    store the original sensitive values that were masked. The masking "vault" that maps a value to a
    token exists only in memory for the duration of a single request and is never written to disk.
  </p>

  <h2 class="mt-4 text-lg font-semibold">How your keys are handled</h2>
  <p>
    Provider keys are encrypted at rest using AES-256-GCM with per-organization data keys, themselves
    wrapped by a master key held in our deployment secrets. Keys are decrypted only in memory at the
    moment a request is proxied, and are never logged.
  </p>

  <h2 class="mt-4 text-lg font-semibold">Third parties</h2>
  <ul class="list-disc pl-5">
    <li><strong>LLM providers (Anthropic, OpenAI, etc.)</strong> — your masked prompts are sent to the provider you choose, using your own key, subject to that provider's privacy terms.</li>
    <li><strong>Stripe</strong> — payment processing (we do not store card details).</li>
    <li><strong>Mailtrap</strong> — transactional email (e.g. invitations).</li>
    <li><strong>Hosting infrastructure</strong> — used to run the Service and database.</li>
  </ul>

  <h2 class="mt-4 text-lg font-semibold">Retention &amp; deletion</h2>
  <p>
    We retain account, key, and usage records while your account is active. You may delete your keys
    at any time and may request deletion of your account by contacting us.
  </p>

  <h2 class="mt-4 text-lg font-semibold">Security &amp; honesty</h2>
  <p>
    We use encryption and access controls, but no system is perfectly secure, and automated masking
    can miss sensitive values. Incognitify Cloud reduces risk; it does not guarantee privacy or
    regulatory compliance.
  </p>

  <h2 class="mt-4 text-lg font-semibold">Contact</h2>
  <p>Udooku LLC, <a class="text-primary hover:underline" href="mailto:support@incognitify.com">support@incognitify.com</a>.</p>

  <p class="mt-6 text-muted-foreground">
    See also our <a class="text-primary hover:underline" href="/terms">Terms of Service</a>.
  </p>
</main>
