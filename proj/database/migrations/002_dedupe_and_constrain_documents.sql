-- Migration 002: dedupe legacy duplicate document rows, then enforce
-- one-row-per-(candidate, doc_type) at the database level.
--
-- WHEN TO RUN THIS:
-- Only needed against a database that already existed before this change.
-- A brand-new database created from the current schema.sql already has the
-- uq_candidate_doctype constraint and never needs this file.
--
-- Run this BEFORE starting the backend against an existing database, because
-- the app runs with spring.jpa.hibernate.ddl-auto=update, and Hibernate will
-- try to add the same unique constraint on boot (see DocumentRecord.java) -
-- that ALTER TABLE will fail with a duplicate-key error if any duplicate
-- (candidate_id, doc_type) rows are still present.
--
-- WHAT IT DOES:
-- 1) For every (candidate_id, doc_type) group with more than one row, keeps
--    exactly one: the VERIFIED one if there is one, else the REJECTED one,
--    else the PENDING one - and among ties, the most recently uploaded (the
--    highest id). This never deletes a verified/valid document to make the
--    UI look right; it only removes the redundant duplicate(s).
-- 2) Adds the unique constraint so this class of bug can't recur.
--
-- This is idempotent for step 1 (running it again with no duplicates left
-- is a no-op) but step 2 will error if the constraint already exists; drop
-- that last statement if you're re-running just the cleanup.

USE onboardflow_db;

DELETE d FROM documents d
JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY candidate_id, doc_type
      ORDER BY
        CASE status
          WHEN 'VERIFIED' THEN 3
          WHEN 'REJECTED' THEN 2
          WHEN 'PENDING'  THEN 1
          ELSE 0
        END DESC,
        id DESC
    ) AS row_rank
  FROM documents
) ranked ON ranked.id = d.id
WHERE ranked.row_rank > 1;

ALTER TABLE documents
  ADD CONSTRAINT uq_candidate_doctype UNIQUE (candidate_id, doc_type);
