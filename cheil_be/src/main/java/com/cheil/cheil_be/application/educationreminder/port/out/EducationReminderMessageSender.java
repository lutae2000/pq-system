package com.cheil.cheil_be.application.educationreminder.port.out;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderMessageSendCommand;
import com.cheil.cheil_be.application.educationreminder.model.EducationReminderMessageSendResult;

public interface EducationReminderMessageSender {

    EducationReminderMessageSendResult send(EducationReminderMessageSendCommand command);
}
