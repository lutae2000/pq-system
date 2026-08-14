import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { KakaoPostcodeFields, type KakaoPostcodeResult } from "../KakaoPostcodeFields";

const meta = {
  title: "Common/KakaoPostcodeFields",
  component: KakaoPostcodeFields,
  parameters: { layout: "centered" },
} satisfies Meta<typeof KakaoPostcodeFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: {
    address: "서울특별시 용산구 한강대로 100",
    addressDetail: "10층",
    onChange: () => undefined,
    postalCode: "04386",
  },
  render: () => {
    const [value, setValue] = useState<KakaoPostcodeResult>({
      address: "서울특별시 용산구 한강대로 100",
      addressDetail: "10층",
      postalCode: "04386",
    });

    return (
      <Box sx={{ width: 560 }}>
        <KakaoPostcodeFields
          address={value.address}
          addressDetail={value.addressDetail}
          onChange={setValue}
          postalCode={value.postalCode}
        />
      </Box>
    );
  },
};
