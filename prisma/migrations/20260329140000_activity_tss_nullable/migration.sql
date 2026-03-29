-- Nullable tss (power-based TSS skipped when avg power or duration invalid).
-- Kept for databases that applied an older Activity DDL with tss NOT NULL; harmless if already nullable.
ALTER TABLE "Activity" ALTER COLUMN "tss" DROP NOT NULL;
