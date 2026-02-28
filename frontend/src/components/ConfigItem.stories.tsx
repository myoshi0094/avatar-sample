import type { Meta, StoryObj } from "@storybook/react";
import { ConfigItem } from "./ConfigItem";

const meta: Meta<typeof ConfigItem> = {
  component: ConfigItem,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ConfigItem>;

export const WithValue: Story = {
  args: {
    label: "ID",
    value: "avatar-001",
  },
};

export const WithMono: Story = {
  args: {
    label: "Color",
    value: "#4F46E5",
    mono: true,
  },
};

export const WithChildren: Story = {
  args: {
    label: "Visible",
    children: (
      <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300">
        true
      </span>
    ),
  },
};
