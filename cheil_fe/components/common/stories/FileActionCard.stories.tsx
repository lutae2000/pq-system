import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { AppSnackbarProvider } from "@/lib/providers/AppSnackbarProvider";

import { FileActionCard, type FileActionCardFile } from "../FileActionCard";

const meta = {
  title: "Common/FileActionCard",
  component: FileActionCard,
  parameters: { layout: "centered" },
  decorators: [(Story) => <AppSnackbarProvider><Story /></AppSnackbarProvider>],
} satisfies Meta<typeof FileActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFiles: Story = {
  args: {
    files: [],
    title: "첨부 서류",
  },
  render: function RenderWithFiles() {
    const [files, setFiles] = useState<FileActionCardFile[]>([
      { fileId: "file-1", fileName: "사업자등록증.pdf", size: 124000 },
      "참여기술인_명단.xlsx",
    ]);

    return (
      <FileActionCard
        checked
        files={files}
        onDeleteFile={(fileName) => setFiles((current) => current.filter((file) => (typeof file === "string" ? file : file.fileName) !== fileName))}
        onUpload={() => undefined}
        title="첨부 서류"
        uploadLabel="파일 선택"
      />
    );
  },
};
