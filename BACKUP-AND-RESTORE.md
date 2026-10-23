# Backup and restore

What protects the shop's data, and how to get it back.

## What is backed up, and where

| What | Where it lives | Backed up by |
|---|---|---|
| Orders, order items, books, notification rules, saved addresses, wishlists | Supabase database | **Supabase** (see "Supabase's own backups"), plus **the download below** |
| Customer login accounts (phone / Google) | Supabase Auth | **Supabase only** — the download cannot include them |
| Book cover images | Supabase Storage (`covers` bucket) and `public/covers` in the code | Code is in GitHub; the Storage bucket is **not** in the download |
| The website's code | GitHub | GitHub |
| Secrets (`.env.local`, Vercel settings) | Your computer / Vercel | **Nobody** — keep a private copy in a password manager |

## Supabase's own backups

Supabase's plans change, so check what yours includes rather than trusting this page: supabase.com → your project → Database → Backups.

- As far as we know, the **free plan** has no backups you can restore from. If so, that is the main risk, and it's why the download below exists.
- Paid plans keep daily backups for a few days, restorable from that same page. Point-in-time recovery is a separate paid add-on.

## Take a backup yourself (do this regularly, and before any risky change)

1. Open the admin → **System** → **Download backup**.
2. You get one file, `ssp-backup-YYYY-MM-DD.json`.
3. **Keep it private.** It contains customers' names, phone numbers and addresses. Don't email it or put it in a shared folder.

Suggested habit: once a week, and always before running new SQL on the live database.

## Restore from a backup file

1. In the project folder (the one with `.env.local`), preview first. This changes nothing:

   ```bash
   node scripts/restore-backup.mjs path/to/ssp-backup-2026-10-23.json
   ```

   It lists how many rows of each table are in the file and how many are in the database now.

2. If it looks right, restore:

   ```bash
   node scripts/restore-backup.mjs path/to/ssp-backup-2026-10-23.json --apply
   ```

What the restore does and doesn't do:
- It **adds or overwrites rows by their id**. It never deletes, so anything created after the backup was taken is left alone.
- Tables are restored parents-first (books, orders, order items, notification rules, then saved addresses and wishlists).
- Saved addresses and wishlists point at customer accounts. If an account no longer exists, those rows fail and the script says so. Accounts are restored from Supabase's own backups, not from this file.
- The tables themselves must already exist. To rebuild an empty database, run `supabase/schema.sql` first.

## A customer paid but has no order

If a payment went through but the order wasn't saved, it appears in Admin → System as a **critical** error, with the customer's name, phone, email, items and the payment id. Check the payment in the Razorpay dashboard first. There is no "create order" screen in the admin yet, so the order has to be added by hand in the Supabase table editor (one row in `orders`, and one row per book in `order_items`) from those details. Then mark the error resolved.
