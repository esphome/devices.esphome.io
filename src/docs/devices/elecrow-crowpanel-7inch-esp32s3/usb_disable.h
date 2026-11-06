#pragma once

#include "soc/usb_serial_jtag_reg.h"
#include "soc/io_mux_reg.h"
#include "hal/usb_serial_jtag_ll.h"

static __attribute__((constructor(101))) void disable_usb_serial_jtag_phy() {
    usb_serial_jtag_ll_phy_enable_pad(false);
    CLEAR_PERI_REG_MASK(USB_SERIAL_JTAG_CONF0_REG, USB_SERIAL_JTAG_USB_PAD_ENABLE);
    CLEAR_PERI_REG_MASK(USB_SERIAL_JTAG_CONF0_REG, USB_SERIAL_JTAG_DP_PULLUP);
    PIN_FUNC_SELECT(IO_MUX_GPIO19_REG, PIN_FUNC_GPIO);
    PIN_FUNC_SELECT(IO_MUX_GPIO20_REG, PIN_FUNC_GPIO);
    PIN_INPUT_ENABLE(IO_MUX_GPIO19_REG);
    PIN_INPUT_ENABLE(IO_MUX_GPIO20_REG);
    REG_SET_BIT(IO_MUX_GPIO19_REG, FUN_PU);
    REG_SET_BIT(IO_MUX_GPIO20_REG, FUN_PU);
    REG_CLR_BIT(IO_MUX_GPIO19_REG, FUN_PD);
    REG_CLR_BIT(IO_MUX_GPIO20_REG, FUN_PD);
}
