"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { IconButton, InputAdornment, Popover, TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useId, useRef, useState } from "react";
import { PatternFormat } from "react-number-format";
import { standardFieldSx } from "@/components/common/FormControls";
import { parseDateInput, type DateInputMode } from "@/modules/common/formatters";

export type DateTimeInputProps = {
  disabled?: boolean;
  label?: string;
  mode?: DateInputMode;
  /** Valid input uses YYYY-MM-DD or YYYY-MM-DD HH:mm. Incomplete or invalid input is returned as digits. */
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showLabel?: boolean;
  value: string;
};

export function DateTimeInput({
  disabled = false,
  label,
  mode = "date-time",
  onChange,
  readOnly = false,
  showLabel = true,
  value,
}: DateTimeInputProps) {
  const withTime = mode === "date-time";
  const [focused, setFocused] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimeAfterSelection = useRef(false);
  const calendarId = useId();
  const calendarLabel = label ? `${label} 달력` : "날짜 선택";
  const digits = value.replace(/\D/g, "").slice(0, withTime ? 12 : 8);
  const currentDate = parseDateInput(digits.slice(0, 8), "date");
  const editable = !disabled && !readOnly && Boolean(onChange);
  const showError = editable && !focused && parseDateInput(digits, mode) === null;

  const updateInput = (nextDigits: string) => onChange?.(parseDateInput(nextDigits, mode) ?? nextDigits);

  return (
    <>
      <PatternFormat
        customInput={TextField}
        disabled={disabled}
        error={showError}
        format={withTime ? "####-##-## ##:##" : "####-##-##"}
        fullWidth
        helperText={showError ? (withTime ? "유효한 날짜와 24시간제 시간을 입력하세요." : "유효한 날짜를 입력하세요.") : undefined}
        inputRef={inputRef}
        label={showLabel ? label : undefined}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        onValueChange={({ value: enteredDigits }, { source }) => {
          if (source === "event") updateInput(enteredDigits);
        }}
        placeholder={readOnly ? undefined : withTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD"}
        size="small"
        slotProps={{
          htmlInput: { "aria-label": showLabel && label ? undefined : label ?? "날짜", inputMode: "numeric", readOnly: !editable },
          input: !editable ? undefined : {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-controls={calendarAnchor ? calendarId : undefined}
                  aria-expanded={Boolean(calendarAnchor)}
                  aria-haspopup="dialog"
                  aria-label={calendarLabel}
                  edge="end"
                  onClick={(event) => setCalendarAnchor(event.currentTarget)}
                  onMouseDown={(event) => event.preventDefault()}
                  size="small"
                >
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
          inputLabel: { shrink: true },
        }}
        sx={standardFieldSx}
        value={digits}
        valueIsNumericString
      />
      {editable && (
        <Popover
          anchorEl={calendarAnchor}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          onClose={() => setCalendarAnchor(null)}
          open={Boolean(calendarAnchor)}
          slotProps={{
            paper: { "aria-label": calendarLabel, id: calendarId, role: "dialog" },
            transition: {
              onExited: () => {
                if (!focusTimeAfterSelection.current) return;
                focusTimeAfterSelection.current = false;
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(11, 16);
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
        >
          <LocalizationProvider adapterLocale="ko" dateAdapter={AdapterDayjs} localeText={koKR.components.MuiLocalizationProvider.defaultProps.localeText}>
            <DateCalendar
              autoFocus
              onChange={(date) => {
                if (!date) return;
                updateInput(date.format("YYYYMMDD") + (withTime ? digits.slice(8) : ""));
                focusTimeAfterSelection.current = withTime;
                setCalendarAnchor(null);
              }}
              value={currentDate ? dayjs(currentDate) : null}
            />
          </LocalizationProvider>
        </Popover>
      )}
    </>
  );
}
