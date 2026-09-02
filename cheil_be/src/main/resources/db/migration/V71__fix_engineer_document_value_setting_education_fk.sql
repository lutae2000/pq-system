ALTER TABLE pq_engineer_document_value_settings
    DROP CONSTRAINT fk_pq_document_value_setting_education;

ALTER TABLE pq_engineer_document_value_settings
    ADD CONSTRAINT fk_pq_document_value_setting_school
        FOREIGN KEY (selected_education_id) REFERENCES pq_engineer_school (id) ON DELETE SET NULL;
