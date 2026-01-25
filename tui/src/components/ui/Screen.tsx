import React, { ReactNode } from "react";
import { Box, Text } from "ink";

type ScreenProps = {
  title: string;
  icon?: string;
  children: ReactNode;
};

export function Screen({ title, icon, children }: ScreenProps) {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {icon && `${icon} `}
          {title}
        </Text>
      </Box>
      {children}
    </Box>
  );
}
