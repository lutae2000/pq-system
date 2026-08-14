"use client";

import type { ReactNode } from "react";
import { Dialog } from "@mui/material";

type PqParticipatingEngineerDetailDialogProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
};

export function PqParticipatingEngineerDetailDialog({ children, open, onClose }: PqParticipatingEngineerDetailDialogProps) {
  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open} scroll="paper">
      {children}
    </Dialog>
  );
}