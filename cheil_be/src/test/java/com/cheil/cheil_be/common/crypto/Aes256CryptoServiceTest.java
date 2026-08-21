package com.cheil.cheil_be.common.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class Aes256CryptoServiceTest {

    private final Aes256CryptoService cryptoService = new Aes256CryptoService("phonetestkey");

    @Test
    void encryptsAndDecryptsPhoneNumber() {
        String phoneNo = "01012345678";

        String encrypted = cryptoService.encrypt(phoneNo);

        assertThat(encrypted).startsWith("v1:").doesNotContain(phoneNo);
        assertThat(cryptoService.decrypt(encrypted)).isEqualTo(phoneNo);
    }

    @Test
    void usesDifferentCiphertextForEachEncryption() {
        String first = cryptoService.encrypt("01012345678");
        String second = cryptoService.encrypt("01012345678");

        assertThat(first).isNotEqualTo(second);
        assertThat(cryptoService.decrypt(first)).isEqualTo("01012345678");
        assertThat(cryptoService.decrypt(second)).isEqualTo("01012345678");
    }

    @Test
    void rejectsWrongKey() {
        String encrypted = cryptoService.encrypt("01012345678");
        Aes256CryptoService anotherCryptoService = new Aes256CryptoService("anotherkey");

        assertThatThrownBy(() -> anotherCryptoService.decrypt(encrypted))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AES-256 decryption failed");
    }
}
