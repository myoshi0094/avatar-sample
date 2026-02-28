import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { TalkButton } from "./TalkButton";

const meta: Meta<typeof TalkButton> = {
  component: TalkButton,
  parameters: {
    layout: "centered",
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TalkButton>;

export const Default: Story = {
  args: {
    isTalking: false,
  },
};

export const Talking: Story = {
  args: {
    isTalking: true,
  },
};
