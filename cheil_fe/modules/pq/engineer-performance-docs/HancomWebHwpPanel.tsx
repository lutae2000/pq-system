"use client";

import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import type { BidNoticeApiRecord } from "@/modules/pq/bid-notice/bidNoticeApi";
import type { EngineerProfile } from "@/modules/pq/engineers/EngineerPersonalInfoTypes";

const WEB_HWP_URL = process.env.NEXT_PUBLIC_HANCOM_WEBHWP_URL ?? "http://192.168.2.9:8080/webhwpctrl/";

type Props = { bidNotice: BidNoticeApiRecord | null; profiles: EngineerProfile[]; open: boolean };

export function HancomWebHwpPanel({ bidNotice, profiles, open }: Props) {
  const mappingPayload = useMemo(() => ({ type: "CHEIL_ENGINEER_PERFORMANCE_MAPPING", bidNotice, engineers: profiles }), [bidNotice, profiles]);
  if (!open) return null;

  const sendMapping = () => {
    document.querySelector<HTMLIFrameElement>("[data-hancom-webhwp]")?.contentWindow?.postMessage(mappingPayload, new URL(WEB_HWP_URL).origin);
  };

  return <Card variant="outlined"><CardContent><Stack spacing={1.5}><Box><Typography sx={{ fontWeight: 800 }} variant="h6">2. 한컴 웹 기안기 직접 매핑 PoC</Typography><Typography color="text.secondary" variant="body2">웹 기안기에서 수신하도록 필드명과 기술인 데이터를 postMessage로 전달합니다.</Typography></Box><Alert severity="info">웹 기안기 서버가 해당 메시지 타입을 수신하도록 연동되어 있어야 합니다. 서버가 열리지 않으면 새 창으로 확인할 수 있습니다.</Alert><Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}><Button onClick={sendMapping} startIcon={<SendOutlinedIcon />} variant="contained">선택 기술인 데이터 전송</Button><Button href={WEB_HWP_URL} rel="noreferrer" startIcon={<OpenInNewOutlinedIcon />} target="_blank" variant="outlined">웹 기안기 새 창</Button></Box><Box sx={{ border: 1, borderColor: "divider", height: 520, overflow: "hidden" }}><iframe data-hancom-webhwp height="100%" src={WEB_HWP_URL} title="한컴 웹 기안기 PoC" width="100%" /></Box></Stack></CardContent></Card>;
}
