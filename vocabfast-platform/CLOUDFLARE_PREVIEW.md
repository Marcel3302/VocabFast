# Cloudflare preview for the next VocabFast platform

The next-generation client is deployed as an **isolated preview Worker** named `vocabfast-language-preview`.

It deliberately has:

- no `vocabfast.net` custom-domain route
- no production R2 binding
- no Stripe binding or checkout configuration
- no admin credentials
- no production session handling
- a separate `workers.dev` deployment target

This keeps the current production Worker `vocabfast` untouched while the new client is tested.

## Automatic GitHub deployment

The workflow `.github/workflows/platform-selftest.yml` builds and dry-runs the preview on every push to `vocabfast-language-platform`.

If these GitHub repository secrets exist, the same workflow also deploys the preview automatically:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token should be limited to the permissions required to deploy Workers for the intended Cloudflare account. Do not commit token values to the repository.

After the first deployment, Cloudflare shows the exact `workers.dev` address for `vocabfast-language-preview` in **Workers & Pages**.

## Cloudflare dashboard / Workers Builds alternative

If GitHub Actions secrets are not used, create a separate Workers Build for this branch with:

- repository: `Marcel3302/VocabFast`
- branch: `vocabfast-language-platform`
- root directory: `vocabfast-platform`
- build command: `npm install --no-audit --no-fund && npm run build`
- deploy command: `npx wrangler deploy --config wrangler.preview.jsonc`

Do **not** point this preview build at the production `vocabfast-web/wrangler.jsonc` configuration.

## Local/manual deploy

From `vocabfast-platform/`:

```bash
npm install
npm run deploy:preview
```

Wrangler will print the resulting preview URL.

## Health check

The isolated preview Worker exposes:

```text
/api/preview/health
```

It should return JSON containing `"service":"vocabfast-language-preview"`.

All other `/api/*` calls return a preview-only 404. The browser Coach therefore falls back to its local demo conversation until a dedicated authenticated preview backend is intentionally connected.
