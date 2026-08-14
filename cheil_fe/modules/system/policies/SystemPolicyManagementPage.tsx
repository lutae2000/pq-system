"use client";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, FormControlLabel, Snackbar, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { standardFieldSx } from "@/components/common/FormControls";

import { listSystemPolicies, saveSystemPolicies, type SystemPolicyRecord } from "./api";

const isBooleanPolicy = (valueType: SystemPolicyRecord["valueType"]) => valueType === "BOOLEAN";

const policyTypeLabel: Record<SystemPolicyRecord["valueType"], string> = {
  BOOLEAN: "BOOLEAN",
  NUMBER: "NUMBER",
  TEXT: "TEXT",
};

export function SystemPolicyManagementPage() {
  const [records, setRecords] = useState<SystemPolicyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const sortedRecords = useMemo(
    () => [...records].sort((left, right) => left.sortSeq - right.sortSeq || left.policyKey.localeCompare(right.policyKey)),
    [records],
  );

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);
      try {
        const data = await listSystemPolicies();
        if (active) {
          setRecords(data);
        }
      } catch (error) {
        if (active) {
          setNotice({ message: error instanceof Error ? error.message : "시스템 정책을 불러오지 못했습니다.", severity: "error" });
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
  }, []);

  const updateRecord = (policyKey: string, updater: (record: SystemPolicyRecord) => SystemPolicyRecord) => {
    setRecords((current) => current.map((record) => (record.policyKey === policyKey ? updater(record) : record)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveSystemPolicies(sortedRecords);
      setRecords(saved);
      setNotice({ message: "시스템 정책을 저장했습니다.", severity: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "시스템 정책 저장에 실패했습니다.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="시스템 정책 관리" description="비밀번호와 계정 운영 기준을 관리합니다." />

      <Stack spacing={2}>
        <Card sx={{ borderRadius: 1 }}>
          <CardContent>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  정책 목록
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  비밀번호 변경 주기, 실패 제한, 세션 제한 같은 공통 정책을 한 곳에서 조정합니다.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`${sortedRecords.length}건`} size="small" variant="outlined" />
                <Button onClick={handleSave} disabled={saving || loading} startIcon={<SaveOutlinedIcon />} variant="contained">
                  저장
                </Button>
                <Button
                  onClick={() => {
                    void (async () => {
                      setLoading(true);
                      try {
                        const data = await listSystemPolicies();
                        setRecords(data);
                      } catch (error) {
                        setNotice({
                          message: error instanceof Error ? error.message : "시스템 정책을 불러오지 못했습니다.",
                          severity: "error",
                        });
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                  disabled={loading || saving}
                  startIcon={<RefreshOutlinedIcon />}
                  variant="outlined"
                >
                  새로고침
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              {sortedRecords.map((policy) => (
                <Card key={policy.policyKey} variant="outlined" sx={{ borderRadius: 1 }}>
                  <CardContent sx={{ pb: "16px !important" }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                          {policy.policyName}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {policy.policyKey}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip label={policyTypeLabel[policy.valueType]} size="small" variant="outlined" />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={policy.useYn}
                              onChange={(event) =>
                                updateRecord(policy.policyKey, (current) => ({
                                  ...current,
                                  useYn: event.target.checked,
                                }))
                              }
                            />
                          }
                          label="사용"
                          sx={{ mr: 0 }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", md: "220px 1fr" } }}>
                      <TextField
                        fullWidth
                        label="정렬 순서"
                        onChange={(event) =>
                          updateRecord(policy.policyKey, (current) => ({
                            ...current,
                            sortSeq: Number(event.target.value || 0),
                          }))
                        }
                        size="small"
                        sx={standardFieldSx}
                        type="number"
                        value={policy.sortSeq}
                      />
                      {isBooleanPolicy(policy.valueType) ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={policy.policyValue === "true"}
                              onChange={(event) =>
                                updateRecord(policy.policyKey, (current) => ({
                                  ...current,
                                  policyValue: event.target.checked ? "true" : "false",
                                }))
                              }
                            />
                          }
                          label={policy.policyValue === "true" ? "true" : "false"}
                          sx={{ alignSelf: "center", justifyContent: "flex-start" }}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label="값"
                          onChange={(event) =>
                            updateRecord(policy.policyKey, (current) => ({
                              ...current,
                              policyValue: event.target.value,
                            }))
                          }
                          size="small"
                          sx={standardFieldSx}
                          type={policy.valueType === "NUMBER" ? "number" : "text"}
                          value={policy.policyValue}
                        />
                      )}
                    </Box>

                    {policy.description ? (
                      <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="caption">
                        {policy.description}
                      </Typography>
                    ) : null}
                  </CardContent>
                </Card>
              ))}

              {!sortedRecords.length && !loading ? <Alert severity="info">등록된 시스템 정책이 없습니다.</Alert> : null}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        autoHideDuration={2500}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        onClose={() => setNotice(null)}
        open={Boolean(notice)}
        message={notice?.message}
      />
    </Box>
  );
}
