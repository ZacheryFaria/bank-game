import React from "react";
import { Box, Text } from "ink";

type StatusBarItem = {
  key: string;
  label: string;
};

type StatusBarProps = {
  items: StatusBarItem[];
};

export function StatusBar({ items }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
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
