# Deployment

Categorium is a fully static single-page app (no backend, no accounts — progress lives in
localStorage). The preferred host is **AWS S3 static website hosting**, with CloudFront as an
optional later upgrade and EC2 only as a fallback if static hosting ever becomes insufficient.

## Build

```bash
npm install
npm run build      # type-checks (strict) and emits dist/
npm run preview    # optional: verify the production build locally
```

The deployable artifact is the `dist/` directory.

## AWS S3 static hosting (preferred)

1. **Create a bucket** (globally unique name), e.g. `categorium-app`.
2. **Enable static website hosting** on the bucket: set the index document to `index.html`.
   Because this is a client-side-routed SPA, also set the **error document to `index.html`**
   so deep links like `/chapter/chapter-01-transformations/puzzle/puzzle-01` resolve.
3. **Upload** the build:
   ```bash
   aws s3 sync dist/ s3://categorium-app --delete
   ```
4. **Make objects public** for website access (bucket policy granting `s3:GetObject` to
   `*`), or front the bucket with CloudFront (below) and keep the bucket private via OAC.
5. The site is served at the S3 website endpoint
   (`http://<bucket>.s3-website-<region>.amazonaws.com`).

### Cache note
`index.html` should be served with a short/no-cache header and hashed JS/CSS assets with a
long cache, so deploys are picked up immediately without serving stale chunks.

## CloudFront (optional, later)

Add a CloudFront distribution in front of the bucket for HTTPS, a custom domain, and a CDN:
- Origin = the S3 bucket (use Origin Access Control to keep the bucket private).
- Configure a **custom error response**: 403/404 → `/index.html` with HTTP 200, again to
  support SPA client-side routing.
- Invalidate `/*` (or at least `/index.html`) after each deploy.

## EC2 fallback (only if necessary)

If static hosting ever proves insufficient (e.g. a future server-rendered or API-backed mode):
1. Provision a small EC2 instance.
2. Serve `dist/` behind nginx (or `serve`), with an SPA fallback rewriting unknown routes to
   `index.html`.
3. Terminate TLS at nginx or via an ALB / Let's Encrypt.

No deployment automation (CI/CD) is required yet; the manual `npm run build` + `aws s3 sync`
flow is the supported path for now.
