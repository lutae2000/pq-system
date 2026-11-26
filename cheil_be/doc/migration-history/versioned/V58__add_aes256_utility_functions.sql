CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION aes256_enc(p_plaintext TEXT, p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_plaintext IS NULL THEN
        RETURN NULL;
    END IF;

    IF p_key IS NULL OR btrim(p_key) = '' THEN
        RAISE EXCEPTION 'AES256 key is required';
    END IF;

    RETURN encode(
        pgp_sym_encrypt(p_plaintext, lower(btrim(p_key)), 'cipher-algo=aes256'),
        'base64'
    );
END;
$$;

CREATE OR REPLACE FUNCTION aes256_dec(p_ciphertext TEXT, p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_ciphertext IS NULL THEN
        RETURN NULL;
    END IF;

    IF p_key IS NULL OR btrim(p_key) = '' THEN
        RAISE EXCEPTION 'AES256 key is required';
    END IF;

    RETURN pgp_sym_decrypt(
        decode(p_ciphertext, 'base64'),
        lower(btrim(p_key))
    );
END;
$$;
