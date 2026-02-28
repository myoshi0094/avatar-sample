import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#030712" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
