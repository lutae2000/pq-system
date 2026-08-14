"use client";

import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Card, CardContent, InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Children, type ReactNode } from "react";

import { standardFieldSx } from "@/components/common/FormControls";

export type SearchPanelProps = {
  actions?: ReactNode;
  children?: ReactNode;
  keyword: string;
  keywordLabel?: string;
  keywordPlaceholder?: string;
  keywordSx?: SxProps<Theme>;
  keywordIndex?: number;
  onKeywordChange: (keyword: string) => void;
  onSearch: (keyword: string) => void;
  onReset: () => void;
  resetLabel?: string;
  searchDisabled?: boolean;
  searchLabel?: string;
};

export function SearchPanel({
  actions,
  children,
  keyword,
  keywordLabel = "검색어",
  keywordPlaceholder = "검색어를 입력하세요.",
  keywordSx,
  keywordIndex = 0,
  onKeywordChange,
  onSearch,
  onReset,
  resetLabel = "초기화",
  searchDisabled = false,
  searchLabel = "조회",
}: SearchPanelProps) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (searchDisabled) {
              return;
            }

            const nextKeyword = keyword;
            onKeywordChange(nextKeyword);
            onSearch(nextKeyword);
          }}
          sx={{
            alignItems: "flex-start",
            display: "flex",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flex: "1 1 auto",
              flexWrap: "wrap",
              gap: 1.25,
              minWidth: 0,
              "& > .MuiFormControl-root": {
                flex: "0 1 180px",
                maxWidth: "100%",
                width: "auto",
              },
              "& > .MuiBox-root": {
                flex: "0 1 180px",
                maxWidth: "100%",
                width: "auto",
              },
            }}
          >
            {(() => {
              const items = Children.toArray(children);
              const insertAt = Math.max(0, Math.min(keywordIndex, items.length));
              const keywordField = (
                <TextField
                  key="search-panel-keyword"
                  fullWidth
                  label={keywordLabel}
                  onChange={(event) => onKeywordChange(event.target.value)}
                  placeholder={keywordPlaceholder}
                  size="small"
                  sx={[
                    standardFieldSx,
                    { flex: "1 1 240px", maxWidth: 320, minWidth: 220, width: "auto" },
                    ...(Array.isArray(keywordSx) ? keywordSx : keywordSx ? [keywordSx] : []),
                  ]}
                  value={keyword}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              );

              return [...items.slice(0, insertAt), keywordField, ...items.slice(insertAt)];
            })()}
          </Box>

          <Box
            sx={{
              display: "flex",
              flex: "0 0 auto",
              flexWrap: "nowrap",
              gap: 1,
              justifyContent: "flex-end",
            }}
          >
            {actions}
            <Button
              color="primary"
              disabled={searchDisabled}
              startIcon={<SearchOutlinedIcon />}
              sx={{ minWidth: 88, whiteSpace: "nowrap" }}
              type="submit"
              variant="contained"
            >
              {searchLabel}
            </Button>
            <Button
              color="inherit"
              onClick={() => {
                onKeywordChange("");
                onReset();
              }}
              startIcon={<RestartAltOutlinedIcon />}
              sx={{ minWidth: 88, whiteSpace: "nowrap" }}
              type="button"
              variant="outlined"
            >
              {resetLabel}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
