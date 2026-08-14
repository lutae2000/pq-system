"use client";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { KakaoPostcodeFields } from "@/components/common/KakaoPostcodeFields";
import { standardFieldSx } from "@/components/common/FormControls";
import type { PartnerOrderCompanyRecord } from "@/modules/pq/partnerCodes/partnerCodes.types";

type PartnerOrderCodeDetailDialogProps = {
  onChangeField: <K extends keyof PartnerOrderCompanyRecord>(field: K, value: PartnerOrderCompanyRecord[K]) => void;
  onClose: () => void;
  onDelete: () => void;
  onOpenContactManager: () => void;
  onSave: () => void;
  open: boolean;
  record: PartnerOrderCompanyRecord;
};

const companyTypeOptions: PartnerOrderCompanyRecord["companyType"][] = ["동종", "타종", "기타"];

function Field({
  children,
  md = 6,
  xs = 12,
}: {
  children: ReactNode;
  md?: number;
  xs?: number;
}) {
  return <Box sx={{ gridColumn: { xs: `span ${xs}`, md: `span ${md}` } }}>{children}</Box>;
}

function NumericField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <TextField
      fullWidth
      label={label}
      onChange={(event) => onChange(Number(event.target.value.replace(/[^\d]/g, "")) || 0)}
      size="small"
      slotProps={{
        htmlInput: {
          inputMode: "numeric",
          pattern: "[0-9,]*",
        },
        inputLabel: { shrink: true },
      }}
      sx={standardFieldSx}
      value={value.toLocaleString("ko-KR")}
    />
  );
}

export function PartnerCodeDetailDialog({
  onChangeField,
  onClose,
  onDelete,
  onOpenContactManager,
  onSave,
  open,
  record,
}: PartnerOrderCodeDetailDialogProps) {
  return (
    <Dialog fullWidth maxWidth="xl" onClose={onClose} open={open} scroll="paper">
      <DialogTitle sx={{ pb: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="h6">
              회원사 코드(수주) 상세
            </Typography>
            <Typography color="text.secondary" variant="body2">
              목록에서 더블클릭하면 상세 정보를 수정하고 저장할 수 있습니다.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={onOpenContactManager} variant="outlined" size="small">
              회원사담당자
            </Button>
          </Stack>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ backgroundColor: "background.default", p: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.55fr) minmax(320px, 0.85fr)" },
            alignItems: "start",
          }}
        >
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="subtitle1">
                  기본 정보
                </Typography>
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="회원사번호"
                      size="small"
                      value={record.code}
                      onChange={(event) => onChangeField("code", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="업체구분"
                      select
                      size="small"
                      value={record.companyType}
                      onChange={(event) => onChangeField("companyType", event.target.value as PartnerOrderCompanyRecord["companyType"])}
                      sx={standardFieldSx}
                    >
                      {companyTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="전문기술"
                      size="small"
                      value={record.specialtyTech}
                      onChange={(event) => onChangeField("specialtyTech", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={6}>
                    <TextField
                      fullWidth
                      label="회원사명(단명)"
                      size="small"
                      value={record.shortName}
                      onChange={(event) => onChangeField("shortName", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={6}>
                    <TextField
                      fullWidth
                      label="회원사 영문명"
                      size="small"
                      value={record.englishName}
                      onChange={(event) => onChangeField("englishName", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={6}>
                    <TextField
                      fullWidth
                      label="회원사명(장명)"
                      size="small"
                      value={record.longName}
                      onChange={(event) => onChangeField("longName", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={6}>
                    <TextField
                      fullWidth
                      label="홈페이지 주소"
                      size="small"
                      value={record.homepage}
                      onChange={(event) => onChangeField("homepage", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="subtitle1">
                  사업 정보
                </Typography>
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="업종"
                      size="small"
                      value={record.industry}
                      onChange={(event) => onChangeField("industry", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="업태"
                      size="small"
                      value={record.businessType}
                      onChange={(event) => onChangeField("businessType", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="대표자"
                      size="small"
                      value={record.representative}
                      onChange={(event) => onChangeField("representative", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="사업자번호"
                      size="small"
                      value={record.businessNo}
                      onChange={(event) => onChangeField("businessNo", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="법인번호"
                      size="small"
                      value={record.corporateNo}
                      onChange={(event) => onChangeField("corporateNo", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                  <Field md={4}>
                    <TextField
                      fullWidth
                      label="협회등록번호"
                      size="small"
                      value={record.associationNo}
                      onChange={(event) => onChangeField("associationNo", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" } }}>
                  <Field md={12}>
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
                  <Field md={12}>
                    <TextField
                      fullWidth
                      label="비고"
                      multiline
                      minRows={3}
                      size="small"
                      value={record.memo}
                      onChange={(event) => onChangeField("memo", event.target.value)}
                      sx={standardFieldSx}
                    />
                  </Field>
                </Box>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={2}>
            <Card variant="outlined" sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="subtitle1">
                  보유 정보
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
                  목록에서 참조하는 보유 정보를 관리합니다.
                </Typography>
                <Stack spacing={1.5}>
                  <NumericField label="회원 수" value={record.employeeCount} onChange={(value) => onChangeField("employeeCount", value)} />
                  <NumericField label="자본금" value={record.capital} onChange={(value) => onChangeField("capital", value)} />
                  <TextField
                    fullWidth
                    label="전화번호"
                    size="small"
                    value={record.phone}
                    onChange={(event) => onChangeField("phone", event.target.value)}
                    sx={standardFieldSx}
                  />
                  <TextField
                    fullWidth
                    label="FAX번호"
                    size="small"
                    value={record.fax}
                    onChange={(event) => onChangeField("fax", event.target.value)}
                    sx={standardFieldSx}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2 }}>
        <Button color="error" onClick={onDelete} startIcon={<DeleteOutlineOutlinedIcon />} variant="outlined">
          삭제
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
        <Button onClick={onSave} startIcon={<SaveOutlinedIcon />} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
