"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { IconButton, InputAdornment, Popover, TextField, type TextFieldProps } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import type { DateView } from "@mui/x-date-pickers/models";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { koKR } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { PatternFormat } from "react-number-format";
import { standardFieldSx } from "@/components/common/FormControls";
import { parseDateInput, type DateInputMode } from "@/modules/common/formatters";

const calendarFormats: Record<DateInputMode, { mask: string; placeholder: string; digits: number; views: DateView[] }> = {
  "date-time": { mask: "####-##-## ##:##", placeholder: "YYYY-MM-DD HH:mm", digits: 12, views: ["year", "day"] },
  date: { mask: "####-##-##", placeholder: "YYYY-MM-DD", digits: 8, views: ["year", "day"] },
  month: { mask: "####-##", placeholder: "YYYY-MM", digits: 6, views: ["year", "month"] },
  year: { mask: "####", placeholder: "YYYY", digits: 4, views: ["year"] },
};

export type DateTimeInputProps = Pick<TextFieldProps,
  "autoFocus" | "disabled" | "error" | "fullWidth" | "helperText" | "onBlur" | "onFocus" | "onKeyDown" | "required" | "size" | "sx"
> & {
  ariaLabel?: string;
  inGrid?: boolean;
  label?: string;
  max?: string;
  min?: string;
  mode?: DateInputMode;
  /** Emits formatted values and incomplete input so callers can validate their entire draft. */
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showLabel?: boolean;
  value: string;
};

export function DateTimeInput({
  ariaLabel,
  autoFocus,
  disabled = false,
  error = false,
  fullWidth = true,
  helperText,
  inGrid = false,
  label,
  max,
  min,
  mode = "date-time",
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  readOnly = false,
  required,
  showLabel = true,
  size = "small",
  sx = standardFieldSx,
  value,
}: DateTimeInputProps) {
  const withTime = mode === "date-time";
  const format = calendarFormats[mode];
  const [focused, setFocused] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const focusTimeAfterSelection = useRef(false);
  const calendarId = useId();
  const calendarLabel = label ? `${label} 달력` : "날짜 선택";
  const digits = value.replace(/\D/g, "").slice(0, format.digits);
  const calendarValue = parseDateInput(digits.slice(0, 8), withTime ? "date" : mode);
  const currentDate = calendarValue && (mode === "month" ? `${calendarValue}-01` : mode === "year" ? `${calendarValue}-01-01` : calendarValue);
  const minDate = parseDateInput(min ?? "", "date");
  const maxDate = parseDateInput(max ?? "", "date");
  const editable = !disabled && !readOnly && Boolean(onChange);
  const showError = editable && !focused && parseDateInput(digits, mode) === null;

  const updateInput = (nextDigits: string) => onChange?.(parseDateInput(nextDigits, mode) ?? nextDigits);

  return (
    <>
      <PatternFormat
        customInput={TextField}
        autoFocus={autoFocus}
        disabled={disabled}
        error={error || showError}
        format={format.mask}
        fullWidth={fullWidth}
        helperText={helperText ?? (showError && !inGrid ? (withTime ? "유효한 날짜와 24시간제 시간을 입력하세요." : `날짜를 ${format.placeholder} 형식으로 입력하세요.`) : undefined)}
        inputRef={inputRef}
        label={showLabel ? label : undefined}
        onBlur={(event) => {
          setFocused(false);
          if (inGrid && calendarAnchor) event.stopPropagation();
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onKeyDown={(event) => {
          if (editable && event.altKey && event.key === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            setCalendarAnchor(calendarButtonRef.current);
            return;
          }
          onKeyDown?.(event);
        }}
        onValueChange={({ value: enteredDigits }, { source }) => {
          if (source === "event") updateInput(enteredDigits);
        }}
        placeholder={readOnly ? undefined : format.placeholder}
        required={required}
        size={size}
        slotProps={{
          htmlInput: { "aria-label": ariaLabel ?? (showLabel && label ? undefined : label ?? "날짜"), inputMode: "numeric", readOnly: !editable },
          input: !editable ? undefined : {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-controls={calendarAnchor ? calendarId : undefined}
                  aria-expanded={Boolean(calendarAnchor)}
                  aria-haspopup="dialog"
                  aria-label={calendarLabel}
                  edge="end"
                  onClick={(event) => {
                    if (inGrid) event.stopPropagation();
                    setCalendarAnchor(event.currentTarget);
                  }}
                  onKeyDown={(event) => {
                    if (inGrid && (event.key === "Enter" || event.key === " ")) event.stopPropagation();
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  ref={calendarButtonRef}
                  size="small"
                >
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
          inputLabel: { shrink: true },
        }}
        sx={sx}
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
            paper: {
              "aria-label": calendarLabel,
              id: calendarId,
              role: "dialog",
              onBlur: inGrid ? (event: FocusEvent) => event.stopPropagation() : undefined,
              onClick: inGrid ? (event: MouseEvent) => event.stopPropagation() : undefined,
              onKeyDown: inGrid ? (event: KeyboardEvent) => {
                event.stopPropagation();
                if (event.key === "Escape") setCalendarAnchor(null);
              } : undefined,
            },
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
              minDate={minDate ? dayjs(minDate) : undefined}
              maxDate={maxDate ? dayjs(maxDate) : undefined}
              openTo={mode === "year" || mode === "month" ? mode : "day"}
              views={format.views}
              onChange={(date) => {
                if (!date) return;
                const dateDigits = date.format("YYYYMMDD");
                updateInput(withTime ? dateDigits + digits.slice(8) : dateDigits.slice(0, format.digits));
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

/** Keeps incomplete edits local and emits dates only after they are valid. */
export function DateInput({ mode = "date", min, max, onBlur, onChange, onFocus, onKeyDown, value, ...props }: DateTimeInputProps) {
  const [draft, setDraft] = useState<{ base: string; value: string } | null>(null);
  const [rejected, setRejected] = useState(false);
  const pending = draft?.base === value ? draft.value : null;
  const dateLength = mode === "year" ? 4 : mode === "month" ? 7 : 10;
  const minDate = parseDateInput(min ?? "", "date")?.slice(0, dateLength);
  const maxDate = parseDateInput(max ?? "", "date")?.slice(0, dateLength);

  return (
    <DateTimeInput
      {...props}
      error={props.error || rejected}
      helperText={rejected && !props.inGrid ? "입력한 날짜를 확인해 주세요. 기존 값이 유지됩니다." : props.helperText}
      max={max}
      min={min}
      mode={mode}
      onBlur={(event) => {
        if (pending !== null) {
          setDraft(null);
          setRejected(true);
        }
        onBlur?.(event);
      }}
      onChange={onChange && ((next) => {
        const parsed = parseDateInput(next, mode);
        const date = parsed?.slice(0, dateLength) ?? "";
        if (parsed === null || (parsed && ((minDate && date < minDate) || (maxDate && date > maxDate)))) {
          setDraft({ base: value, value: next });
          return;
        }
        setDraft(null);
        setRejected(false);
        onChange(parsed);
      })}
      onFocus={(event) => {
        setRejected(false);
        onFocus?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && pending !== null) {
          event.preventDefault();
          event.stopPropagation();
          setRejected(true);
          return;
        }
        onKeyDown?.(event);
      }}
      value={pending ?? value}
    />
  );
}
