# Bug Report: Device Mockup Renders Outside Selection Boundary

## Problem Summary
When importing or loading a project JSON where `device.x` is omitted or undefined:
- The device mockup frame is drawn in the top-left corner of the canvas at `(0, 0)`.
- The interactive selection boundary (blue outline with resize/rotate handles) appears in the horizontal center of the canvas.
- This creates a visual disconnect where the phone frame and the user's uploaded screenshot render outside the selection boundary.

---

## Root Causes

1. **Missing Coordinate Fallback in Canvas Renderer**
   - The device drawing function attempts to translate the canvas context using `device.x` directly.
   - If `device.x` is undefined, the horizontal translation fails and falls back to `0`, while vertical translation might succeed if `device.y` is present.
   - The SVG renderer already handles this with a fallback, but the HTML canvas renderer does not.

2. **MCP Tool `create_project` Does Not Merge Defaults**
   - When custom screen objects are passed to the MCP `create_project` tool, the incoming `device` object is copied directly into the project state without merging default properties.
   - As a result, if an agent or caller provides only partial device parameters (e.g., only `y`, `scale`, or `rotation`), required fields such as `x: 540`, `id: "device"`, `isDevice: true`, and the `devices` array are omitted from the generated JSON.

3. **Missing State Normalization on Project Import**
   - The web editor does not enforce or normalize required device coordinates upon loading an imported JSON file.
   - Bounding box calculation in the editor defaults missing X coordinates to the canvas center, while the drawing pipeline does not, causing the two to desynchronize.

---

## Required Tasks for the Agent to Fix

### 1. Canvas Device Renderer (`js/canvas/deviceFrames.js`)
- Update the device rendering function so that:
  - If `device.x` is missing, null, or undefined, it defaults to the horizontal center of the canvas (canvas width divided by 2, or standard preset center 540).
  - If `device.y` is missing, null, or undefined, it defaults to the standard preset baseline (1180).
  - Both the device frame and clipped user screenshot render at the resolved coordinates.

### 2. MCP Server Implementation (`mcp/tools.js`)
- In the `create_project` tool handler (specifically the custom `screens` array mapping branch):
  - Deep-merge every screen's `device` object with standard device defaults so `x: 540`, `y: 1180`, `scale`, `rotation`, and shadow defaults are always guaranteed to be written.
  - Automatically initialize and populate the `devices` array on each screen so it remains synchronized with `device`.
  - Ensure `id: "device"` and `isDevice: true` are present.

### 3. Editor State Normalization (`js/state/layers.js` / project loader)
- Ensure the layer helper / project initialization routine inspects incoming screen objects:
  - If any device object lacks `x`, assign canvas center (`width / 2`).
  - If any device object lacks `y`, assign standard vertical offset (`1180`).
  - Ensure the `devices` array exists on each screen and contains the primary device object.

### 4. Verification
- Verify that loading a JSON project where `device.x` is completely omitted correctly centers the phone frame on the canvas.
- Verify that clicking the phone mockup displays the blue selection boundary directly enclosing the rendered phone frame with zero coordinate offset.
