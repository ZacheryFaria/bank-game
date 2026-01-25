import React from "react";
import { Box, Text } from "ink";

type StatusBarItem = {
  key: string;
  label: string;
};

type StatusBarProps = {
  items: StatusBarItem[];
  status?: {
    message: string;
    color?: string;
  };
};

export function StatusBar({ items, status }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      {status ? (
        <Text color={status.color}>{status.message}</Text>
      ) : (
        <Text> </Text>
      )}
      <Text>
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 && <Text dimColor> | </Text>}
            <Text color="cyan">{item.key}</Text>
            <Text> {item.label}</Text>
          </React.Fragment>
        ))}
      </Text>
    </Box>
  );
}
