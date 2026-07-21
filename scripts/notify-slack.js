#!/usr/bin/env node
/**
 * notify-slack.js
 *
 * Posts a message to Slack via an Incoming Webhook. This is the reliable way to
 * notify Slack from a headless / scheduled (cron) run, because it does NOT depend
 * on an interactively-authenticated Slack connector — which is not available when
 * the Scheduled Error Triage agent runs in the cloud.
 *
 * Setup (one time):
 *   1. Create a Slack Incoming Webhook bound to the #platform-triage-report channel.
 *      (Slack App -> Incoming Webhooks -> Add New Webhook to Workspace -> pick the channel.)
 *   2. Add the resulting URL as a secret/env var on the scheduled agent:
 *        SLACK_TRIAGE_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
 *
 * Usage:
 *   node scripts/notify-slack.js "Triage complete: 3 new errors found"
 *   echo "multi-line report" | node scripts/notify-slack.js
 *
 * Exit codes:
 *   0  message delivered
 *   1  misconfiguration (missing webhook URL or empty message)
 *   2  Slack rejected the request / network failure
 *
 * NOTE: An incoming webhook always posts to the single channel it was created for.
 * To target #platform-triage-report, the webhook itself must be created for that
 * channel. There is no reliable per-message channel override on modern webhooks.
 */

const WEBHOOK_URL =
  process.env.SLACK_TRIAGE_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
}

async function main() {
  if (!WEBHOOK_URL) {
    console.error(
      '[notify-slack] Missing webhook URL. Set SLACK_TRIAGE_WEBHOOK_URL ' +
        '(or SLACK_WEBHOOK_URL) to a Slack Incoming Webhook for #platform-triage-report.'
    );
    process.exit(1);
  }

  const argText = process.argv.slice(2).join(' ').trim();
  const text = argText || (await readStdin());

  if (!text) {
    console.error('[notify-slack] No message provided (pass as an argument or via stdin).');
    process.exit(1);
  }

  let res;
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error(`[notify-slack] Network error posting to Slack: ${err.message}`);
    process.exit(2);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[notify-slack] Slack rejected the message: ${res.status} ${res.statusText} ${body}`);
    process.exit(2);
  }

  console.log('[notify-slack] Delivered to Slack.');
}

main();
