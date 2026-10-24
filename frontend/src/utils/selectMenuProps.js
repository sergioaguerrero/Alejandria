/**
 * @file selectMenuProps.js
 * @description Shared props for the Select menus to avoid a MUI quirk.
 *
 * On opening, this MUI version positions the menu over the trigger and, when
 * the click that opened it is released slowly, it selects the option that ends
 * up under the cursor (see the mouseup guard with 200/400 ms delays in
 * @mui/material/Select/SelectInput). Stopping the mouseup inside the menu list
 * cancels that stray selection; choosing an option still works through the
 * item's own click event.
 */

/** MenuProps that keep the opening click from picking the option under the cursor. */
export const SELECT_MENU_PROPS = {
  slotProps: {
    list: { onMouseUpCapture: (event) => event.stopPropagation() },
  },
};
