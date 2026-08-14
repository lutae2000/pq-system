"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";

export type AppModalProps = {
  children: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  onClose: () => void;
  open: boolean;
  title: string;
};

export function AppModal({ children, maxWidth = "sm", onClose, open, title }: AppModalProps) {
  return (
    <Dialog fullWidth keepMounted maxWidth={maxWidth} onClose={onClose} open={open} transitionDuration={0}>
      <DialogTitle>
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton aria-label="Close modal" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
