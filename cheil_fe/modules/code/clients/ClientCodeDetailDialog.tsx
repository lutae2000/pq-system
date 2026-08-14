"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { KakaoPostcodeFields } from "@/components/common/KakaoPostcodeFields";
import type { ClientCodeClassification, ClientCodeRecord } from "@/modules/code/clients/clientCodes.types";
import { standardFieldSx } from "@/components/common/FormControls";

type ClientCodeDetailDialogProps = {
  onChangeField: <K extends keyof ClientCodeRecord>(field: K, value: ClientCodeRecord[K]) => void;
  onClose: () => void;
  onDelete: () => void;
  onOpenContactManager: () => void;
  onSave: () => void;
  open: boolean;
  record: ClientCodeRecord;
};

const classifications: ClientCodeClassification[] = ["정부", "지방자치단체", "관공서", "민간기업", "공공기관"];
const parentOrganizations = ["국토해양부", "국토교통부", "환경부", "행정안전부", "정부"];

function Section({ children, description, title }: { children: ReactNode; description?: string; title: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="subtitle1">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
            {description}
          </Typography>
        ) : null}
        <Grid container spacing={1.5}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  );
}

function Field({ children, sm = 6, xs = 12 }: { children: ReactNode; sm?: number; xs?: number }) {
  return <Grid size={{ xs, sm }}>{children}</Grid>;
}

export function ClientCodeDetailDialog({
  onChangeField,
  onClose,
  onDelete,
  onOpenContactManager,
  onSave,
  open,
  record,
}: ClientCodeDetailDialogProps) {
  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open} scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              발주처 상세
            </Typography>
            <Typography color="text.secondary" variant="body2">
              첨부 화면 구조를 유지하면서 표준 스타일로 정리했습니다.
            </Typography>
          </Box>
          <Button onClick={onOpenContactManager} variant="outlined" size="small">
            발주처담당자
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ backgroundColor: "background.paper", p: 2.5 }}>
        <Stack spacing={2}>
          <Section title="기본 정보" description="발주처 식별 및 분류 정보를 입력합니다.">
            <Field sm={4}>
              <TextField fullWidth label="발주처번호" size="small" value={record.code} onChange={(event) => onChangeField("code", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={4}>
              <TextField
                fullWidth
                label="발주처분류"
                select
                size="small"
                value={record.classification}
                onChange={(event) => onChangeField("classification", event.target.value as ClientCodeClassification)}
                sx={standardFieldSx}
              >
                {classifications.map((classification) => (
                  <MenuItem key={classification} value={classification}>
                    {classification}
                  </MenuItem>
                ))}
              </TextField>
            </Field>
            <Field sm={4}>
              <TextField
                fullWidth
                label="상위기관"
                select
                size="small"
                value={record.parentOrganization}
                onChange={(event) => onChangeField("parentOrganization", event.target.value)}
                sx={standardFieldSx}
              >
                {parentOrganizations.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Field>
            <Field sm={12}>
              <TextField fullWidth label="홈페이지주소" size="small" value={record.homepage} onChange={(event) => onChangeField("homepage", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={6}>
              <TextField fullWidth label="발주처명(단명)" size="small" value={record.shortName} onChange={(event) => onChangeField("shortName", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={6}>
              <TextField fullWidth label="발주처영문명" size="small" value={record.englishName} onChange={(event) => onChangeField("englishName", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={12}>
              <TextField fullWidth label="발주처명(장명)" size="small" value={record.longName} onChange={(event) => onChangeField("longName", event.target.value)} sx={standardFieldSx} />
            </Field>
          </Section>

          <Section title="사업자 정보" description="사업자 관련 기본 정보를 입력합니다.">
            <Field sm={4}>
              <TextField fullWidth label="업종" size="small" value={record.businessType} onChange={(event) => onChangeField("businessType", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={4}>
              <TextField fullWidth label="업태" size="small" value={record.businessItem} onChange={(event) => onChangeField("businessItem", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={4}>
              <TextField fullWidth label="대표자" size="small" value={record.representative} onChange={(event) => onChangeField("representative", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={6}>
              <TextField fullWidth label="사업자번호" size="small" value={record.businessNo} onChange={(event) => onChangeField("businessNo", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={6}>
              <TextField fullWidth label="법인번호" size="small" value={record.corporateNo} onChange={(event) => onChangeField("corporateNo", event.target.value)} sx={standardFieldSx} />
            </Field>
            <Field sm={12}>
              <KakaoPostcodeFields
                address={record.address}
                addressDetail={record.addressDetail}
                onChange={({ address, addressDetail, postalCode }) => {
                  onChangeField("postalCode", postalCode);
                  onChangeField("address", address);
                  onChangeField("addressDetail", addressDetail);
                }}
                postalCode={record.postalCode}
                title="주소 정보"
              />
            </Field>
            <Field sm={12}>
              <TextField fullWidth label="비고" size="small" value={record.memo} onChange={(event) => onChangeField("memo", event.target.value)} sx={standardFieldSx} />
            </Field>
          </Section>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
        <Button color="error" onClick={onDelete} variant="outlined">
          삭제
        </Button>
        <Button onClick={onSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
