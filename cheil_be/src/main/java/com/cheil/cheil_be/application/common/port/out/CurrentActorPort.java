package com.cheil.cheil_be.application.common.port.out;

/** Provides the actor that is executing the current use case. */
public interface CurrentActorPort {
    String currentActor();
}
