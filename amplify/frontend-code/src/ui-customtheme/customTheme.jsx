const CustomTheme = {
  name: "synthwave-theme",
  primaryColor: "pink",
  secondaryColor: "purple",
  tokens: {
    colors: {
      pink: {
        10: { value: "#fbc6ef" },
        20: { value: "#f893e0" },
        40: { value: "#f453ce" },
        60: { value: "#dc00a9" },
        80: { value: "#a80081" },
        90: { value: "#76005b" },
        100: { value: "#3b002d" },
      },
      purple: {
        10: { value: "#dfcefd" },
        20: { value: "#c4a6fb" },
        40: { value: "#a97df9" },
        60: { value: "#8c51f6" },
        80: { value: "#6618f4" },
        90: { value: "#4509b2" },
        100: { value: "#210555" },
      },
      green: {
        10: { value: "#31f38f" },
        20: { value: "#29ce79" },
        40: { value: "#22aa64" },
        60: { value: "#1b874f" },
        80: { value: "#14663c" },
        90: { value: "#0e4629" },
        100: { value: "#0e4629" },
      },
      neutral: {
        10: { value: "#e3dee3" },
        20: { value: "#bdb2bd" },
        40: { value: "#7b6a80" },
        60: { value: "#41354f" },
        80: { value: "#231934" },
        90: { value: "#180d2a" },
        100: { value: "#0c001f" },
      },
      border: {
        primary: { value: "{colors.neutral.90}" },
        secondary: { value: "{colors.neutral.80}" },
        tertiary: { value: "{colors.neutral.60}" },
      },
    },
    borderWidths: {
      none: { value: "0px" },
      small: { value: "2px" },
      medium: { value: "4px" },
      large: { value: "8px" },
    },
    radii: {
      xs: { value: "1rem" },
      small: { value: "2rem" },
      medium: { value: "2rem" },
      large: { value: "2rem" },
      xl: { value: "3rem" },
      sq: { value: "0rem" },
    },
    space: {
      xs: { value: "0.75rem" },
      small: { value: "1rem" },
      medium: { value: "1.5rem" },
      large: { value: "2rem" },
      xl: { value: "3rem" },
    },
    components: {
      radiogroup: {
        radio: {
          borderWidth: { value: 'none' },
          borderColor: { value: '{colors.purple.40}' },
          backgroundColor: { value: '{colors.purple.40}' },
          _checked: {
            color: { value: '{colors.purple.80}' },
          },
          label: {
            color: { value: '{colors.black.80}' },
            fontSize: { value: "1rem" }
          },
        },
        legend: {
          color: { value: '{colors.purple.80}' },
          fontWeight: { value: '{fontWeights.bold}' },
        },
      },
      textareafield: {
        color: { value: "{colors.red.90}" },
        backgroundColor: { value: "colors.yellow" },
        _focus: {
          borderColor: { value: "transparent" },
        },
      },
      pagination: {
        current: {
          backgroundColor: { value: "purple" },
          color: { value: "white" },
        },
        button: {
          hover: {
            backgroundColor: { value: "purple" },
            color: { value: "white" },
          },
        },
      },
    },
  },
};

export default CustomTheme;
