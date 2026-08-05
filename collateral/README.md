# Collateral

Sales leave-behinds. One HTML file per piece, rendered to a PDF you can attach to an email.

These are **not** part of the site. Nothing here is routed, registered in `docs.json`, or
listed in the sitemap, and the content scanners (`seo-audit.js`, `build-search-index.js`)
only look at `src/` and `user-guide/`. A file landing in this folder does not go public.

## Why HTML and not a design tool

The copy is the part that matters and the part that goes stale. In HTML a reviewer can see
in a diff that a claim changed; in a PDF or a Figma frame they cannot. So the HTML is the
source of truth, the PDF is the artifact, and both are committed — the PDF because that is
what actually gets sent, the `.preview.png` because it makes the pull request reviewable
without downloading anything.

## Rendering

```bash
node scripts/render-collateral.js                                   # every piece in this folder
node scripts/render-collateral.js collateral/nbcuniversal-one-pager.html
node scripts/render-collateral.js --png                             # also write the preview image
```

Zero dependencies. It drives whatever Chrome or Chromium is already installed, and prints the
page count of each PDF it writes — **that number is the fit test.** A one-pager that reports
2 pages has outgrown its page, and no amount of squinting at the preview will tell you sooner.

If the script cannot find a browser, point it at one: `CHROME_PATH=/path/to/chrome node scripts/render-collateral.js`.

### If the copy stops fitting

Measure before you start shrinking type. Drop this into the HTML, load it, read the title:

```html
<script>addEventListener('load', () => setTimeout(() => {
  const p = document.querySelector('.page');
  p.style.height = 'auto';
  document.title = 'over=' + ((p.getBoundingClientRect().height - 1056) / 96).toFixed(3) + 'in';
}, 300));</script>
```

Overflowing by a hundredth of an inch and overflowing by an inch look identical in a PDF page
count, and they want completely different fixes.

## House rules for anything written here

[`.agents/brand-voice.md`](../.agents/brand-voice.md) governs the words, the same as it governs
the site. In particular, **every capability described in a leave-behind has to trace to
something that has actually shipped.** No metrics we have not measured, no customer counts, no
roadmap dates. A one-pager is read by someone deciding whether to trust us, and it is the
easiest document in the company to overclaim in.

Two ways this folder differs from the site:

- **Naming the recipient is the point.** `AGENTS.md` §6 bans real brand names because the site's
  mockups and examples must not borrow someone else's identity. A leave-behind addressed to a
  named prospect is a different thing. Name them in the "Prepared for" line, and stop there —
  no third-party logos, no claims about their operation, nothing that could read as their
  document rather than ours.
- **Plan tiers stay off the page.** Several of these capabilities are gated by plan, and plan
  facts live in the pricing registry on the product side rather than in this repo. The fine
  print says availability varies by plan, and the specifics belong in the conversation that
  follows, quoted from the registry.

## Pieces

| File | Prepared for | What it argues |
|---|---|---|
| `nbcuniversal-one-pager.html` | NBCUniversal | Maps five stated pain points — crew assignments, upcoming shoots, who is overseeing each one, shoot details, scheduling — onto what ABRAM does today. |
