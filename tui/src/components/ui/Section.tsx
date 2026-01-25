import React, { ReactNode } from "react";
import { Box, Text } from "ink";

type SectionProps = {
  title?: string;
  children: ReactNode;
  borderColor?: string;
};

export function Section({ title, children, borderColor = "gray" }: SectionProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      {title && (
        <Text bold color={borderColor === "cyan" ? "cyan" : undefined}>
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}
