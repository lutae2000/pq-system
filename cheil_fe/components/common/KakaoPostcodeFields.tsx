"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { standardFieldSx } from "@/components/common/FormControls";

export type KakaoPostcodeResult = {
  address: string;
  addressDetail: string;
  postalCode: string;
};

export type KakaoPostcodeFieldsProps = {
  address: string;
  addressDetail: string;
  disabled?: boolean;
  onChange: (value: KakaoPostcodeResult) => void;
  postalCode: string;
  title?: string;
};

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: {
        oncomplete: (data: {
          jibunAddress: string;
          roadAddress: string;
          userSelectedType: "R" | "J";
          zonecode: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

const postcodeScriptId = "kakao-postcode-script";
const postcodeScriptSrc = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let postcodeScriptPromise: Promise<void> | null = null;

const loadPostcodeScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.kakao?.Postcode) {
    return Promise.resolve();
  }

  if (postcodeScriptPromise) {
    return postcodeScriptPromise;
  }

  postcodeScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(postcodeScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Kakao postcode script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = postcodeScriptId;
    script.src = postcodeScriptSrc;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Kakao postcode script"));
    document.body.appendChild(script);
  });

  return postcodeScriptPromise;
};

export function KakaoPostcodeFields({
  address,
  addressDetail,
  disabled = false,
  onChange,
  postalCode,
  title = "주소 정보",
}: KakaoPostcodeFieldsProps) {
  const detailAddressRef = useRef<HTMLInputElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadPostcodeScript()
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setReady(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenPostcode = () => {
    if (!ready || !window.kakao) {
      return;
    }

    new window.kakao.Postcode({
      oncomplete: (data) => {
        const nextAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        onChange({
          address: nextAddress,
          addressDetail: "",
          postalCode: data.zonecode,
        });

        window.setTimeout(() => {
          detailAddressRef.current?.focus();
        }, 0);
      },
    }).open();
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, mb: 1.5 }} variant="subtitle1">
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="우편번호"
              disabled={disabled}
              onClick={handleOpenPostcode}
              size="small"
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              sx={standardFieldSx}
              value={postalCode}
            />
            <Button
              disabled={disabled || !ready}
              onClick={handleOpenPostcode}
              startIcon={<SearchOutlinedIcon />}
              sx={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
              variant="outlined"
            >
              검색
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="주소"
            disabled={disabled}
            onChange={(event) => onChange({ address: event.target.value, addressDetail, postalCode })}
            size="small"
            sx={standardFieldSx}
            value={address}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            inputRef={detailAddressRef}
            label="상세주소"
            disabled={disabled}
            onChange={(event) => onChange({ address, addressDetail: event.target.value, postalCode })}
            size="small"
            sx={standardFieldSx}
            value={addressDetail}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
