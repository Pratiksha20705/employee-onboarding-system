# Database setup
1. Start MySQL 8+
2. `mysql -u root -p < schema.sql`
3. `mysql -u root -p < seed.sql`   (optional demo data; the app also auto-creates the admin user on first boot via DataInitializer)

# Migrations
`migrations/` contains changes to apply against a database that already
exists (schema.sql alone only covers brand-new databases). Apply them in
order, once each:

- `mysql -u root -p < migrations/002_dedupe_and_constrain_documents.sql`
  Only needed if your `documents` table predates this migration. Cleans up
  any duplicate (candidate_id, doc_type) rows and adds the
  `uq_candidate_doctype` constraint. Run this before starting the backend,
  since Hibernate (`ddl-auto=update`) will try to add the same constraint on
  boot and will fail if duplicates are still present.
