"use client";

import { useRef, useState } from "react";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

type FileUploadDialogProps = {
  description?: string;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  open: boolean;
  title: string;
};

export function FileUploadDialog({ description, onClose, onUpload, open, title }: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const handleUpload = () => {
    onUpload(files);
    setFiles([]);
  };

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {description ? <Typography color="text.secondary">{description}</Typography> : null}
          <Box
            sx={{
              alignItems: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              justifyContent: "center",
              minHeight: 160,
              p: 3,
              textAlign: "center",
            }}
          >
            <UploadFileOutlinedIcon color="action" />
            <Button onClick={() => inputRef.current?.click()} variant="outlined">
              파일 선택
            </Button>
            <Typography color="text.secondary" variant="body2">
              {files.length > 0 ? files.map((file) => file.name).join(", ") : "선택된 파일이 없습니다."}
            </Typography>
            <input
              hidden
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              ref={inputRef}
              type="file"
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose}>
          취소
        </Button>
        <Button disabled={files.length === 0} onClick={handleUpload} variant="contained">
          업로드
        </Button>
      </DialogActions>
    </Dialog>
  );
}
