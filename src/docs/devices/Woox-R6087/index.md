---
title: Woox R6087 Plug 16/20A
date-published: 2023-09-27
type: plug
standard: eu
board: bk72xx
difficulty: 4
---

## Notes

![Woox R6087](woox-r6087-large.jpg "Woox R6087")

## GPIO Pinout

| Pin | Function      |
| --- | ------------- |
| P6  | Button        |
| P24 | Relay         |
| P8  | LED, inverted |
| P7  | Status LED    |

## Board Configuration

```yaml
bk72xx:
  board: wb2s
  framework:
    version: latest
    options:
      LT_UART_DEFAULT_PORT: 1
```
