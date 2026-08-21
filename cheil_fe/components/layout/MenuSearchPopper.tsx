"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Autocomplete, Box, IconButton, InputAdornment, Popper, TextField, Typography, Tooltip } from "@mui/material";
import { useEffect, useState, type KeyboardEvent } from "react";

export type SearchMenuItem = {
  href: string;
  label: string;
  pathLabel: string;
};

type MenuSearchPopperProps = {
  items: SearchMenuItem[];
  loading?: boolean;
  onNavigate: (href: string) => boolean;
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

export function MenuSearchPopper({ items, loading = false, onNavigate }: MenuSearchPopperProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const findBestMatch = (input: string) => {
    const query = normalize(input.trim());
    if (!query) {
      return null;
    }

    return (
      items.find((item) => normalize(item.pathLabel) === query || normalize(item.label) === query) ??
      items.find((item) => normalize(item.pathLabel).includes(query) || normalize(item.label).includes(query))
    );
  };

  const navigateToBestMatch = (input: string) => {
    const match = findBestMatch(input);
    if (!match || !onNavigate(match.href)) {
      return;
    }

    setValue("");
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    navigateToBestMatch(value);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (anchorEl?.contains(target) || document.querySelector("[data-menu-search-popper]")?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorEl, open]);

  return (
    <>
      <Tooltip title="메뉴 검색">
        <IconButton
          aria-label="메뉴 검색"
          color="inherit"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            setOpen((current) => !current);
          }}
          size="small"
          sx={{
            bgcolor: open ? "primary.main" : "action.hover",
            border: "1px solid",
            borderColor: open ? "primary.main" : "divider",
            color: open ? "primary.contrastText" : "inherit",
            height: 32,
            p: 0,
            width: 32,
            "&:hover": { bgcolor: open ? "primary.dark" : "action.selected" },
          }}
        >
          <SearchOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popper
        anchorEl={anchorEl}
        data-menu-search-popper
        open={open}
        placement="bottom-start"
        sx={{ mt: 1, width: 260, zIndex: (theme) => theme.zIndex.modal }}
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            boxShadow: "0 16px 50px rgba(15, 23, 42, 0.16)",
            p: 1,
          }}
        >
          <Autocomplete<SearchMenuItem, false, false, false>
            autoHighlight
            clearOnBlur={false}
            data-testid="menu-search"
            filterOptions={(options, state) => {
              const query = normalize(state.inputValue);
              if (!query) {
                return options.slice(0, 8);
              }

              return options
                .filter((item) => normalize(item.pathLabel).includes(query) || normalize(item.label).includes(query))
                .slice(0, 8);
            }}
            getOptionLabel={(option) => option.pathLabel}
            getOptionKey={(option) => `${option.href}:${option.pathLabel}`}
            inputValue={value}
            loading={loading}
            noOptionsText="검색 결과가 없습니다"
            onChange={(_, selectedItem) => {
              if (selectedItem && onNavigate(selectedItem.href)) {
                setValue("");
                setOpen(false);
              }
            }}
            onInputChange={(_, nextValue, reason) => {
              if (reason !== "reset") {
                setValue(nextValue);
              }
            }}
            open
            options={items}
            sx={{ width: "100%" }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box
                  key={key ?? `${option.href}:${option.pathLabel}`}
                  component="li"
                  {...optionProps}
                  sx={{
                    alignItems: "flex-start",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    minWidth: 0,
                    py: 0.75,
                    width: "100%",
                  }}
                >
                  <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>
                    {option.label}
                  </Typography>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: 12,
                      lineHeight: 1.25,
                      overflowWrap: "anywhere",
                      whiteSpace: "normal",
                      wordBreak: "break-all",
                    }}
                  >
                    {option.pathLabel}
                  </Typography>
                </Box>
              );
            }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  border: 0,
                  boxShadow: "none",
                  mt: 0.75,
                  "& .MuiAutocomplete-listbox": { p: 0 },
                  "& .MuiAutocomplete-option": {
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    minHeight: 48,
                    textAlign: "left",
                  },
                },
              },
              popper: {
                disablePortal: true,
                sx: { position: "static !important", transform: "none !important" },
              },
            }}
            value={null}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                autoComplete="off"
                aria-label="메뉴 검색"
                onKeyDown={handleKeyDown}
                placeholder="메뉴 검색"
                size="small"
                sx={{
                  textAlign: "left",
                  width: "100%",
                  "& input": { textAlign: "left" },
                }}
                slotProps={{
                  ...params.slotProps,
                  htmlInput: {
                    ...params.slotProps?.htmlInput,
                    autoComplete: "off",
                    style: { ...params.slotProps?.htmlInput?.style, textAlign: "left" },
                  },
                  input: {
                    ...params.slotProps?.input,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment>
                        {params.slotProps?.input?.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        </Box>
      </Popper>
    </>
  );
}
