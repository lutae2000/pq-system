"use client";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EnterpriseDataGrid } from "@/components/common/EnterpriseDataGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { standardFieldSx } from "@/components/common/FormControls";
import { useCurrentMenuPermission } from "@/lib/permissions/useCurrentMenuPermission";
import { useAppSnackbar } from "@/lib/providers/AppSnackbarProvider";

import { createSystemPolicy, listSystemPolicies, updateSystemPolicy, type SystemPolicyRecord, type SystemPolicyWriteRequest } from "./api";
import { BrandingImageSettingsCard } from "./BrandingImageSettingsCard";

const isBooleanPolicy = (valueType: SystemPolicyRecord["valueType"]) => valueType === "BOOLEAN";
const brandingPolicyKeys = new Set(["BRANDING_LOGIN_BACKGROUND_URL", "BRANDING_COMPANY_LOGO_URL", "BRANDING_FAVICON_URL"]);

export function SystemPolicyManagementPage() {
  const { canRead, canUpdate } = useCurrentMenuPermission();
  const { showSnackbar } = useAppSnackbar();
  const [records, setRecords] = useState<SystemPolicyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState<SystemPolicyWriteRequest>({
    description: "",
    policyName: "",
    policyValue: "",
    sortSeq: 0,
    useYn: true,
    valueType: "NUMBER",
  });

  const sortedRecords = useMemo(
    () => records
      .filter((record) => !brandingPolicyKeys.has(record.policyKey))
      .sort((left, right) => left.sortSeq - right.sortSeq || left.policyKey.localeCompare(right.policyKey)),
    [records],
  );

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!canRead) {
        return;
      }
      setLoading(true);
      try {
        const data = await listSystemPolicies();
        if (active) {
          setRecords(data);
        }
      } catch (error) {
        if (active) {
          showSnackbar({ message: error instanceof Error ? error.message : "시스템 정책을 불러오지 못했습니다.", severity: "error" });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [canRead, showSnackbar]);

  const updateRecord = useCallback((policyKey: string, updater: (record: SystemPolicyRecord) => SystemPolicyRecord) => {
    setRecords((current) => current.map((record) => (record.policyKey === policyKey ? updater(record) : record)));
  }, []);

  const persistPolicy = useCallback(async (policy: SystemPolicyRecord) => {
    if (policy.useYn && (!policy.policyValue.trim() || (policy.valueType === "NUMBER" && !/^\d{1,3}$/.test(policy.policyValue)))) {
      showSnackbar({ message: `${policy.policyName}의 설정값을 확인해 주세요.`, severity: "error" });
      const data = await listSystemPolicies();
      setRecords(data);
      return;
    }
    try {
      await updateSystemPolicy(policy.policyKey, policy);
    } catch (error) {
      showSnackbar({ message: error instanceof Error ? error.message : "시스템 정책을 수정하지 못했습니다.", severity: "error" });
      const data = await listSystemPolicies();
      setRecords(data);
    }
  }, [showSnackbar]);

  const handleCreate = async () => {
    const policyKey = newPolicy.policyKey?.trim() ?? "";
    if (!policyKey || !newPolicy.policyName.trim()) {
      showSnackbar({ message: "정책 코드와 정책명을 입력해 주세요.", severity: "error" });
      return;
    }
    if (newPolicy.useYn && (!newPolicy.policyValue.trim() || (newPolicy.valueType === "NUMBER" && !/^\d{1,3}$/.test(newPolicy.policyValue)))) {
      showSnackbar({ message: "사용 중인 정책의 설정값을 확인해 주세요.", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      await createSystemPolicy({ ...newPolicy, policyKey });
      setRecords(await listSystemPolicies());
      setAddOpen(false);
      setNewPolicy({ description: "", policyKey: "", policyName: "", policyValue: "", sortSeq: 0, useYn: true, valueType: "NUMBER" });
      showSnackbar({ message: "시스템 정책을 추가했습니다.", severity: "success" });
    } catch (error) {
      showSnackbar({ message: error instanceof Error ? error.message : "시스템 정책을 추가하지 못했습니다.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<GridColDef<SystemPolicyRecord>[]>(
    () => [
      {
        field: "policyKey",
        headerName: "정책 코드",
        minWidth: 230,
        width: 230,
      },
      {
        field: "policyName",
        flex: 1.2,
        headerName: "정책명",
        minWidth: 220,
      },
      {
        field: "useYn",
        headerAlign: "center",
        headerName: "사용",
        renderCell: (params) => (
          <FormControlLabel
            control={
              <Switch
                checked={params.row.useYn}
                disabled={!canUpdate}
                onChange={(event) => {
                  const next = { ...params.row, useYn: event.target.checked };
                  updateRecord(params.row.policyKey, () => next);
                  void persistPolicy(next);
                }}
              />
            }
            label={params.row.useYn ? "사용" : "미사용"}
            sx={{ m: 0 }}
          />
        ),
        width: 110,
      },
      {
        field: "policyValue",
        flex: 0.8,
        headerName: "설정값",
        minWidth: 180,
        renderCell: (params) =>
          isBooleanPolicy(params.row.valueType) ? (
            <FormControlLabel
              control={
                <Switch
                  checked={params.row.policyValue === "true"}
                  disabled={!canUpdate || !params.row.useYn}
                  onChange={(event) => {
                    const next = { ...params.row, policyValue: event.target.checked ? "true" : "false" };
                    updateRecord(params.row.policyKey, () => next);
                    void persistPolicy(next);
                  }}
                />
              }
              label={params.row.policyValue === "true" ? "true" : "false"}
              sx={{ m: 0 }}
            />
          ) : (
            <TextField
              disabled={!canUpdate || !params.row.useYn}
              onChange={(event) =>
                updateRecord(params.row.policyKey, (current) => ({
                  ...current,
                  policyValue: params.row.valueType === "NUMBER" ? event.target.value.replace(/\D/g, "").slice(0, 3) : event.target.value,
                }))
              }
              onBlur={() => {
                const current = records.find((record) => record.policyKey === params.row.policyKey);
                if (current) {
                  void persistPolicy(current);
                }
              }}
              size="small"
              sx={{ ...standardFieldSx, my: 0.5 }}
              value={params.row.policyValue}
              slotProps={{ htmlInput: params.row.valueType === "NUMBER" ? { inputMode: "numeric", maxLength: 3, pattern: "[0-9]*" } : undefined }}
            />
          ),
      },
      { field: "description", flex: 1.5, headerName: "설명", minWidth: 300 },
    ],
    [canUpdate, persistPolicy, records, updateRecord],
  );

  if (!canRead) {
    return (
      <Box>
        <PageHeader title="시스템 정책 관리" description="시스템 공통 정책을 관리합니다." />
        <Alert severity="warning">시스템 정책을 조회할 권한이 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="시스템 정책 관리"  />

      <Stack spacing={2}>
        <Card sx={{ borderRadius: 1 }}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  정책 목록
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  정책별 사용 여부와 기간·횟수 설정값을 한 곳에서 조정합니다.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`${sortedRecords.length}건`} size="small" variant="outlined" />
                <Button disabled={!canUpdate || loading} onClick={() => setAddOpen(true)} startIcon={<AddOutlinedIcon />} variant="contained">
                  추가
                </Button>
                <Button
                  onClick={() => {
                    void (async () => {
                      setLoading(true);
                      try {
                        const data = await listSystemPolicies();
                        setRecords(data);
                      } catch (error) {
                        showSnackbar({
                          message: error instanceof Error ? error.message : "시스템 정책을 불러오지 못했습니다.",
                          severity: "error",
                        });
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                  disabled={loading}
                  startIcon={<RefreshOutlinedIcon />}
                  variant="outlined"
                >
                  조회
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <EnterpriseDataGrid<SystemPolicyRecord>
              columns={columns}
              disableRowSelectionOnClick
              getRowId={(row) => row.policyKey}
              hideFooter
              loading={loading}
              rows={sortedRecords}
              sx={{ minHeight: 360 }}
            />
          </CardContent>
        </Card>
        <BrandingImageSettingsCard
          canUpdate={canUpdate}
          onUploaded={async () => {
            setRecords(await listSystemPolicies());
          }}
        />
      </Stack>

      <Dialog fullWidth maxWidth="sm" onClose={() => setAddOpen(false)} open={addOpen}>
        <DialogTitle>시스템 정책 추가</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 1 }}>
          <TextField
            label="정책 코드"
            onChange={(event) => setNewPolicy((current) => ({ ...current, policyKey: event.target.value }))}
            size="small"
            sx={standardFieldSx}
            value={newPolicy.policyKey ?? ""}
          />
          <TextField
            label="정책명"
            onChange={(event) => setNewPolicy((current) => ({ ...current, policyName: event.target.value }))}
            size="small"
            sx={standardFieldSx}
            value={newPolicy.policyName}
          />
          <TextField
            label="값 유형"
            onChange={(event) => setNewPolicy((current) => ({ ...current, policyValue: event.target.value === "BOOLEAN" ? "false" : current.policyValue, valueType: event.target.value as SystemPolicyRecord["valueType"] }))}
            select
            size="small"
            sx={standardFieldSx}
            value={newPolicy.valueType}
          >
            <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
            <MenuItem value="NUMBER">NUMBER</MenuItem>
            <MenuItem value="TEXT">TEXT</MenuItem>
          </TextField>
          <TextField
            label="설정값"
            onChange={(event) =>
              setNewPolicy((current) => ({
                ...current,
                policyValue: current.valueType === "NUMBER" ? event.target.value.replace(/\D/g, "").slice(0, 3) : event.target.value,
              }))
            }
            size="small"
            sx={standardFieldSx}
            value={newPolicy.policyValue}
            slotProps={{ htmlInput: newPolicy.valueType === "NUMBER" ? { inputMode: "numeric", maxLength: 3, pattern: "[0-9]*" } : undefined }}
          />
          <TextField
            label="정렬 순서"
            onChange={(event) => setNewPolicy((current) => ({ ...current, sortSeq: Number(event.target.value || 0) }))}
            size="small"
            sx={standardFieldSx}
            type="number"
            value={newPolicy.sortSeq}
          />
          <TextField
            label="설명"
            multiline
            onChange={(event) => setNewPolicy((current) => ({ ...current, description: event.target.value }))}
            size="small"
            sx={standardFieldSx}
            value={newPolicy.description ?? ""}
          />
          <FormControlLabel
            control={<Switch checked={newPolicy.useYn} onChange={(event) => setNewPolicy((current) => ({ ...current, useYn: event.target.checked }))} />}
            label="사용"
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setAddOpen(false)} variant="outlined">취소</Button>
          <Button disabled={loading} onClick={() => void handleCreate()} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
