ALTER TABLE new_technology_developments
    DROP COLUMN IF EXISTS sequence_label;

DROP SEQUENCE IF EXISTS new_technology_developments_sequence_label_seq;
