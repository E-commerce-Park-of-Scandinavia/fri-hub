-- FRI Hub — phone number on participant profiles
--
-- Visible to the participant's own cohort only, like the rest of the profile:
-- the existing participants policies already scope it, so nothing else changes.

alter table participants add column if not exists phone text;
