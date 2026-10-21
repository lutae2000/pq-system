"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTimeInput } from "@/components/common/DateTimeInput";
import { FileActionCard, type FileActionCardFileItem } from "@/components/common/FileActionCard";
import { standardFieldSx } from "@/components/common/FormControls";
import { getClientCode, listClientCodes } from "@/modules/code/clients/api";
import type { BidNoticeAttachmentState, BidNoticeRecord, AttachmentKey } from "@/modules/pq/bid-notice/bidNotice.types";
import type { BidNoticeDetailOptions, BidNoticeOption } from "@/modules/pq/bid-notice/bidNoticeApi";
import { useUserOptions } from "@/modules/common/reference/useReferenceOptions";

type BidNoticeDetailDialogProps = {
  attachments?: BidNoticeAttachmentState;
  attachmentOwnerId?: number;
  changeSummary?: ReadonlyArray<{ current: string; label: string; previous: string }>;
  clientSearchHint?: string;
  g2bBidNoticeNumber?: string;
  g2bBidNoticeUrl?: string;
  sourceAttachments?: ReadonlyArray<{ downloadUrl: string; fileName: string }>;
  onAttachmentDeleteRequest?: (key: AttachmentKey, fileName: string) => void;
  onAttachmentUpload?: (key: AttachmentKey, file: FileActionCardFileItem) => void;
  onClose: () => void;
  onDeleteRequest: () => void;
  onFieldChange: <K extends keyof BidNoticeRecord>(field: K, value: BidNoticeRecord[K]) => void;
  onSave: (record: BidNoticeRecord) => void;
  open: boolean;
  options: BidNoticeDetailOptions | null;
  record: BidNoticeRecord;
  readOnly?: boolean;
  saveDisabled?: boolean;
  deleteDisabled?: boolean;
  deferChanges?: boolean;
};

const attachmentLabels: Record<AttachmentKey, string> = {
  announcement: "공고문",
  evaluation: "평가기준",
  guide: "작성안내서",
  specification: "과업지시서",
  submission: "제출자료",
};

const attachmentOrder: AttachmentKey[] = ["announcement", "evaluation", "guide", "specification", "submission"];

function SectionCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        boxShadow: "0 1px 1px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "rgba(15, 23, 42, 0.04)",
          borderBottom: "1px solid",
          borderBottomColor: "divider",
          display: "flex",
          minHeight: 36,
          px: 1.25,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 800 }} variant="subtitle1">
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {description ? (
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
            {description}
          </Typography>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        color: "text.secondary",
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Typography>
  );
}

function LabeledField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Box>
  );
}

function TextInputField({
  label,
  multiline,
  onChange,
  rows,
  readOnly = false,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  readOnly?: boolean;
  rows?: number;
  value: string;
}) {
  return (
    <LabeledField label={label}>
      <TextField
        fullWidth
        multiline={multiline}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        size="small"
        sx={standardFieldSx}
        slotProps={{
          htmlInput: {
            readOnly,
          },
        }}
        value={value}
      />
    </LabeledField>
  );
}

function SelectField({
  label,
  onChange,
  options,
  required = false,
  readOnly = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly BidNoticeOption[];
  required?: boolean;
  readOnly?: boolean;
  value: string;
}) {
  const autocompleteOptions = value && !options.some((option) => option.value === value)
    ? [{ label: value, value }, ...options]
    : options;
  const selectedOption = autocompleteOptions.find((option) => option.value === value) ?? null;

  return (
    <LabeledField label={label}>
      <Autocomplete
        autoHighlight
        clearOnEscape
        disabled={readOnly}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) => option.value === selected.value}
        onChange={(_, nextValue) => {
          onChange(nextValue?.value ?? "");
        }}
        options={autocompleteOptions}
        value={selectedOption}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder="선택"
            required={required}
            size="small"
            sx={standardFieldSx}
          />
        )}
      />
    </LabeledField>
  );
}

function ClientAutocompleteField({
  initialSearchKeyword = "",
  label = "발주처",
  onChange,
  readOnly = false,
  value,
}: {
  initialSearchKeyword?: string;
  label?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
}) {
  const [keyword, setKeyword] = useState("");
  const searchKeyword = keyword || value || initialSearchKeyword;
  const selectedClientQuery = useQuery({
    queryKey: ["bid-notice-client", value],
    queryFn: () => getClientCode(value),
    enabled: Boolean(value),
    staleTime: 5 * 60 * 1000,
  });
  const clientsQuery = useQuery({
    queryKey: ["bid-notice-client-options", searchKeyword],
    queryFn: () =>
      listClientCodes({
        businessName: searchKeyword,
        companyType: "",
        orderClass: "",
        page: 0,
      }),
    staleTime: 60 * 1000,
  });
  const options = useMemo(() => {
    const mapped = (clientsQuery.data?.content ?? []).map((client) => ({
      label: client.orderName ? `${client.orderName} (${client.clientCode})` : client.clientCode,
      value: client.clientCode,
    }));
    const selectedClient = selectedClientQuery.data
      ? {
          label: selectedClientQuery.data.orderName
            ? `${selectedClientQuery.data.orderName} (${selectedClientQuery.data.clientCode})`
            : selectedClientQuery.data.clientCode,
          value: selectedClientQuery.data.clientCode,
        }
      : null;
    const withSelected = selectedClient ? [selectedClient, ...mapped] : mapped;
    const uniqueOptions = new Map<string, { label: string; value: string }>();

    withSelected.forEach((option) => {
      if (!uniqueOptions.has(option.value)) {
        uniqueOptions.set(option.value, option);
      }
    });

    if (value && !uniqueOptions.has(value)) {
      uniqueOptions.set(value, { label: value, value });
    }

    return [...uniqueOptions.values()];
  }, [clientsQuery.data?.content, selectedClientQuery.data, value]);
  const selectedOption = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (readOnly || value || !initialSearchKeyword.trim() || clientsQuery.isLoading) return;
    const normalizedKeyword = initialSearchKeyword.trim().toLowerCase();
    const matchedClient = clientsQuery.data?.content.find(
      (client) => client.orderName?.trim().toLowerCase() === normalizedKeyword,
    );
    if (matchedClient) {
      onChange(matchedClient.clientCode);
    }
  }, [clientsQuery.data?.content, clientsQuery.isLoading, initialSearchKeyword, onChange, readOnly, value]);

  return (
    <LabeledField label={label}>
      <Autocomplete
        autoHighlight
        filterOptions={(items) => items}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) => option.value === selected.value}
        loading={clientsQuery.isLoading || selectedClientQuery.isLoading}
        readOnly={readOnly}
        onChange={(_, nextValue) => {
          onChange(nextValue?.value ?? "");
          setKeyword("");
        }}
        onInputChange={(_, nextInputValue, reason) => {
          if (reason === "input") {
            setKeyword(nextInputValue);
          } else if (reason === "clear") {
            setKeyword("");
          }
        }}
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder="발주처명 또는 코드 검색"
            size="small"
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                readOnly,
              },
            }}
            sx={standardFieldSx}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.value}>
            {option.label}
          </Box>
        )}
        value={selectedOption}
      />
    </LabeledField>
  );
}

function UserAutocompleteField({
  onChange,
  readOnly = false,
  value,
}: {
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
}) {
  const [keyword, setKeyword] = useState("");
  const searchKeyword = keyword || value;
  const { isLoading, options } = useUserOptions({ deptCode: "All", keyword: searchKeyword, useYn: "Y" });
  const autocompleteOptions = value && !options.some((option) => option.value === value)
    ? [{ label: `사번 ${value}`, value }, ...options]
    : options;
  const selectedOption = autocompleteOptions.find((option) => option.value === value) ?? null;

  return (
    <LabeledField label="작성자">
      <Autocomplete
        autoHighlight
        disabled={readOnly || isLoading}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, selected) => option.value === selected.value}
        loading={isLoading}
        onChange={(_, nextValue) => {
          onChange(nextValue?.value ?? "");
          setKeyword("");
        }}
        onInputChange={(_, nextInputValue, reason) => {
          if (reason === "input") setKeyword(nextInputValue);
          if (reason === "clear") setKeyword("");
        }}
        options={autocompleteOptions}
        value={selectedOption}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder="선택"
            size="small"
            sx={standardFieldSx}
          />
        )}
      />
    </LabeledField>
  );
}

function MoneyField({
  label,
  onChange,
  readOnly = false,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  readOnly?: boolean;
  value: number;
}) {
  const formattedValue = value ? new Intl.NumberFormat("ko-KR").format(value) : "";

  return (
    <LabeledField label={label}>
      <TextField
        fullWidth
        inputMode="numeric"
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
        placeholder="0"
        size="small"
        slotProps={{ htmlInput: { readOnly } }}
        sx={standardFieldSx}
        value={formattedValue}
      />
    </LabeledField>
  );
}

function DateTimeField({
  label,
  onChange,
  readOnly = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
}) {
  return <DateTimeInput label={label} onChange={onChange} readOnly={readOnly} value={value} />;
}

function DateYmdField({
  label,
  onChange,
  readOnly = false,
  value,
}: {
  label?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
}) {
  const inputValue = /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value.slice(0, 10);

  const field = (
    <TextField
      fullWidth
      onChange={(event) => onChange(event.target.value.replaceAll("-", ""))}
      size="small"
      slotProps={{ htmlInput: { readOnly } }}
      sx={standardFieldSx}
      type="date"
      value={inputValue}
    />
  );

  return label ? <LabeledField label={label}>{field}</LabeledField> : field;
}

function AttachmentCard({
  disabled = false,
  files,
  keyName,
  onDelete,
  onUpload,
  ownerId,
}: {
  disabled?: boolean;
  files: FileActionCardFileItem[];
  keyName: AttachmentKey;
  onDelete?: (fileName: string) => void;
  onUpload?: (file: FileActionCardFileItem) => void;
  ownerId?: number;
}) {
  const label = attachmentLabels[keyName];

  return (
    <FileActionCard
      attachmentTarget={ownerId ? { attachmentType: keyName, ownerId, ownerType: "BID_NOTICE" } : undefined}
      description={disabled ? "공고문 저장 후 파일을 업로드할 수 있습니다." : `${label} 파일을 업로드하세요.`}
      files={files}
      multiple
      onDeleteFile={onDelete}
      onUploadComplete={onUpload}
      title={label}
      uploadDisabled={disabled}
      uploadLabel="자료 올리기"
    />
  );
}

function CategoryDivider({ title }: { title: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, mt: 0.5 }}>
      <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" }}>{title}</Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  );
}

function CategoryBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box sx={{ bgcolor: "rgba(25, 118, 210, 0.035)", border: "1px solid", borderColor: "rgba(25, 118, 210, 0.22)", borderLeft: "4px solid", borderLeftColor: "primary.main", borderRadius: 1, p: 1 }}>
      <Typography sx={{ color: "primary.main", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}>{title}</Typography>
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

export function BidNoticeDetailDialog({
  attachments,
  attachmentOwnerId,
  changeSummary = [],
  clientSearchHint = "",
  g2bBidNoticeNumber = "",
  g2bBidNoticeUrl = "",
  onAttachmentDeleteRequest,
  onAttachmentUpload,
  onClose,
  onDeleteRequest,
  onFieldChange: onFieldChangeProp,
  onSave,
  open,
  options,
  record: initialRecord,
  readOnly = false,
  saveDisabled = false,
  deleteDisabled = false,
  deferChanges = false,
  sourceAttachments = [],
}: BidNoticeDetailDialogProps) {
  const [localRecord, setLocalRecord] = useState(initialRecord);
  const emptyOptions: BidNoticeOption[] = [];

  useEffect(() => {
    // 부모 draft는 저장 완료 후 갱신되므로, 저장 결과를 다이얼로그에 반영한다.
    // 입력 중에는 부모가 갱신되지 않아 전체 페이지 재렌더링을 피한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (deferChanges) setLocalRecord(initialRecord);
  }, [deferChanges, initialRecord]);

  const record = deferChanges ? localRecord : initialRecord;

  const onFieldChange = <K extends keyof BidNoticeRecord>(field: K, value: BidNoticeRecord[K]) => {
    if (deferChanges) {
      setLocalRecord((current) => ({ ...current, [field]: value }));
      return;
    }
    onFieldChangeProp(field, value);
  };

  const handleSave = () => onSave(deferChanges ? localRecord : initialRecord);
  const participationOption = options?.finalParticipationStatuses.find((option) => option.value === record.finalParticipationStatus);
  const isAbsent = record.finalParticipationStatus === "N"
    || participationOption?.label.includes("\uBD88\uCC38") === true
    || Boolean(record.reasonOfAbsenceCode);
  const attachmentState = attachments ?? {
    announcement: [],
    evaluation: [],
    guide: [],
    specification: [],
    submission: [],
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xl"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            maxHeight: "92vh",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          pr: 1,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 800 }}>공고문 상세</Typography>
        <IconButton aria-label="닫기" onClick={onClose} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "background.default", p: 1.5 }}>
        {changeSummary.length > 0 ? (
          <Card sx={{ mb: 1.25, border: 1, borderColor: "warning.light", bgcolor: "rgba(255, 152, 0, 0.06)" }} variant="outlined">
            <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
              <Typography sx={{ color: "warning.dark", fontSize: 13, fontWeight: 800, mb: 0.75 }}>변경사항</Typography>
              <Stack spacing={0.75}>
              {changeSummary.map((change) => (
                <Box key={change.label} sx={{ display: "grid", gap: 0.75, gridTemplateColumns: { md: "160px minmax(0, 1fr) minmax(0, 1fr)", xs: "1fr" } }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{change.label}</Typography>
                  <Typography sx={{ bgcolor: "rgba(244, 67, 54, 0.08)", color: "error.dark", fontSize: 12, p: 0.5, whiteSpace: "pre-line", wordBreak: "break-word" }}>이전: {change.previous || "-"}</Typography>
                  <Typography sx={{ bgcolor: "rgba(33, 150, 243, 0.08)", color: "info.dark", fontSize: 12, p: 0.5, whiteSpace: "pre-line", wordBreak: "break-word" }}>현재: {change.current || "-"}</Typography>
                </Box>
              ))}
              </Stack>
            </CardContent>
          </Card>
        ) : null}
        <Stack spacing={1.25}>
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.8fr) minmax(260px, 0.62fr) minmax(360px, 0.9fr)" },
              alignItems: "start",
            }}
          >
            <SectionCard title="기본 정보">
              <Stack spacing={1}>
                <Stack spacing={1}>
                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "120px minmax(0, 1fr)" } }}>
                    <TextInputField
                      label="관리번호"
                      onChange={(value) => onFieldChange("bidNo", value)}
                      readOnly
                      value={record.bidNo}
                    />
                    <TextInputField label="사업명" onChange={(value) => onFieldChange("projectName", value)} readOnly={readOnly} value={record.projectName} />
                  </Box>

                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
                    <ClientAutocompleteField initialSearchKeyword={clientSearchHint} label="수요기관" onChange={(value) => onFieldChange("client", value)} readOnly={readOnly} value={record.client} />
                    <SelectField
                      label="입찰구분"
                      onChange={(value) => onFieldChange("bidType", value)}
                      options={options?.bidTypes ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.bidType}
                    />
                    <SelectField
                      label="입찰방식"
                      onChange={(value) => onFieldChange("bidMethod", value)}
                      options={options?.bidMethods ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.bidMethod}
                    />
                  </Box>

                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
                    <MoneyField label="설계금액" onChange={(value) => onFieldChange("estimateAmount", value)} readOnly={readOnly} value={record.estimateAmount} />
                    <SelectField
                      label="발주방법"
                      onChange={(value) => onFieldChange("procurementMethod", value)}
                      options={options?.orderMethods ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.procurementMethod}
                    />
                    <SelectField
                      label="최종참여 여부"
                      onChange={(value) => {
                        onFieldChange("finalParticipationStatus", value);
                        const nextOption = options?.finalParticipationStatuses.find((option) => option.value === value);
                        const nextIsAbsent = value === "N" || nextOption?.label.includes("\uBD88\uCC38") === true;
                        if (!nextIsAbsent) onFieldChange("reasonOfAbsenceCode", "");
                      }}
                      options={options?.finalParticipationStatuses ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.finalParticipationStatus}
                    />
                  </Box>

                  {isAbsent ? (
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
                      <SelectField
                        label="불참 사유"
                        onChange={(value) => onFieldChange("reasonOfAbsenceCode", value)}
                        options={options?.reasonsOfAbsence ?? emptyOptions}
                        readOnly={readOnly}
                        required
                        value={record.reasonOfAbsenceCode}
                      />
                    </Box>
                  ) : null}
                </Stack>

                <CategoryDivider title="사업 정보" />
                <Stack spacing={1}>
                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
                    <SelectField
                      label="사업구분"
                      onChange={(value) => onFieldChange("businessType", value)}
                      options={options?.businessTypes ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.businessType}
                    />
                    <SelectField
                      label="사업분야"
                      onChange={(value) => onFieldChange("businessField", value)}
                      options={options?.businessFields ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.businessField}
                    />
                    <SelectField
                      label="사업범위"
                      onChange={(value) => onFieldChange("businessScope", value)}
                      options={options?.businessScopes ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.businessScope}
                    />
                  </Box>

                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
                    <TextInputField
                      label="대표업체"
                      onChange={(value) => onFieldChange("representativeVendor", value)}
                      readOnly={readOnly}
                      value={record.representativeVendor}
                    />
                    <SelectField
                      label="부서"
                      onChange={(value) => onFieldChange("department", value)}
                      options={options?.departments ?? emptyOptions}
                      readOnly={readOnly}
                      value={record.department}
                    />
                    <UserAutocompleteField
                      onChange={(value) => onFieldChange("writerName", value)}
                      readOnly={readOnly}
                      value={record.writerName}
                    />
                  </Box>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr)" },
                  }}
                >
                  <TextInputField
                    label="비고"
                    multiline
                    onChange={(value) => onFieldChange("draftNote", value)}
                    readOnly={readOnly}
                    rows={4}
                    value={record.draftNote}
                  />
                </Box>
              </Stack>
            </SectionCard>

            <Stack spacing={1.25}>
              <SectionCard title="심사 결과">
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: record.managerConfirmed ? "success.main" : "error.light",
                    borderRadius: 2,
                    bgcolor: record.managerConfirmed ? "rgba(46, 125, 50, 0.08)" : "rgba(0, 0, 0, 0)",
                    px: 1.5,
                    py: 1.25,
                    transition: "background-color 160ms ease, border-color 160ms ease",
                  }}
                >
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        color: record.managerConfirmed ? "success.dark" : "text.secondary",
                        fontSize: 26,
                        fontWeight: 900,
                        lineHeight: 1.1,
                        letterSpacing: 0,
                      }}
                    >
                      {record.managerConfirmed ? "낙찰" : "미낙찰"}
                    </Typography>
                    <Switch
                      checked={record.managerConfirmed}
                      color="success"
                      disabled={readOnly}
                      onChange={(event) => onFieldChange("managerConfirmed", event.target.checked)}
                      sx={{ m: 0 }}
                    />
                  </Box>
                </Box>
              </SectionCard>

              <SectionCard title="일정 정보">
                <Stack spacing={1}>
                  <CategoryBlock title="공고일자">
                    <DateYmdField onChange={(value) => onFieldChange("noticeDate", value)} readOnly={readOnly} value={record.noticeDate} />
                  </CategoryBlock>

                  <CategoryBlock title="PQ / TP 일정">
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr" }}>
                      <DateTimeField label="PQ 등록일자" onChange={(value) => onFieldChange("pqRegistrationDate", value)} readOnly={readOnly} value={record.pqRegistrationDate} />
                      <DateTimeField label="PQ 제출일자" onChange={(value) => onFieldChange("pqSubmissionDate", value)} readOnly={readOnly} value={record.pqSubmissionDate} />
                      <DateTimeField label="TP 제출일자" onChange={(value) => onFieldChange("tpSubmissionDate", value)} readOnly={readOnly} value={record.tpSubmissionDate} />
                    </Box>
                  </CategoryBlock>

                  <CategoryBlock title="입찰 일정">
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr" }}>
                      <DateTimeField label="PQ심사 신청 마감일" onChange={(value) => onFieldChange("bidClosingDate", value)} readOnly={readOnly} value={record.bidClosingDate} />
                      <DateTimeField label="입찰서 마감일" onChange={(value) => onFieldChange("bidDate", value)} readOnly={readOnly} value={record.bidDate} />
                      <DateTimeField label="투찰 마감일" onChange={(value) => onFieldChange("bidSubmissionDate", value)} readOnly={readOnly} value={record.bidSubmissionDate} />
                    </Box>
                  </CategoryBlock>

                  <CategoryBlock title="면접 일정">
                    <DateYmdField
                      onChange={(value) => onFieldChange("interviewDate", value)}
                      readOnly={readOnly}
                      value={record.interviewDate}
                    />
                  </CategoryBlock>

                </Stack>
              </SectionCard>
            </Stack>

            <Stack spacing={1.25}>
              <SectionCard title="첨부 자료">
                <Stack spacing={1}>
                  {sourceAttachments.length > 0 ? (
                    <Box sx={{ bgcolor: "rgba(25, 118, 210, 0.035)", border: "1px solid", borderColor: "rgba(25, 118, 210, 0.22)", borderRadius: 1, p: 1 }}>
                      <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, mb: 0.75 }}>나라장터 원본 첨부파일</Typography>
                      <Stack spacing={0.75}>
                        {sourceAttachments.map((attachment, index) => (
                          <Card
                            key={`${attachment.fileName}-${index}`}
                            component="a"
                            href={attachment.downloadUrl || undefined}
                            rel="noreferrer"
                            target="_blank"
                            variant="outlined"
                            sx={{
                              "&:hover": attachment.downloadUrl ? { bgcolor: "action.hover", borderColor: "primary.main" } : undefined,
                              bgcolor: "background.paper",
                              borderColor: "divider",
                              borderRadius: 1.25,
                              color: "inherit",
                              display: "block",
                              opacity: attachment.downloadUrl ? 1 : 0.65,
                              textDecoration: "none",
                            }}
                          >
                            <CardContent sx={{ minWidth: 0, p: 1, "&:last-child": { pb: 1 } }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Tooltip title={attachment.fileName} placement="top-start">
                                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{attachment.fileName}</Typography>
                                </Tooltip>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                  {attachmentOrder.map((key) => (
                    <AttachmentCard
                      key={key}
                      files={attachmentState[key]}
                      keyName={key}
                      onDelete={onAttachmentDeleteRequest ? (fileName) => onAttachmentDeleteRequest(key, fileName) : undefined}
                      onUpload={onAttachmentUpload ? (file) => onAttachmentUpload(key, file) : undefined}
                      ownerId={(attachmentOwnerId ?? record.seqNo) || undefined}
                      disabled={readOnly || !record.seqNo}
                    />
                  ))}
                </Stack>
              </SectionCard>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 2, py: 1.25 }}>
        <Button color="error" disabled={deleteDisabled} onClick={onDeleteRequest} startIcon={<DeleteOutlineOutlinedIcon />} sx={{ display: readOnly ? "none" : undefined }} variant="outlined">
          삭제
        </Button>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}>
          {g2bBidNoticeNumber ? (
            <Typography color="text.secondary" noWrap sx={{ fontSize: 12 }}>
              나라장터 공고번호: {g2bBidNoticeNumber}
            </Typography>
          ) : null}
          {g2bBidNoticeUrl ? (
            <Button
              component="a"
              href={g2bBidNoticeUrl}
              rel="noreferrer"
              size="small"
              startIcon={<OpenInNewOutlinedIcon />}
              target="_blank"
              variant="outlined"
            >
              나라장터 공고 바로가기
            </Button>
          ) : null}
          <Button disabled={saveDisabled} onClick={handleSave} startIcon={<SaveOutlinedIcon />} sx={{ display: readOnly ? "none" : undefined }} variant="contained">
            저장
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
