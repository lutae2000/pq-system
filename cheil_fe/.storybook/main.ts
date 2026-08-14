import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  stories: ["../components/**/*.stories.@(ts|tsx)", "../modules/**/*.stories.@(ts|tsx)"],
  addons: [],
  staticDirs: ["../public"],
};

export default config;
