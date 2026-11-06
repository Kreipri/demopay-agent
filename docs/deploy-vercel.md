# Publish on your free Vercel account

No paid plan or real cryptocurrency is needed for this Testnet sandbox. Vercel usage remains subject to your account's free-plan limits; do not enable paid upgrades.

1. Import the public repository https://github.com/Kreipri/demopay-agent into Vercel.
2. Keep the project root at the repository root. The committed vercel.json specifies the build command and web output directory; do not change the root to apps/web, which would exclude the API and shared packages.
3. Use Node 24.x with a patched version meeting the Noir SDK's minimum.
4. Add each key from your local .env to Vercel's private environment settings, using the exact values generated for your dedicated Testnet sandbox. Do not paste the file into chat or GitHub. Set APP_URL to the public production origin.
5. Add the Velo project Testnet API key as VELO_API_KEY. Configure Velo's receiving wallet and activate Velo Pay with Testnet XLM if the dashboard requires it.
6. Deploy. Verify /api/health returns the Testnet health response, then check the dashboard's live 17 XLM escrow balance and transaction trail.
7. Create a Velo contribution checkout as the operator. Complete it with Testnet funds. Use Verify status and confirm the Velo API returns paid; the return URL alone is insufficient.
8. Configure https://YOUR_SITE/api/webhooks/velo in Velo, save its signing secret privately as VELO_WEBHOOK_SECRET in Vercel, and redeploy. Send a signed test notification and check that a forged request is rejected.
9. Open the production website in a logged-out browser. If Vercel deployment protection requires login, disable protection for the production deployment so judges can access it.
10. Put the verified public URL, demo video, pitch deck, registered name and Discord handle in README.

The already-paid fixture cannot be paid twice. For a fresh recorded demonstration, initialize a new software device with a new DEVICE_HASH and SETUP_LEDGER, using the setup script; preserve the existing public proof. Never change the invoice nonce just to bypass replay protection.
