import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { CommonSelectField } from "../CommonSelectField";
import { SearchPanel } from "../SearchPanel";

const meta = {
  title: "Common/SearchPanel",
  component: SearchPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchPanelWithFilter() {
  const [keyword, setKeyword] = useState("홍길동");
  const [status, setStatus] = useState<"" | "Y" | "N">("");

  return (
    <SearchPanel keyword={keyword} onKeywordChange={setKeyword} onReset={() => setKeyword("")} onSearch={() => undefined}>
      <CommonSelectField
        label="상태"
        onChange={setStatus}
        options={[
          { label: "사용", value: "Y" },
          { label: "미사용", value: "N" },
        ]}
        placeholder="전체"
        placeholderDisabled={false}
        sx={{ minWidth: 160 }}
        value={status}
      />
    </SearchPanel>
  );
}

export const WithFilter: Story = {
  args: {
    keyword: "홍길동",
    onKeywordChange: () => undefined,
    onReset: () => undefined,
    onSearch: () => undefined,
  },
  render: () => <SearchPanelWithFilter />,
};
